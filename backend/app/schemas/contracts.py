from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, PositiveInt, model_validator

Operator = Literal["=", "!=", ">", ">=", "<", "<=", "IN", "NOT IN", "CONTAINS"]


class InputModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, allow_inf_nan=False)


class ProductInput(InputModel):
    product_code: str = Field(min_length=1, max_length=100)
    product_name: str = Field(min_length=1)
    price: float | None = Field(default=None, ge=0)
    brand: str | None = None
    cpu: str | None = None
    gpu: str | None = None
    ram_gb: float | None = Field(default=None, ge=0)
    weight_raw: str | None = None
    weight_kg: float | None = Field(default=None, ge=0)
    storage_raw: str | None = None
    storage_gb: float | None = Field(default=None, ge=0)
    color: str | None = None
    display_raw: str | None = None
    screen_size_inch: float | None = Field(default=None, ge=0)
    resolution: str | None = None
    refresh_rate_hz: float | None = Field(default=None, ge=0)
    raw_data: dict = Field(default_factory=dict)
    normalization_notes: list = Field(default_factory=list)


class ProductBulkDeleteInput(InputModel):
    ids: set[PositiveInt] = Field(min_length=1)


class ConsultationBulkDeleteInput(InputModel):
    ids: set[PositiveInt] = Field(min_length=1, max_length=1000)


class AttributeInput(InputModel):
    name: str = Field(pattern=r"^[a-z][a-z0-9_]*$", max_length=100)
    label: str = Field(min_length=1)
    data_type: Literal["number", "string", "enum", "boolean"]
    unit: str | None = None
    description: str = ""
    allowed_values: list[str] = Field(default_factory=list)
    active: bool = True
    merge_strategy: Literal["first", "max", "min", "or"] = "first"
    product_field: str | None = None
    match_operator: Operator = "="
    score_category: Literal["budget", "ram", "gpu", "storage", "display", "weight", "other"] = (
        "other"
    )

    @model_validator(mode="after")
    def check_strategy(self):
        if self.merge_strategy in ("max", "min") and self.data_type != "number":
            raise ValueError("min/max chỉ dùng cho thuộc tính number")
        if self.merge_strategy == "or" and self.data_type != "boolean":
            raise ValueError("or chỉ dùng cho boolean")
        if self.data_type == "enum" and not self.allowed_values:
            raise ValueError("enum cần allowed_values")
        return self


class ConditionInput(InputModel):
    attribute: str
    operator: Operator = "="
    value: Any
    logical_group: int = Field(default=0, ge=0)
    group_operator: Literal["AND", "OR"] = "AND"
    sort_order: int = 0


class ActionInput(InputModel):
    fact_name: str
    fact_value: Any
    score_delta: float = 0
    message: str = ""


class RuleInput(InputModel):
    rule_code: str = Field(min_length=1, max_length=100)
    rule_name: str = Field(min_length=1)
    description: str = ""
    category: str = "General"
    priority: int = Field(default=50, ge=0, le=10000)
    enabled: bool = True
    logical_operator: Literal["AND", "OR"] = "AND"
    conditions: list[ConditionInput] = Field(min_length=1, max_length=100)
    actions: list[ActionInput] = Field(min_length=1, max_length=100)


class InferenceInput(InputModel):
    facts: dict[str, Any]
    limit: int = Field(default=6, ge=1, le=50)
    max_iterations: int = Field(default=200, ge=1, le=1000)
