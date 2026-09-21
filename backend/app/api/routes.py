from io import BytesIO
from typing import Literal

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.importers.excel import import_excel
from app.models.entities import Attribute, ConsultationSession, Product, Rule
from app.repositories.catalog import CatalogRepository, rule_dict, serialize
from app.schemas.contracts import (
    AttributeInput,
    InferenceInput,
    ProductBulkDeleteInput,
    ProductInput,
    RuleInput,
)
from app.services.consultation import run_consultation
from app.services.knowledge import attribute_in_use, save_attribute, save_rule

router = APIRouter(prefix="/api")


def require(db, model, id):
    obj = db.get(model, id)
    if obj is None:
        raise HTTPException(404, "Không tìm thấy dữ liệu")
    return obj


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    def count(model):
        return db.scalar(select(func.count()).select_from(model))

    return {
        "total_products": count(Product),
        "total_brands": db.scalar(select(func.count(func.distinct(Product.brand)))),
        "total_rules": count(Rule),
        "active_rules": db.scalar(
            select(func.count()).select_from(Rule).where(Rule.enabled.is_(True))
        ),
        "total_attributes": count(Attribute),
        "consultation_sessions": count(ConsultationSession),
        "brands": [
            {"name": name or "Chưa rõ", "count": n}
            for name, n in db.execute(
                select(Product.brand, func.count())
                .group_by(Product.brand)
                .order_by(func.count().desc())
            )
        ],
        "recent_consultations": consultations(1, 5, db)["items"],
    }


@router.get("/products")
def products(
    q: str = "",
    brand: str = "",
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    sort: Literal["price", "-price", "product_name", "-id"] = "product_name",
    db: Session = Depends(get_db),
):
    return CatalogRepository(db).products(q, brand, page, page_size, sort)


@router.get("/products/autocomplete")
def autocomplete(
    field: Literal["brand", "cpu", "gpu", "color", "display_raw", "ram_gb", "storage_gb"] = "brand",
    q: str = "",
    db: Session = Depends(get_db),
):
    from sqlalchemy import String, cast

    column = getattr(Product, field)
    return list(
        db.scalars(
            select(column)
            .where(column.is_not(None), cast(column, String).ilike(f"%{q}%"))
            .distinct()
            .order_by(column)
            .limit(30)
        )
    )


@router.post("/products/import")
def import_products(
    file: UploadFile = File(...),
    update_existing: bool = True,
    db: Session = Depends(get_db),
):
    if not (file.filename or "").lower().endswith(".xlsx"):
        raise HTTPException(422, "Chỉ hỗ trợ Excel .xlsx")
    payload = file.file.read(20 * 1024 * 1024 + 1)
    if len(payload) > 20 * 1024 * 1024:
        raise HTTPException(413, "File tối đa 20 MB")
    try:
        return import_excel(db, BytesIO(payload), update_existing)
    except ValueError:
        raise
    except Exception as exc:
        raise HTTPException(422, "Không đọc được Excel. Kiểm tra file và định dạng.") from exc


@router.get("/products/{id}")
def product(id: int, db: Session = Depends(get_db)):
    return serialize(require(db, Product, id))


@router.post("/products", status_code=201)
def create_product(data: ProductInput, db: Session = Depends(get_db)):
    obj = Product(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return serialize(obj)


@router.delete("/products")
def delete_products(data: ProductBulkDeleteInput, db: Session = Depends(get_db)):
    selected = list(db.scalars(select(Product).where(Product.id.in_(data.ids))))
    if {product.id for product in selected} != data.ids:
        raise HTTPException(
            404, "Một hoặc nhiều laptop đã không còn tồn tại; hãy tải lại danh sách"
        )
    for product in selected:
        db.delete(product)
    db.commit()
    return {"deleted": len(selected)}


@router.put("/products/{id}")
def update_product(id: int, data: ProductInput, db: Session = Depends(get_db)):
    obj = require(db, Product, id)
    for key, value in data.model_dump().items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return serialize(obj)


@router.delete("/products/{id}", status_code=204)
def delete_product(id: int, db: Session = Depends(get_db)):
    db.delete(require(db, Product, id))
    db.commit()


@router.get("/attributes")
def attributes(db: Session = Depends(get_db)):
    return CatalogRepository(db).attributes()


@router.post("/attributes", status_code=201)
def create_attribute(data: AttributeInput, db: Session = Depends(get_db)):
    return serialize(save_attribute(db, data))


@router.put("/attributes/{id}")
def update_attribute(id: int, data: AttributeInput, db: Session = Depends(get_db)):
    return serialize(save_attribute(db, data, require(db, Attribute, id)))


@router.delete("/attributes/{id}", status_code=204)
def delete_attribute(id: int, db: Session = Depends(get_db)):
    obj = require(db, Attribute, id)
    if attribute_in_use(db, obj.name):
        raise HTTPException(409, "Thuộc tính đang được luật sử dụng")
    db.delete(obj)
    db.commit()


@router.get("/rules")
def rules(db: Session = Depends(get_db)):
    return CatalogRepository(db).rules()


@router.get("/rules/{id}")
def rule(id: int, db: Session = Depends(get_db)):
    return rule_dict(require(db, Rule, id))


@router.post("/rules", status_code=201)
def create_rule(data: RuleInput, db: Session = Depends(get_db)):
    return save_rule(db, data)


@router.put("/rules/{id}")
def update_rule(id: int, data: RuleInput, db: Session = Depends(get_db)):
    return save_rule(db, data, require(db, Rule, id))


@router.delete("/rules/{id}", status_code=204)
def delete_rule(id: int, db: Session = Depends(get_db)):
    db.delete(require(db, Rule, id))
    db.commit()


@router.post("/inference/run")
def inference(data: InferenceInput, db: Session = Depends(get_db)):
    return run_consultation(db, data)


@router.post("/consultations", status_code=201)
def consult(data: InferenceInput, db: Session = Depends(get_db)):
    return run_consultation(db, data, persist=True)


@router.get("/consultations")
def consultations(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db),
):
    rows = db.scalars(
        select(ConsultationSession)
        .order_by(ConsultationSession.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return {
        "items": [
            {
                "id": s.id,
                "created_at": s.created_at,
                "initial_facts": s.initial_facts_json,
                "rules_fired": len(s.recommendation_json["steps"]),
                "recommendation_count": len(s.recommendation_json["recommended_products"]),
            }
            for s in rows
        ],
        "total": db.scalar(select(func.count()).select_from(ConsultationSession)),
        "page": page,
    }


@router.get("/consultations/{id}")
def consultation(id: int, db: Session = Depends(get_db)):
    session = require(db, ConsultationSession, id)
    return {
        **session.recommendation_json,
        "session_id": session.id,
        "created_at": session.created_at,
    }
