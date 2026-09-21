import math

from app.schemas.contracts import AttributeInput, RuleInput

PRODUCT_FIELDS = {
    "price",
    "ram_gb",
    "weight_kg",
    "storage_gb",
    "refresh_rate_hz",
    "screen_size_inch",
    "brand",
    "cpu",
    "gpu",
    "color",
    "display_raw",
    "resolution",
    "gpu_type",
    "gpu_vendor",
    "gpu_level",
    "cpu_vendor",
    "storage_type",
    "has_dedicated_gpu",
}
NUMERIC_FIELDS = {
    "price",
    "ram_gb",
    "weight_kg",
    "storage_gb",
    "refresh_rate_hz",
    "screen_size_inch",
    "gpu_level",
}


def check_value(attribute, value):
    kind = attribute["data_type"]
    ok = (
        (kind == "number" and type(value) in (int, float) and math.isfinite(value))
        or (kind == "boolean" and type(value) is bool)
        or (kind in ("string", "enum") and isinstance(value, str))
    )
    if not ok:
        raise ValueError(f"{attribute['name']}: giá trị phải thuộc kiểu {kind}")
    if kind == "enum" and value not in attribute["allowed_values"]:
        raise ValueError(f"{attribute['name']}: giá trị không thuộc allowed_values")
    if kind == "number" and value < 0:
        raise ValueError(f"{attribute['name']}: giá trị phải >= 0")


def validate_facts(facts, attributes):
    lookup = {a["name"]: a for a in attributes if a["active"]}
    for name, value in facts.items():
        if name not in lookup:
            raise ValueError(f"Thuộc tính không tồn tại hoặc đã tắt: {name}")
        check_value(lookup[name], value)
    if facts.get("budget_min", 0) > facts.get("budget_max", float("inf")):
        raise ValueError("Ngân sách tối thiểu phải <= ngân sách tối đa")


def validate_attribute(data: AttributeInput):
    if data.product_field:
        if data.product_field not in PRODUCT_FIELDS:
            raise ValueError("product_field không hợp lệ")
        numeric = data.product_field in NUMERIC_FIELDS
        boolean = data.product_field == "has_dedicated_gpu"
        if numeric != (data.data_type == "number"):
            raise ValueError("Kiểu thuộc tính không khớp kiểu trường sản phẩm")
        if boolean != (data.data_type == "boolean"):
            raise ValueError("Kiểu thuộc tính không khớp kiểu trường sản phẩm")
        if boolean and data.match_operator not in ("=", "!="):
            raise ValueError("Trường boolean chỉ hỗ trợ = hoặc !=")
        if data.match_operator in ("IN", "NOT IN"):
            raise ValueError("Ánh xạ sản phẩm dùng giá trị đơn; hãy dùng = hoặc CONTAINS")
        if data.match_operator in (">", ">=", "<", "<=") and not numeric:
            raise ValueError("So sánh thứ tự cần trường sản phẩm dạng số")


def validate_rule(data: RuleInput, attributes):
    lookup = {a["name"]: a for a in attributes if a["active"]}
    groups = {}
    for c in data.conditions:
        if c.attribute not in lookup:
            raise ValueError(f"Unknown attribute: {c.attribute}")
        attr = lookup[c.attribute]
        if c.operator in (">", ">=", "<", "<=") and attr["data_type"] != "number":
            raise ValueError("So sánh thứ tự chỉ áp dụng cho number")
        if c.operator == "CONTAINS" and attr["data_type"] not in ("string", "enum"):
            raise ValueError("CONTAINS chỉ áp dụng cho chuỗi")
        if c.operator in ("IN", "NOT IN"):
            if not isinstance(c.value, list) or not c.value:
                raise ValueError("IN / NOT IN cần danh sách không rỗng")
            for v in c.value:
                check_value(attr, v)
        else:
            check_value(attr, c.value)
        if c.logical_group in groups and groups[c.logical_group] != c.group_operator:
            raise ValueError("Các điều kiện cùng nhóm phải có cùng group_operator")
        groups[c.logical_group] = c.group_operator
    for action in data.actions:
        if action.fact_name not in lookup:
            raise ValueError(f"Unknown attribute: {action.fact_name}")
        check_value(lookup[action.fact_name], action.fact_value)
