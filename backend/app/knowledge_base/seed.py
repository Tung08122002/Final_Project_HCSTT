from sqlalchemy import func, select

from app.models.entities import Attribute, Rule, RuleAction, RuleCondition

PURPOSES = [
    "student",
    "office",
    "programming",
    "gaming",
    "graphics",
    "video_editing",
    "ai_data_science",
    "engineering",
    "other",
]


def seed_attributes():
    attrs = []

    def add(
        name,
        label,
        kind="number",
        values=None,
        merge="first",
        field=None,
        op="=",
        category="other",
        unit=None,
    ):
        attrs.append(
            dict(
                name=name,
                label=label,
                data_type=kind,
                allowed_values=values or [],
                merge_strategy=merge,
                product_field=field,
                match_operator=op,
                score_category=category,
                unit=unit,
                active=True,
            )
        )

    add("purpose", "Mục đích chính", "enum", PURPOSES)
    add("secondary_purpose", "Mục đích phụ", "enum", PURPOSES)
    add("gaming_level", "Mức độ chơi game", "enum", ["casual", "medium", "high"])
    add("mobility_priority", "Nhu cầu di chuyển", "enum", ["low", "medium", "high"])
    add(
        "budget_min",
        "Ngân sách tối thiểu",
        field="price",
        op=">=",
        category="budget",
        unit="VND",
        merge="max",
    )
    add(
        "budget_max",
        "Ngân sách tối đa",
        field="price",
        op="<=",
        category="budget",
        unit="VND",
        merge="min",
    )
    for name, label, field, op, cat, merge, unit in [
        ("min_ram", "RAM tối thiểu", "ram_gb", ">=", "ram", "max", "GB"),
        ("preferred_ram", "RAM mong muốn", "ram_gb", ">=", "ram", "max", "GB"),
        (
            "min_storage",
            "Dung lượng tối thiểu",
            "storage_gb",
            ">=",
            "storage",
            "max",
            "GB",
        ),
        ("max_weight", "Trọng lượng tối đa", "weight_kg", "<=", "weight", "min", "kg"),
        (
            "min_refresh_rate",
            "Tần số quét tối thiểu",
            "refresh_rate_hz",
            ">=",
            "display",
            "max",
            "Hz",
        ),
        (
            "min_screen_size",
            "Màn hình tối thiểu",
            "screen_size_inch",
            ">=",
            "display",
            "max",
            "inch",
        ),
        (
            "min_gpu_level",
            "Mức GPU tối thiểu (demo)",
            "gpu_level",
            ">=",
            "gpu",
            "max",
            None,
        ),
    ]:
        add(name, label, merge=merge, field=field, op=op, category=cat, unit=unit)
    add(
        "require_dedicated_gpu",
        "Cần GPU rời",
        "boolean",
        merge="or",
        field="has_dedicated_gpu",
        category="gpu",
    )
    add(
        "preferred_gpu_type",
        "Loại GPU",
        "enum",
        ["integrated", "dedicated"],
        field="gpu_type",
        category="gpu",
    )
    add(
        "preferred_gpu_vendor",
        "Hãng GPU",
        "enum",
        ["NVIDIA", "AMD", "Intel", "Apple", "Qualcomm"],
        field="gpu_vendor",
        category="gpu",
    )
    add(
        "preferred_storage_type",
        "Loại ổ lưu trữ",
        "enum",
        ["SSD", "HDD"],
        field="storage_type",
        category="storage",
    )
    add("preferred_gpu_level", "Gợi ý GPU", "string")
    add("price_segment", "Phân khúc giá", "enum", ["under_20m", "mid_range", "premium"])
    add("performance_class", "Mức hiệu năng", "enum", ["basic", "balanced", "high"])
    for name, label, field, cat in [
        ("brand", "Nhãn hàng", "brand", "other"),
        ("cpu", "CPU", "cpu", "other"),
        ("gpu", "GPU cụ thể", "gpu", "gpu"),
        ("color", "Màu sắc", "color", "other"),
        ("display", "Màn hình cụ thể", "display_raw", "display"),
        ("preferred_cpu_vendor", "Hãng CPU", "cpu_vendor", "other"),
    ]:
        add(name, label, "string", field=field, category=cat)
    return attrs


