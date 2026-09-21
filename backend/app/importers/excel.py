import pandas as pd
from sqlalchemy import select

from app.models.entities import Product
from app.schemas.contracts import ProductInput
from app.utils.normalization import (
    clean,
    normalize_price,
    normalize_ram,
    normalize_refresh_rate,
    normalize_resolution,
    normalize_screen_size,
    normalize_storage,
    normalize_weight,
)

COLUMNS = [
    "STT",
    "Mã sản phẩm",
    "Tên sản phẩm",
    "Giá sản phẩm",
    "Nhãn hàng",
    "CPU",
    "GPU",
    "RAM",
    "Trọng lượng",
    "Dung lượng bộ nhớ",
    "Màu sắc",
    "Màn hình",
]


def normalize_row(row):
    raw = {str(k): clean(v) for k, v in row.items()}
    data = dict(
        product_code=raw["Mã sản phẩm"] or "",
        product_name=raw["Tên sản phẩm"] or "",
        price=normalize_price(row["Giá sản phẩm"]),
        brand=raw["Nhãn hàng"],
        cpu=raw["CPU"],
        gpu=raw["GPU"],
        ram_gb=normalize_ram(row["RAM"]),
        weight_raw=raw["Trọng lượng"],
        weight_kg=normalize_weight(row["Trọng lượng"]),
        storage_raw=raw["Dung lượng bộ nhớ"],
        storage_gb=normalize_storage(row["Dung lượng bộ nhớ"]),
        color=raw["Màu sắc"],
        display_raw=raw["Màn hình"],
        screen_size_inch=normalize_screen_size(row["Màn hình"]),
        resolution=normalize_resolution(row["Màn hình"]),
        refresh_rate_hz=normalize_refresh_rate(row["Màn hình"]),
        raw_data=raw,
    )
    notes = [
        f"Không xác định: {key}"
        for key in [
            "price",
            "ram_gb",
            "weight_kg",
            "storage_gb",
            "screen_size_inch",
            "refresh_rate_hz",
        ]
        if data[key] is None
    ]
    if any(s in (data["weight_raw"] or "").lower() for s in ["khoảng", "từ ", "tối đa", "tùy"]):
        notes.append("Trọng lượng tham khảo / phụ thuộc cấu hình; cần xác minh trước khi mua.")
    if "chưa" in (data["gpu"] or "").lower():
        notes.append("GPU chưa xác minh; không tự suy đoán từ tên sản phẩm.")
    return ProductInput(**data, normalization_notes=notes).model_dump()


def import_excel(db, source, update_existing=True):
    frame = pd.read_excel(source, engine="openpyxl", dtype=object)
    frame.columns = [str(x).strip() for x in frame.columns]
    missing = set(COLUMNS) - set(frame.columns)
    if missing:
        raise ValueError("Thiếu cột: " + ", ".join(sorted(missing)))
    report = dict(
        total=len(frame),
        created=0,
        updated=0,
        skipped=0,
        failed=0,
        duplicate_codes=[],
        errors=[],
        warnings=[],
    )
    seen = set()
    for index, row in frame.iterrows():
        try:
            values = normalize_row(row)
            code = values["product_code"]
            if code in seen:
                report["duplicate_codes"].append(code)
            seen.add(code)
            with db.begin_nested():
                existing = db.scalar(select(Product).where(Product.product_code == code))
                if existing and not update_existing:
                    report["skipped"] += 1
                    continue
                if existing:
                    for k, v in values.items():
                        setattr(existing, k, v)
                    status = "updated"
                else:
                    db.add(Product(**values))
                    status = "created"
                db.flush()
            report[status] += 1
            if values["normalization_notes"]:
                report["warnings"].append(
                    {
                        "row": int(index) + 2,
                        "code": code,
                        "notes": values["normalization_notes"],
                    }
                )
        except Exception as exc:
            report["failed"] += 1
            report["errors"].append(
                {
                    "row": int(index) + 2,
                    "error": str(exc),
                    "raw_data": {str(k): clean(v) for k, v in row.items()},
                }
            )
    db.commit()
    report["success"] = report["created"] + report["updated"]
    return report
