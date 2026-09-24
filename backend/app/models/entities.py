from datetime import datetime, timezone
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def now():
    return datetime.now(timezone.utc)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(default=now)
    updated_at: Mapped[datetime] = mapped_column(default=now, onupdate=now)


class Product(TimestampMixin, Base):
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("price IS NULL OR price >= 0"),
        CheckConstraint("ram_gb IS NULL OR ram_gb >= 0"),
        CheckConstraint("weight_kg IS NULL OR weight_kg >= 0"),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    product_code: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    product_name: Mapped[str] = mapped_column(Text)
    price: Mapped[float | None] = mapped_column(Float)
    brand: Mapped[str | None] = mapped_column(String(100), index=True)
    cpu: Mapped[str | None] = mapped_column(Text)
    gpu: Mapped[str | None] = mapped_column(Text)
    ram_gb: Mapped[float | None] = mapped_column(Float)
    weight_raw: Mapped[str | None] = mapped_column(Text)
    weight_kg: Mapped[float | None] = mapped_column(Float)
    storage_raw: Mapped[str | None] = mapped_column(Text)
    storage_gb: Mapped[float | None] = mapped_column(Float)
    color: Mapped[str | None] = mapped_column(String(200))
    display_raw: Mapped[str | None] = mapped_column(Text)
    screen_size_inch: Mapped[float | None] = mapped_column(Float)
    resolution: Mapped[str | None] = mapped_column(String(100))
    refresh_rate_hz: Mapped[float | None] = mapped_column(Float)
    raw_data: Mapped[dict] = mapped_column(JSON, default=dict)
    normalization_notes: Mapped[list] = mapped_column(JSON, default=list)


class Attribute(Base):
    __tablename__ = "attributes"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    label: Mapped[str] = mapped_column(String(200))
    data_type: Mapped[str] = mapped_column(String(20))
    unit: Mapped[str | None] = mapped_column(String(30))
    description: Mapped[str] = mapped_column(Text, default="")
    allowed_values: Mapped[list] = mapped_column(JSON, default=list)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    merge_strategy: Mapped[str] = mapped_column(String(20), default="first")
    product_field: Mapped[str | None] = mapped_column(String(100))
    match_operator: Mapped[str] = mapped_column(String(20), default="=")
    score_category: Mapped[str] = mapped_column(String(30), default="other")


class Rule(TimestampMixin, Base):
    __tablename__ = "rules"
    id: Mapped[int] = mapped_column(primary_key=True)
    rule_code: Mapped[str] = mapped_column(String(100), unique=True)
    rule_name: Mapped[str] = mapped_column(String(250))
    description: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(100), default="General")
    priority: Mapped[int] = mapped_column(Integer, default=50)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    logical_operator: Mapped[str] = mapped_column(String(5), default="AND")
    conditions: Mapped[list["RuleCondition"]] = relationship(
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="RuleCondition.sort_order",
    )
    actions: Mapped[list["RuleAction"]] = relationship(
        cascade="all, delete-orphan", lazy="selectin"
    )


class RuleCondition(Base):
    __tablename__ = "rule_conditions"
    id: Mapped[int] = mapped_column(primary_key=True)
    rule_id: Mapped[int] = mapped_column(ForeignKey("rules.id", ondelete="CASCADE"))
    attribute: Mapped[str] = mapped_column(String(100))
    operator: Mapped[str] = mapped_column(String(20))
    value: Mapped[Any] = mapped_column(JSON)
    logical_group: Mapped[int] = mapped_column(Integer, default=0)
    group_operator: Mapped[str] = mapped_column(String(5), default="AND")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class RuleAction(Base):
    __tablename__ = "rule_actions"
    id: Mapped[int] = mapped_column(primary_key=True)
    rule_id: Mapped[int] = mapped_column(ForeignKey("rules.id", ondelete="CASCADE"))
    fact_name: Mapped[str] = mapped_column(String(100))
    fact_value: Mapped[Any] = mapped_column(JSON)
    score_delta: Mapped[float] = mapped_column(Float, default=0)
    message: Mapped[str] = mapped_column(Text, default="")


class ConsultationSession(Base):
    __tablename__ = "consultation_sessions"
    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[str] = mapped_column(String(80), index=True, server_default="demo-admin")
    created_at: Mapped[datetime] = mapped_column(default=now)
    initial_facts_json: Mapped[dict] = mapped_column(JSON)
    final_facts_json: Mapped[dict] = mapped_column(JSON)
    recommendation_json: Mapped[dict] = mapped_column(JSON)
    logs: Mapped[list["InferenceLog"]] = relationship(
        cascade="all, delete-orphan", order_by="InferenceLog.step_number"
    )


class InferenceLog(Base):
    __tablename__ = "inference_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("consultation_sessions.id", ondelete="CASCADE")
    )
    step_number: Mapped[int] = mapped_column(Integer)
    rule_id: Mapped[int | None] = mapped_column(
        ForeignKey("rules.id", ondelete="SET NULL"), nullable=True
    )
    facts_before: Mapped[dict] = mapped_column(JSON)
    matched_conditions: Mapped[list] = mapped_column(JSON)
    generated_facts: Mapped[dict] = mapped_column(JSON)
    facts_after: Mapped[dict] = mapped_column(JSON)
    conflict_set: Mapped[list] = mapped_column(JSON)
    selected_reason: Mapped[str] = mapped_column(Text)
