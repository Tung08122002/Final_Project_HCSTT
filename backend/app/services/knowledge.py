from sqlalchemy import select

from app.models.entities import Attribute, Rule, RuleAction, RuleCondition
from app.repositories.catalog import CatalogRepository, rule_dict
from app.services.validation import validate_attribute, validate_rule


def save_rule(db, data, existing=None):
    validate_rule(data, CatalogRepository(db).attributes())
    values = data.model_dump()
    conditions, actions = values.pop("conditions"), values.pop("actions")
    rule = existing or Rule()
    for key, value in values.items():
        setattr(rule, key, value)
    rule.conditions = [RuleCondition(**c) for c in conditions]
    rule.actions = [RuleAction(**a) for a in actions]
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule_dict(rule)


def attribute_in_use(db, name):
    return bool(
        db.scalar(select(RuleCondition.id).where(RuleCondition.attribute == name).limit(1))
        or db.scalar(select(RuleAction.id).where(RuleAction.fact_name == name).limit(1))
    )


def save_attribute(db, data, existing=None):
    validate_attribute(data)
    if existing and attribute_in_use(db, existing.name):
        if existing.name != data.name or not data.active:
            raise ValueError(
                "Thuộc tính đang được luật sử dụng; hãy sửa/xóa các luật liên quan trước khi đổi tên hoặc tắt."
            )
        # Validate every existing rule against the proposed definition.
        attrs = [a for a in CatalogRepository(db).attributes() if a["name"] != existing.name] + [
            data.model_dump()
        ]
        from app.schemas.contracts import RuleInput

        for rule in CatalogRepository(db).rules():
            payload = {k: v for k, v in rule.items() if k not in ("id", "created_at", "updated_at")}
            payload["conditions"] = [
                {k: v for k, v in c.items() if k not in ("id", "rule_id")}
                for c in payload["conditions"]
            ]
            payload["actions"] = [
                {k: v for k, v in a.items() if k not in ("id", "rule_id")}
                for a in payload["actions"]
            ]
            validate_rule(RuleInput(**payload), attrs)
    attr = existing or Attribute()
    for key, value in data.model_dump().items():
        setattr(attr, key, value)
    db.add(attr)
    db.commit()
    db.refresh(attr)
    return attr
