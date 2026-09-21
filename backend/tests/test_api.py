from io import BytesIO
from pathlib import Path

import pandas as pd

from app.importers.excel import COLUMNS

PRODUCT = {
    "product_code": "TEST",
    "product_name": "Test laptop",
    "price": 20000000,
    "ram_gb": 16,
    "gpu": "NVIDIA RTX 4050",
    "cpu": "Intel Core i5",
    "storage_raw": "512 GB SSD",
    "storage_gb": 512,
    "weight_kg": 1.5,
    "refresh_rate_hz": 144,
    "screen_size_inch": 15.6,
    "brand": "Test",
}


def new_rule():
    return {
        "rule_code": "CUSTOM",
        "rule_name": "Custom",
        "priority": 200,
        "conditions": [{"attribute": "purpose", "operator": "=", "value": "office"}],
        "actions": [{"fact_name": "min_ram", "fact_value": 64}],
    }


def test_product_crud_validation_and_autocomplete(client):
    response = client.post("/api/products", json=PRODUCT)
    assert response.status_code == 201
    id = response.json()["id"]
    assert client.get(f"/api/products/{id}").json()["price"] == 20000000
    assert client.post("/api/products", json=PRODUCT).status_code == 409
    assert (
        client.post(
            "/api/products", json={**PRODUCT, "product_code": "negative", "price": -1}
        ).status_code
        == 422
    )
    assert client.put(f"/api/products/{id}", json={**PRODUCT, "price": 21000000}).status_code == 200
    assert client.get("/api/products/autocomplete?field=brand&q=te").json() == ["Test"]
    assert client.get("/api/products/autocomplete?field=__table__").status_code == 422
    assert client.get("/api/products?q=laptop&page_size=1").json()["total"] == 1
    assert client.delete(f"/api/products/{id}").status_code == 204
    assert client.get(f"/api/products/{id}").status_code == 404


def test_bulk_delete_products_is_atomic(client):
    first = client.post("/api/products", json={**PRODUCT, "product_code": "BULK-1"}).json()["id"]
    second = client.post("/api/products", json={**PRODUCT, "product_code": "BULK-2"}).json()["id"]
    assert client.request("DELETE", "/api/products", json={"ids": []}).status_code == 422
    assert client.request("DELETE", "/api/products", json={"ids": [0]}).status_code == 422
    assert (
        client.request("DELETE", "/api/products", json={"ids": [first, 999999]}).status_code == 404
    )
    assert client.get(f"/api/products/{first}").status_code == 200
    assert client.get(f"/api/products/{second}").status_code == 200

    response = client.request("DELETE", "/api/products", json={"ids": [first, second]})
    assert response.status_code == 200
    assert response.json() == {"deleted": 2}
    assert client.get(f"/api/products/{first}").status_code == 404
    assert client.get(f"/api/products/{second}").status_code == 404


def test_rule_crud_disable_and_validation(client):
    r = client.post("/api/rules", json=new_rule())
    assert r.status_code == 201, r.text
    id = r.json()["id"]
    assert (
        client.post(f"/api/rules/{id}/test", json={"facts": {"purpose": "office"}}).status_code
        == 404
    )
    r = client.put(f"/api/rules/{id}", json={**new_rule(), "enabled": False})
    assert r.status_code == 200
    result = client.post("/api/inference/run", json={"facts": {"purpose": "office"}}).json()
    assert result["final_facts"]["min_ram"] == 8
    assert (
        client.post(
            "/api/rules",
            json={
                **new_rule(),
                "rule_code": "BAD",
                "conditions": [{"attribute": "unknown", "operator": "=", "value": 1}],
            },
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/rules",
            json={
                **new_rule(),
                "rule_code": "BAD",
                "actions": [{"fact_name": "min_ram", "fact_value": "wrong"}],
            },
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/rules", json={**new_rule(), "rule_code": "BAD", "conditions": []}
        ).status_code
        == 422
    )
    assert (
        client.post(
            "/api/rules",
            json={
                **new_rule(),
                "rule_code": "BAD",
                "conditions": [{"attribute": "purpose", "operator": "EXEC", "value": "office"}],
            },
        ).status_code
        == 422
    )
    assert client.delete(f"/api/rules/{id}").status_code == 204


