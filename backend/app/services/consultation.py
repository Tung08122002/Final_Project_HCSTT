from fastapi.encoders import jsonable_encoder
from sqlalchemy import select

from app.explanation.builder import build_explanation
from app.inference.engine import ForwardChainingEngine
from app.models.entities import ConsultationSession, InferenceLog, Product
from app.repositories.catalog import CatalogRepository, serialize
from app.services.matching import match_products
from app.services.validation import validate_facts


def run_consultation(db, request, persist=False, owner_id=None):
    if persist and not owner_id:
        raise ValueError("Cần xác định người dùng trước khi lưu lịch sử")
    repository = CatalogRepository(db)
    attributes, rules = repository.attributes(), repository.rules()
    validate_facts(request.facts, attributes)
    result = ForwardChainingEngine(rules, attributes, request.max_iterations).infer(request.facts)
    products = [serialize(p) for p in db.scalars(select(Product))]
    recommendations, count, requirements = match_products(
        products, result["final_facts"], attributes, result["provenance"], request.limit
    )
    result.update(
        recommended_products=recommendations,
        candidate_count=count,
        technical_requirements=[
            {
                "name": a["name"],
                "label": a["label"],
                "value": result["final_facts"][a["name"]],
                "product_field": a["product_field"],
                "operator": a["match_operator"],
                "source_rules": result["provenance"].get(a["name"], []),
            }
            for a in requirements
        ],
    )
    result["explanation"] = build_explanation(result)
    result = jsonable_encoder(result)
    if persist:
        session = ConsultationSession(
            owner_id=owner_id,
            initial_facts_json=result["initial_facts"],
            final_facts_json=result["final_facts"],
            recommendation_json=result,
        )
        db.add(session)
        db.flush()
        for step in result["steps"]:
            db.add(
                InferenceLog(
                    session_id=session.id,
                    **{
                        key: step[key]
                        for key in [
                            "step_number",
                            "rule_id",
                            "facts_before",
                            "matched_conditions",
                            "generated_facts",
                            "facts_after",
                            "conflict_set",
                            "selected_reason",
                        ]
                    },
                )
            )
        db.commit()
        result.update(session_id=session.id, created_at=session.created_at.isoformat())
    return result
