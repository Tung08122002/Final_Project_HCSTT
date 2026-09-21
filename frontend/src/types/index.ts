export type FactValue = string | number | boolean;
export type Facts = Record<string, FactValue>;
export interface Product {
  id: number;
  product_code: string;
  product_name: string;
  price: number | null;
  brand: string | null;
  cpu: string | null;
  gpu: string | null;
  ram_gb: number | null;
  weight_raw: string | null;
  weight_kg: number | null;
  storage_raw: string | null;
  storage_gb: number | null;
  color: string | null;
  display_raw: string | null;
  screen_size_inch: number | null;
  resolution: string | null;
  refresh_rate_hz: number | null;
  raw_data: Record<string, unknown>;
  normalization_notes: string[];
}
export interface Attribute {
  id: number;
  name: string;
  label: string;
  data_type: "number" | "string" | "enum" | "boolean";
  unit: string | null;
  description: string;
  allowed_values: string[];
  active: boolean;
  merge_strategy: string;
  product_field: string | null;
  match_operator: string;
  score_category: string;
}
export interface Condition {
  attribute: string;
  operator: string;
  value: FactValue | FactValue[];
  logical_group: number;
  group_operator: string;
  sort_order: number;
}
export interface Action {
  fact_name: string;
  fact_value: FactValue;
  score_delta: number;
  message: string;
}
export interface Rule {
  id?: number;
  rule_code: string;
  rule_name: string;
  description: string;
  category: string;
  priority: number;
  enabled: boolean;
  logical_operator: string;
  conditions: Condition[];
  actions: Action[];
}
export interface Step {
  step_number: number;
  rule_code: string;
  rule_name: string;
  facts_before: Facts;
  facts_after: Facts;
  generated_facts: Facts;
  conflict_set: {
    rule_code: string;
    priority: number;
    condition_count: number;
  }[];
  selected_reason: string;
  no_new_facts: boolean;
  matched_conditions: (Condition & { matched: boolean })[];
  action_outcomes: {
    fact: string;
    proposed: FactValue;
    retained: FactValue;
    reason: string;
    message: string;
  }[];
}
export interface Recommendation {
  product: Product;
  score: number;
  fully_matched: boolean;
  reasons: string[];
  tradeoffs: string[];
  criteria: {
    fact: string;
    label: string;
    actual: FactValue | null;
    expected: FactValue;
    operator: string;
    status: string;
    source_rules: string[];
    points?: number;
    max_points?: number;
  }[];
  score_breakdown: {
    category: string;
    label: string;
    points: number;
    max_points: number;
    applicable: boolean;
  }[];
}
export interface InferenceResult {
  session_id?: number;
  created_at?: string;
  initial_facts: Facts;
  final_facts: Facts;
  matched_rules: string[];
  steps: Step[];
  termination: string;
  iterations: number;
  provenance: Record<string, string[]>;
  recommended_products: Recommendation[];
  candidate_count: number;
  technical_requirements: {
    name: string;
    label: string;
    value: FactValue;
    operator: string;
    source_rules: string[];
  }[];
  explanation: {
    summary: string;
    matching_policy: string;
    scoring_policy: string;
    warning: string;
    empty_message: string | null;
  };
}
export interface HistoryItem {
  id: number;
  created_at: string;
  initial_facts: Facts;
  rules_fired: number;
  recommendation_count: number;
}
export interface DashboardData {
  total_products: number;
  total_brands: number;
  total_rules: number;
  active_rules: number;
  total_attributes: number;
  consultation_sessions: number;
  brands: { name: string; count: number }[];
  recent_consultations: HistoryItem[];
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size?: number;
}
