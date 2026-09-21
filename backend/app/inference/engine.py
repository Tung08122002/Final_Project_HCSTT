from collections import defaultdict
from copy import deepcopy


def evaluate_condition(condition, facts):
    name, op, expected = (
        condition["attribute"],
        condition["operator"],
        condition["value"],
    )
    if name not in facts or facts[name] is None:
        return False
    actual = facts[name]
    try:
        if op == "=":
            return (
                type(actual) is type(expected) and actual == expected
                if isinstance(actual, bool) or isinstance(expected, bool)
                else actual == expected
            )
        if op == "!=":
            return actual != expected
        if op == ">":
            return actual > expected
        if op == ">=":
            return actual >= expected
        if op == "<":
            return actual < expected
        if op == "<=":
            return actual <= expected
        if op == "IN":
            return actual in expected
        if op == "NOT IN":
            return actual not in expected
        if op == "CONTAINS":
            return str(expected).casefold() in str(actual).casefold()
    except (TypeError, ValueError):
        return False
    return False


class ForwardChainingEngine:
    """Finite, deterministic, data-driven production system; no product access."""

    def __init__(self, rules, attributes=(), max_iterations=200):
        self.rules = rules
        self.attributes = {a["name"]: a for a in attributes}
        self.max_iterations = max_iterations

    def evaluate_rule(self, rule, memory):
        groups = defaultdict(list)
        operators = {}
        for c in rule["conditions"]:
            group = c.get("logical_group", 0)
            groups[group].append(evaluate_condition(c, memory))
            operators[group] = c.get("group_operator", "AND")
        results = [
            (all(values) if operators[g] == "AND" else any(values)) for g, values in groups.items()
        ]
        return bool(results) and (
            all(results) if rule.get("logical_operator", "AND") == "AND" else any(results)
        )

    def find_matching_rules(self, memory, fired):
        return [
            r
            for r in self.rules
            if r.get("enabled", True)
            and r["rule_code"] not in fired
            and self.evaluate_rule(r, memory)
        ]

    def resolve_conflicts(self, candidates):
        return sorted(
            candidates,
            key=lambda r: (-r["priority"], -len(r["conditions"]), r["rule_code"]),
        )[0]

    def add_fact(self, memory, name, value):
        strategy = self.attributes.get(name, {}).get("merge_strategy", "first")
        if name not in memory:
            memory[name] = deepcopy(value)
            return True, "new"
        old = memory[name]
        merged = (
            max(old, value)
            if strategy == "max"
            else min(old, value)
            if strategy == "min"
            else (old or value)
            if strategy == "or"
            else old
        )
        if merged != old:
            memory[name] = merged
            return True, strategy
        return False, "unchanged" if old == value else f"conflict_kept_{strategy}"

    def fire_rule(self, rule, memory, provenance):
        generated, outcomes = {}, []
        for a in rule["actions"]:
            name, value = a["fact_name"], a["fact_value"]
            changed, reason = self.add_fact(memory, name, value)
            if changed:
                generated[name] = deepcopy(memory[name])
                provenance[name] = [rule["rule_code"]]
            elif memory[name] == value:
                provenance.setdefault(name, []).append(rule["rule_code"])
            outcomes.append(
                {
                    "fact": name,
                    "proposed": value,
                    "retained": memory[name],
                    "reason": reason,
                    "message": a.get("message", ""),
                }
            )
        return generated, outcomes

    def infer(self, initial_facts):
        memory, fired, steps = deepcopy(initial_facts), set(), []
        provenance = {k: ["USER"] for k in initial_facts}
        for i in range(self.max_iterations):
            candidates = self.find_matching_rules(memory, fired)
            if not candidates:
                break
            rule = self.resolve_conflicts(candidates)
            before = deepcopy(memory)
            generated, outcomes = self.fire_rule(rule, memory, provenance)
            fired.add(rule["rule_code"])
            steps.append(
                {
                    "step_number": i + 1,
                    "rule_id": rule.get("id"),
                    "rule_code": rule["rule_code"],
                    "rule_name": rule["rule_name"],
                    "rule_snapshot": deepcopy(rule),
                    "facts_before": before,
                    "matched_conditions": [
                        {**c, "matched": evaluate_condition(c, before)} for c in rule["conditions"]
                    ],
                    "generated_facts": generated,
                    "facts_after": deepcopy(memory),
                    "action_outcomes": outcomes,
                    "conflict_set": [
                        {
                            "rule_code": r["rule_code"],
                            "priority": r["priority"],
                            "condition_count": len(r["conditions"]),
                        }
                        for r in candidates
                    ],
                    "selected_reason": f"priority={rule['priority']}; conditions={len(rule['conditions'])}; rule_code tăng dần",
                    "no_new_facts": not bool(generated),
                }
            )
        remaining = self.find_matching_rules(memory, fired)
        return {
            "initial_facts": deepcopy(initial_facts),
            "final_facts": memory,
            "working_memory": memory,
            "matched_rules": [s["rule_code"] for s in steps],
            "steps": steps,
            "provenance": provenance,
            "termination": "max_iterations" if remaining else "fixed_point",
            "iterations": len(steps),
        }
