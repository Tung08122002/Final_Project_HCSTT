from app.inference.engine import evaluate_condition
from app.utils.normalization import normalize_cpu, normalize_gpu

WEIGHTS = {
    "budget": 25,
    "ram": 20,
    "gpu": 25,
    "storage": 10,
    "display": 10,
    "weight": 10,
}
LABELS = {
    "budget": "Ngân sách",
    "ram": "RAM",
    "gpu": "GPU",
    "storage": "Lưu trữ",
    "display": "Màn hình",
    "weight": "Trọng lượng",
    "other": "Tùy chọn khác",
}


def product_features(product):
    gpu = normalize_gpu(product.get("gpu"))
    return {
        **product,
        **gpu,
        "has_dedicated_gpu": None if gpu["gpu_type"] is None else gpu["gpu_type"] == "dedicated",
        **normalize_cpu(product.get("cpu")),
        "storage_type": "SSD"
        if "SSD" in (product.get("storage_raw") or "").upper()
        else "HDD"
        if "HDD" in (product.get("storage_raw") or "").upper()
        else None,
    }


def match_products(products, facts, attributes, provenance, limit=6):
    requirements = [
        a
        for a in attributes
        if a["active"]
        and a["product_field"]
        and a["name"] in facts
        # False boolean requirements mean "not required", rather than forbidding it.
        and not (a["data_type"] == "boolean" and facts[a["name"]] is False)
    ]
    ranked = []
    for product in products:
        features = product_features(product)
        criteria = []
        hard_failure = False
        for attr in requirements:
            name, field, category = (
                attr["name"],
                attr["product_field"],
                attr["score_category"],
            )
            actual, target = features.get(field), facts[name]
            status = (
                "unknown"
                if actual is None
                else "met"
                if evaluate_condition(
                    {
                        "attribute": field,
                        "operator": attr["match_operator"],
                        "value": target,
                    },
                    features,
                )
                else "unmet"
            )
            if category in ("budget", "other") and status != "met":
                hard_failure = True
            criteria.append(
                {
                    "fact": name,
                    "label": attr["label"],
                    "category": category,
                    "actual": actual,
                    "operator": attr["match_operator"],
                    "expected": target,
                    "status": status,
                    "source_rules": provenance.get(name, []),
                }
            )
        if hard_failure:
            continue
        active_categories = {c["category"] for c in criteria if c["category"] in WEIGHTS}
        denominator = sum(WEIGHTS[c] for c in active_categories)
        earned = 0
        breakdown = []
        for category, weight in WEIGHTS.items():
            checks = [c for c in criteria if c["category"] == category]
            points = (
                weight * sum(c["status"] == "met" for c in checks) / len(checks) if checks else 0
            )
            earned += points
            for c in checks:
                c["points"] = round(weight / len(checks), 2) if c["status"] == "met" else 0
                c["max_points"] = round(weight / len(checks), 2)
            breakdown.append(
                {
                    "category": category,
                    "label": LABELS[category],
                    "points": round(points, 2),
                    "max_points": weight if checks else 0,
                    "applicable": bool(checks),
                }
            )
        ranked.append(
            {
                "product": product,
                "score": round(100 * earned / denominator, 1) if denominator else 0,
                "criteria": criteria,
                "score_breakdown": breakdown,
                "fully_matched": all(c["status"] == "met" for c in criteria),
                "reasons": [
                    f"{c['label']}: {c['actual']} {c['operator']} {c['expected']}"
                    for c in criteria
                    if c["status"] == "met"
                ],
                "tradeoffs": [
                    f"{c['label']}: {'chưa xác định' if c['status'] == 'unknown' else str(c['actual'])}; cần {c['operator']} {c['expected']}"
                    for c in criteria
                    if c["status"] != "met"
                ],
            }
        )
    ranked.sort(
        key=lambda r: (
            -r["score"],
            r["product"].get("price") if r["product"].get("price") is not None else float("inf"),
            r["product"]["product_code"],
        )
    )
    return ranked[:limit], len(ranked), requirements
