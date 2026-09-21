from app.knowledge_base.seed import seed_attributes
from app.services.matching import match_products


def test_explicit_gpu_requirement_survives_disabled_derivation_rule():
    products = [
        {"id": 1, "product_code": "A", "price": 100, "gpu": "Intel Graphics (tích hợp)"},
        {"id": 2, "product_code": "B", "price": 100, "gpu": "NVIDIA RTX 4050"},
    ]
    results, _, _ = match_products(
        products,
        {"require_dedicated_gpu": True},
        seed_attributes(),
        {"require_dedicated_gpu": ["USER"]},
    )
    assert results[0]["product"]["product_code"] == "B"
    assert results[0]["score"] == 100
    assert results[1]["score"] == 0
    assert results[1]["criteria"][0]["status"] == "unmet"


def test_false_gpu_requirement_does_not_forbid_dedicated_gpu():
    _, _, requirements = match_products([], {"require_dedicated_gpu": False}, seed_attributes(), {})
    assert not requirements
