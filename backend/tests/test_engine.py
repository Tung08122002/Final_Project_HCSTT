import pytest

from app.inference.engine import ForwardChainingEngine, evaluate_condition
from app.knowledge_base.seed import seed_attributes, seed_rules


def rule(code, conditions, actions, priority=50, **extra):
    return dict(
        rule_code=code,
        rule_name=code,
        priority=priority,
        enabled=True,
        logical_operator="AND",
        conditions=[
            dict(attribute=k, operator=op, value=v, logical_group=0, group_operator="AND")
            for k, op, v in conditions
        ],
        actions=[dict(fact_name=k, fact_value=v) for k, v in actions.items()],
        **extra,
    )


def seeded(facts):
    return ForwardChainingEngine(seed_rules(), seed_attributes()).infer(facts)


def test_gaming_medium_and_chaining():
    result = seeded({"purpose": "gaming", "gaming_level": "medium", "budget_max": 30000000})
    assert result["final_facts"]["min_ram"] == 16
    assert result["final_facts"]["require_dedicated_gpu"] is True
    assert result["final_facts"]["preferred_gpu_type"] == "dedicated"
    assert result["matched_rules"].index("R002") < result["matched_rules"].index("R026")
    assert result["provenance"]["preferred_gpu_type"] == ["R026"]


def test_office_does_not_fire_gaming():
    result = seeded({"purpose": "office"})
    assert "R002" not in result["matched_rules"]
    assert "require_dedicated_gpu" not in result["final_facts"]


def test_and_requires_every_condition():
    r = rule("A", [("purpose", "=", "gaming"), ("level", "=", "medium")], {"ram": 16})
    engine = ForwardChainingEngine([r])
    assert not engine.evaluate_rule(r, {"purpose": "gaming"})
    assert engine.evaluate_rule(r, {"purpose": "gaming", "level": "medium"})


def test_or_within_group_and_between_groups():
    r = rule(
        "A",
        [("purpose", "=", "gaming"), ("level", "=", "medium"), ("level", "=", "high")],
        {"ram": 16},
    )
    for c in r["conditions"][1:]:
        c.update(logical_group=1, group_operator="OR")
    engine = ForwardChainingEngine([r])
    assert engine.evaluate_rule(r, {"purpose": "gaming", "level": "high"})
    assert not engine.evaluate_rule(r, {"purpose": "office", "level": "high"})
    r["logical_operator"] = "OR"
    assert engine.evaluate_rule(r, {"purpose": "office", "level": "high"})


@pytest.mark.parametrize(
    "op,actual,expected,result",
    [
        ("=", 16, 16, True),
        ("!=", 8, 16, True),
        (">", 17, 16, True),
        (">=", 16, 16, True),
        ("<", 8, 16, True),
        ("<=", 16, 16, True),
        ("IN", "gaming", ["gaming", "office"], True),
        ("NOT IN", "office", ["gaming"], True),
        ("CONTAINS", "NVIDIA RTX 4050", "rtx", True),
        (">=", 8, 16, False),
        ("IN", "ai", ["gaming"], False),
        (">", None, 3, False),
        ("=", True, 1, False),
    ],
)
def test_operators(op, actual, expected, result):
    assert (
        evaluate_condition({"attribute": "x", "operator": op, "value": expected}, {"x": actual})
        is result
    )


def test_missing_fact_is_not_negation():
    assert not evaluate_condition({"attribute": "x", "operator": "!=", "value": 1}, {})
    assert not evaluate_condition({"attribute": "x", "operator": "NOT IN", "value": [1]}, {})


def test_priority_specificity_and_stable_order():
    rules = [
        rule("C", [("x", "=", 1)], {"c": True}),
        rule("B", [("x", "=", 1)], {"b": True}, 100),
        rule("A", [("x", "=", 1), ("y", "=", 2)], {"a": True}, 100),
        rule("D", [("x", "=", 1)], {"d": True}, 100),
    ]
    result = ForwardChainingEngine(rules).infer({"x": 1, "y": 2})
    assert result["matched_rules"] == ["A", "B", "D", "C"]
    assert len(result["steps"][0]["conflict_set"]) == 4


def test_duplicate_firing_and_circular_rules():
    rules = [rule("A", [("x", "=", 1)], {"y": 1}), rule("B", [("y", "=", 1)], {"x": 1})]
    result = ForwardChainingEngine(rules).infer({"x": 1})
    assert result["matched_rules"] == ["A", "B"]
    assert result["steps"][1]["no_new_facts"] is True
    assert result["termination"] == "fixed_point"


def test_noop_does_not_stop_other_rules():
    rules = [
        rule("A", [("x", "=", 1)], {"x": 1}, 100),
        rule("B", [("x", "=", 1)], {"y": 1}, 50),
    ]
    assert ForwardChainingEngine(rules).infer({"x": 1})["final_facts"]["y"] == 1


def test_max_iterations():
    result = ForwardChainingEngine(
        [rule("A", [("x", "=", 1)], {"y": 1}), rule("B", [("y", "=", 1)], {"z": 1})],
        max_iterations=1,
    ).infer({"x": 1})
    assert result["termination"] == "max_iterations"
    assert "z" not in result["final_facts"]


def test_disabled_rules_and_immutable_inputs():
    r = rule("A", [("x", "=", 1)], {"x": 2})
    r["enabled"] = False
    facts = {"x": 1}
    result = ForwardChainingEngine([r]).infer(facts)
    assert result["matched_rules"] == [] and facts == {"x": 1}


def test_monotonic_fact_merges():
    result = seeded(
        {
            "purpose": "gaming",
            "gaming_level": "high",
            "min_ram": 64,
            "max_weight": 1.3,
            "mobility_priority": "high",
        }
    )
    assert result["final_facts"]["min_ram"] == 64
    assert result["final_facts"]["max_weight"] == 1.3


def test_secondary_gaming_false_does_not_override_required_gpu():
    result = seeded(
        {
            "purpose": "ai_data_science",
            "secondary_purpose": "gaming",
            "gaming_level": "casual",
        }
    )
    assert result["final_facts"]["require_dedicated_gpu"] is True


def test_seed_rules_pass_validation():
    from app.schemas.contracts import RuleInput
    from app.services.validation import validate_rule

    for r in seed_rules():
        validate_rule(RuleInput(**r), seed_attributes())