def seed_rules():
    rules = []

    def add(code, title, category, conditions, actions, priority=50):
        rules.append(
            dict(
                rule_code=code,
                rule_name=title,
                category=category,
                description=title + " — luật tư vấn mẫu, có thể chỉnh sửa.",
                priority=priority,
                enabled=True,
                logical_operator="AND",
                conditions=[
                    dict(
                        attribute=k,
                        operator=op,
                        value=v,
                        logical_group=0,
                        group_operator="AND",
                        sort_order=i,
                    )
                    for i, (k, op, v) in enumerate(conditions)
                ],
                actions=[
                    dict(fact_name=k, fact_value=v, score_delta=0, message=title)
                    for k, v in actions.items()
                ],
            )
        )

    add(
        "R001",
        "Văn phòng linh hoạt",
        "Office",
        [("purpose", "=", "office"), ("mobility_priority", "=", "high")],
        {"min_ram": 8, "max_weight": 1.6, "preferred_gpu_type": "integrated"},
        90,
    )
    add(
        "R002",
        "Gaming tầm trung",
        "Gaming",
        [("purpose", "=", "gaming"), ("gaming_level", "=", "medium")],
        {
            "min_ram": 16,
            "require_dedicated_gpu": True,
            "preferred_gpu_level": "RTX3050_or_higher",
        },
        100,
    )
    add(
        "R003",
        "Lập trình đa nhiệm",
        "Programming",
        [("purpose", "=", "programming")],
        {"min_ram": 16, "preferred_storage_type": "SSD"},
        80,
    )
    add(
        "R004",
        "AI và khoa học dữ liệu",
        "AI / Data Science",
        [("purpose", "=", "ai_data_science")],
        {
            "min_ram": 16,
            "preferred_ram": 32,
            "require_dedicated_gpu": True,
            "preferred_gpu_vendor": "NVIDIA",
        },
        100,
    )
    add(
        "R005",
        "Ưu tiên di chuyển",
        "Mobility",
        [("mobility_priority", "=", "high")],
        {"max_weight": 1.6},
        80,
    )
    add(
        "R006",
        "Ngân sách dưới 20 triệu",
        "Budget",
        [("budget_max", "<=", 20000000)],
        {"price_segment": "under_20m"},
        70,
    )
    add(
        "R007",
        "Sinh viên cơ bản",
        "Student",
        [("purpose", "=", "student")],
        {"min_ram": 8, "min_storage": 256, "preferred_storage_type": "SSD"},
        60,
    )
    add(
        "R008",
        "Công việc văn phòng",
        "Office",
        [("purpose", "=", "office")],
        {"min_ram": 8, "min_storage": 256},
        60,
    )
    add(
        "R009",
        "Gaming chuyên sâu",
        "Gaming",
        [("purpose", "=", "gaming"), ("gaming_level", "=", "high")],
        {
            "min_ram": 32,
            "require_dedicated_gpu": True,
            "min_refresh_rate": 144,
            "min_gpu_level": 3,
        },
        110,
    )
    add(
        "R010",
        "GPU rời trong tầm 30 triệu",
        "GPU",
        [("require_dedicated_gpu", "=", True), ("budget_max", "<=", 30000000)],
        {"preferred_gpu_level": "RTX3050_or_higher", "min_gpu_level": 2},
        85,
    )
    add(
        "R011",
        "Thiết kế đồ họa",
        "Graphics",
        [("purpose", "=", "graphics")],
        {"min_ram": 16, "require_dedicated_gpu": True, "min_screen_size": 14},
        90,
    )
    add(
        "R012",
        "Dựng video",
        "Video Editing",
        [("purpose", "=", "video_editing")],
        {"min_ram": 32, "min_storage": 1024, "require_dedicated_gpu": True},
        100,
    )
    add(
        "R013",
        "Kỹ thuật và mô phỏng",
        "Engineering",
        [("purpose", "=", "engineering")],
        {"min_ram": 16, "require_dedicated_gpu": True, "performance_class": "high"},
        90,
    )
    add(
        "R014",
        "Chơi game nhẹ",
        "Gaming",
        [("purpose", "=", "gaming"), ("gaming_level", "=", "casual")],
        {"min_ram": 16, "preferred_gpu_level": "entry_or_integrated"},
        70,
    )
    add(
        "R015",
        "Chơi game nhẹ ngoài công việc",
        "Gaming",
        [("secondary_purpose", "=", "gaming"), ("gaming_level", "=", "casual")],
        {"require_dedicated_gpu": False, "preferred_gpu_level": "entry_or_integrated"},
        40,
    )
    add(
        "R016",
        "Game phụ tầm trung hoặc cao",
        "Gaming",
        [
            ("secondary_purpose", "=", "gaming"),
            ("gaming_level", "IN", ["medium", "high"]),
        ],
        {"min_ram": 16, "require_dedicated_gpu": True},
        90,
    )
    add(
        "R017",
        "Di chuyển vừa phải",
        "Mobility",
        [("mobility_priority", "=", "medium")],
        {"max_weight": 2.0},
        60,
    )
    add(
        "R018",
        "Màn hình cho GPU rời",
        "Display",
        [("require_dedicated_gpu", "=", True), ("purpose", "=", "gaming")],
        {"min_refresh_rate": 120},
        70,
    )
    add(
        "R019",
        "SSD cho lập trình",
        "Storage",
        [("purpose", "=", "programming")],
        {"min_storage": 512},
        60,
    )
    add(
        "R020",
        "RAM cho tác vụ chuyên sâu",
        "RAM",
        [("performance_class", "=", "high")],
        {"min_ram": 16},
        70,
    )
    add(
        "R021",
        "Phân loại tác vụ chuyên sâu",
        "CPU",
        [("purpose", "IN", ["ai_data_science", "video_editing", "engineering"])],
        {"performance_class": "high"},
        80,
    )
    add(
        "R022",
        "Ngân sách 20–30 triệu",
        "Budget",
        [("budget_max", ">", 20000000), ("budget_max", "<=", 30000000)],
        {"price_segment": "mid_range"},
        60,
    )
    add(
        "R023",
        "Ngân sách trên 30 triệu",
        "Budget",
        [("budget_max", ">", 30000000)],
        {"price_segment": "premium"},
        60,
    )
    add(
        "R024",
        "Dung lượng cho AI",
        "Storage",
        [("purpose", "=", "ai_data_science")],
        {"min_storage": 1024},
        75,
    )
    add(
        "R025",
        "Nền tảng cơ bản",
        "General",
        [("purpose", "IN", PURPOSES)],
        {"min_ram": 8, "preferred_storage_type": "SSD"},
        10,
    )
    add(
        "R026",
        "Nền tảng GPU rời",
        "GPU",
        [("require_dedicated_gpu", "=", True)],
        {"preferred_gpu_type": "dedicated"},
        95,
    )
    add(
        "R027",
        "Cấu hình cân bằng",
        "CPU",
        [("purpose", "IN", ["programming", "graphics"])],
        {"performance_class": "balanced"},
        60,
    )
    add(
        "R028",
        "Màn hình làm việc",
        "Display",
        [("purpose", "IN", ["programming", "engineering", "video_editing"])],
        {"min_screen_size": 14},
        50,
    )
    add(
        "R029",
        "Lưu trữ cho gaming",
        "Storage",
        [("purpose", "=", "gaming")],
        {"min_storage": 512},
        60,
    )
    add(
        "R030",
        "RAM dư địa cho phân khúc cao",
        "RAM",
        [
            ("price_segment", "=", "premium"),
            ("performance_class", "IN", ["high", "balanced"]),
        ],
        {"preferred_ram": 32},
        50,
    )
    return rules


def seed_database(db):
    # Seed only a fresh knowledge base. Deleted demo rules stay deleted after restart.
    if db.scalar(select(func.count()).select_from(Attribute)) or db.scalar(
        select(func.count()).select_from(Rule)
    ):
        return {"seeded": False}
    db.add_all([Attribute(**a) for a in seed_attributes()])
    for item in seed_rules():
        data = dict(item)
        conditions, actions = data.pop("conditions"), data.pop("actions")
        db.add(
            Rule(
                **data,
                conditions=[RuleCondition(**c) for c in conditions],
                actions=[RuleAction(**a) for a in actions],
            )
        )
    db.commit()
    return {"seeded": True, "rules": 30, "attributes": len(seed_attributes())}