def test_attribute_crud_dynamic_knowledge_and_dependency(client):
    attr = {
        "name": "custom_capacity",
        "label": "Custom storage",
        "data_type": "number",
        "product_field": "storage_gb",
        "match_operator": ">=",
        "score_category": "storage",
        "merge_strategy": "max",
    }
    response = client.post("/api/attributes", json=attr)
    assert response.status_code == 201, response.text
    id = response.json()["id"]
    assert client.put(f"/api/attributes/{id}", json={**attr, "label": "Updated"}).status_code == 200
    rule = {
        **new_rule(),
        "actions": [{"fact_name": "custom_capacity", "fact_value": 1024}],
    }
    rid = client.post("/api/rules", json=rule).json()["id"]
    assert client.delete(f"/api/attributes/{id}").status_code == 409
    assert (
        client.put(f"/api/attributes/{id}", json={**attr, "data_type": "string"}).status_code == 422
    )
    client.post("/api/products", json=PRODUCT)
    result = client.post("/api/inference/run", json={"facts": {"purpose": "office"}}).json()
    assert result["final_facts"]["custom_capacity"] == 1024
    c = next(
        c for c in result["recommended_products"][0]["criteria"] if c["fact"] == "custom_capacity"
    )
    assert c["status"] == "unmet" and c["source_rules"] == ["CUSTOM"]
    client.delete(f"/api/rules/{rid}")
    assert client.delete(f"/api/attributes/{id}").status_code == 204


def test_import_real_workbook_reimport_and_skip(client):
    path = Path(__file__).resolve().parents[2] / "Laptop_data.xlsx"
    payload = path.read_bytes()

    def upload(update=True):
        return client.post(
            "/api/products/import?update_existing=" + str(update).lower(),
            files={
                "file": (
                    "Laptop_data.xlsx",
                    payload,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
            },
        )

    r = upload()
    assert r.status_code == 200, r.text
    assert r.json()["created"] == 50 and r.json()["failed"] == 0
    assert upload().json()["updated"] == 50
    assert upload(False).json()["skipped"] == 50
    assert client.get("/api/products").json()["total"] == 50
    products = client.get("/api/products?page_size=100").json()["items"]
    assert all(p["raw_data"] for p in products)
    assert any(p["normalization_notes"] for p in products)


def test_import_partial_failure_and_duplicates(client):
    row = [
        1,
        "A",
        "A",
        100,
        "Brand",
        "CPU",
        "Chưa xác minh",
        16,
        "Chưa xác minh",
        "1 TB SSD",
        "Bạc",
        "14 OLED",
    ]
    rows = [row, [*row[:1], "A", *row[2:]], [2, "B", "B", -10, *row[4:]]]
    stream = BytesIO()
    pd.DataFrame(rows, columns=COLUMNS).to_excel(stream, index=False)
    response = client.post("/api/products/import", files={"file": ("test.xlsx", stream.getvalue())})
    assert response.status_code == 200, response.text
    report = response.json()
    assert (report["created"], report["updated"], report["failed"]) == (1, 1, 1)
    assert report["duplicate_codes"] == ["A"]
    assert report["errors"][0]["raw_data"]["Mã sản phẩm"] == "B"
    assert client.get("/api/products").json()["total"] == 1


def test_consultation_snapshots_and_scoring(client):
    pid = client.post("/api/products", json=PRODUCT).json()["id"]
    facts = {
        "purpose": "gaming",
        "gaming_level": "medium",
        "budget_max": 30000000,
        "mobility_priority": "high",
    }
    response = client.post("/api/consultations", json={"facts": facts})
    assert response.status_code == 201, response.text
    result = response.json()
    assert result["final_facts"]["min_ram"] == 16
    assert result["recommended_products"][0]["score"] == 100
    assert result["steps"] and result["steps"][0]["conflict_set"]
    rid = next(r["id"] for r in client.get("/api/rules").json() if r["rule_code"] == "R002")
    assert client.delete(f"/api/rules/{rid}").status_code == 204
    client.delete(f"/api/products/{pid}")
    snapshot = client.get("/api/consultations/" + str(result["session_id"])).json()
    assert snapshot["recommended_products"] == result["recommended_products"]
    assert snapshot["steps"] == result["steps"]
    assert client.get("/api/consultations").json()["total"] == 1


def test_unknown_gpu_no_points_budget_strict_and_bad_facts(client):
    client.post("/api/products", json={**PRODUCT, "gpu": "Chưa xác minh"})
    facts = {"purpose": "gaming", "gaming_level": "medium", "budget_max": 30000000}
    result = client.post("/api/inference/run", json={"facts": facts}).json()
    assert result["recommended_products"][0]["score"] < 100
    assert all(
        c["status"] == "unknown"
        for c in result["recommended_products"][0]["criteria"]
        if c["fact"] in ["preferred_gpu_type", "min_gpu_level"]
    )
    assert (
        client.post("/api/inference/run", json={"facts": {**facts, "budget_max": 1}}).json()[
            "recommended_products"
        ]
        == []
    )
    assert client.post("/api/inference/run", json={"facts": {"unknown": 1}}).status_code == 422
    assert client.post("/api/inference/run", json={"facts": {"min_ram": True}}).status_code == 422
    assert (
        client.post(
            "/api/inference/run", json={"facts": {"budget_min": 10, "budget_max": 5}}
        ).status_code
        == 422
    )


def test_seed_idempotent_and_dashboard(client):
    d = client.get("/api/dashboard").json()
    assert d["total_rules"] == 30 and d["active_rules"] == 30
    assert client.get("/api/health").json() == {"status": "ok"}
