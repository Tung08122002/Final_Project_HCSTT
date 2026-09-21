from sqlalchemy import func, or_, select

from app.models.entities import Attribute, Product, Rule


def serialize(entity):
    return {c.name: getattr(entity, c.name) for c in entity.__table__.columns}


def rule_dict(rule):
    return {
        **serialize(rule),
        "conditions": [serialize(c) for c in rule.conditions],
        "actions": [serialize(a) for a in rule.actions],
    }


class CatalogRepository:
    def __init__(self, db):
        self.db = db

    def products(self, q="", brand="", page=1, page_size=12, sort="product_name"):
        query = select(Product)
        if q:
            query = query.where(
                or_(
                    Product.product_name.ilike(f"%{q}%"),
                    Product.product_code.ilike(f"%{q}%"),
                    Product.cpu.ilike(f"%{q}%"),
                    Product.gpu.ilike(f"%{q}%"),
                )
            )
        if brand:
            query = query.where(Product.brand == brand)
        total = self.db.scalar(select(func.count()).select_from(query.subquery()))
        order = {
            "price": Product.price.asc(),
            "-price": Product.price.desc(),
            "product_name": Product.product_name.asc(),
            "-id": Product.id.desc(),
        }[sort]
        items = self.db.scalars(
            query.order_by(order, Product.id).offset((page - 1) * page_size).limit(page_size)
        )
        return {
            "items": [serialize(p) for p in items],
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    def rules(self):
        return [
            rule_dict(r)
            for r in self.db.scalars(select(Rule).order_by(Rule.priority.desc(), Rule.rule_code))
        ]

    def attributes(self):
        return [serialize(a) for a in self.db.scalars(select(Attribute).order_by(Attribute.id))]
