import { useState } from "react";
import {
  Plus,
  Pencil,
  Copy,
  Trash2,
  GitBranch,
  Power,
  Eye,
} from "lucide-react";
import { useData } from "../hooks/useData";
import {
  api,
  send,
  errorText,
  money,
  parseMoneyInput,
  formatMoneyInput,
} from "../services/api";
import { MoneyInput } from "../components/MoneyInput";
import {
  Field,
  ErrorBox,
  Modal,
  Badge,
  SearchBox,
  Loading,
  Empty,
} from "../components/ui";
import type { Attribute, Rule, FactValue } from "../types";

export const operators = [
  "=",
  "!=",
  ">",
  ">=",
  "<",
  "<=",
  "IN",
  "NOT IN",
  "CONTAINS",
];
const blankRule = (): Rule => ({
  rule_code: "",
  rule_name: "",
  description: "",
  category: "General",
  priority: 50,
  enabled: true,
  logical_operator: "AND",
  conditions: [
    {
      attribute: "purpose",
      operator: "=",
      value: "gaming",
      logical_group: 0,
      group_operator: "AND",
      sort_order: 0,
    },
  ],
  actions: [
    { fact_name: "min_ram", fact_value: 16, score_delta: 0, message: "" },
  ],
});
function payload(rule: Rule) {
  return {
    rule_code: rule.rule_code,
    rule_name: rule.rule_name,
    description: rule.description,
    category: rule.category,
    priority: rule.priority,
    enabled: rule.enabled,
    logical_operator: rule.logical_operator,
    conditions: rule.conditions.map((c, i) => ({
      attribute: c.attribute,
      operator: c.operator,
      value: c.value,
      logical_group: c.logical_group,
      group_operator: c.group_operator,
      sort_order: i,
    })),
    actions: rule.actions.map((a) => ({
      fact_name: a.fact_name,
      fact_value: a.fact_value,
      score_delta: a.score_delta,
      message: a.message,
    })),
  };
}
function defaultValue(attr?: Attribute): FactValue {
  return attr?.data_type === "number"
    ? 0
    : attr?.data_type === "boolean"
      ? true
      : attr?.data_type === "enum"
        ? attr.allowed_values[0] || ""
        : "";
}
function isVndAttribute(attribute?: Attribute) {
  return attribute?.unit?.toUpperCase() === "VND";
}
function displayRuleValue(
  attribute: Attribute | undefined,
  value: FactValue | FactValue[],
) {
  const formatted = (item: FactValue) =>
    isVndAttribute(attribute) && typeof item === "number"
      ? money(item)
      : typeof item === "string"
        ? JSON.stringify(item)
        : String(item);
  return Array.isArray(value)
    ? `[${value.map(formatted).join(", ")}]`
    : formatted(value);
}
function MoneyListInput({
  value,
  onChange,
}: {
  value: FactValue | FactValue[];
  onChange: (value: number[]) => void;
}) {
  const [draft, setDraft] = useState(
    (Array.isArray(value) ? value : [value])
      .map((item) => formatMoneyInput(Number(item)))
      .join(", "),
  );
  return (
    <input
      aria-label="Danh sách giá trị VND"
      inputMode="numeric"
      placeholder="1.000.000, 2.000.000"
      value={draft}
      onChange={(event) => {
        const text = event.target.value;
        setDraft(text);
        onChange(
          text
            .split(",")
            .map(parseMoneyInput)
            .filter((item): item is number => item !== null),
        );
      }}
      onBlur={() =>
        setDraft(
          (Array.isArray(value) ? value : [value])
            .map((item) => formatMoneyInput(Number(item)))
            .join(", "),
        )
      }
    />
  );
}
function ValueInput({
  attribute,
  value,
  onChange,
  multiple = false,
}: {
  attribute?: Attribute;
  value: FactValue | FactValue[];
  onChange: (v: FactValue | FactValue[]) => void;
  multiple?: boolean;
}) {
  if (multiple && isVndAttribute(attribute))
    return <MoneyListInput value={value} onChange={onChange} />;
  if (multiple)
    return (
      <input
        aria-label="Danh sách giá trị"
        placeholder="Giá trị phân cách bởi dấu phẩy"
        value={Array.isArray(value) ? value.join(", ") : String(value)}
        onChange={(e) =>
          onChange(
            e.target.value
              .split(",")
              .map((v) =>
                attribute?.data_type === "number"
                  ? Number(v.trim())
                  : attribute?.data_type === "boolean"
                    ? v.trim() === "true"
                    : v.trim(),
              ),
          )
        }
      />
    );
  if (attribute?.data_type === "enum" || attribute?.data_type === "boolean")
    return (
      <select
        aria-label="Giá trị"
        value={String(value)}
        onChange={(e) =>
          onChange(
            attribute?.data_type === "boolean"
              ? e.target.value === "true"
              : e.target.value,
          )
        }
      >
        {(attribute.data_type === "boolean"
          ? ["true", "false"]
          : attribute.allowed_values
        ).map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
    );
  if (isVndAttribute(attribute))
    return (
      <MoneyInput
        aria-label="Giá trị VND"
        required
        value={typeof value === "number" ? value : null}
        onValueChange={(amount) => onChange(amount ?? "")}
      />
    );
  return (
    <input
      aria-label="Giá trị"
      required
      type={attribute?.data_type === "number" ? "number" : "text"}
      min={attribute?.data_type === "number" ? 0 : undefined}
      step="any"
      value={String(value)}
      onChange={(e) =>
        onChange(
          attribute?.data_type === "number"
            ? Number(e.target.value)
            : e.target.value,
        )
      }
    />
  );
}
function RuleEditor({
  rule,
  attrs,
  onClose,
  onSaved,
}: {
  rule: Rule;
  attrs: Attribute[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Rule>(structuredClone(rule)),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const change = (patch: Partial<Rule>) => setForm((f) => ({ ...f, ...patch }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await send(
        "/rules" + (rule.id ? "/" + rule.id : ""),
        payload(form),
        rule.id ? "PUT" : "POST",
      );
      onSaved();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={rule.id ? "Chỉnh sửa luật suy diễn" : "Tạo luật IF–THEN"}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Mã luật">
            <input
              required
              value={form.rule_code}
              onChange={(e) => change({ rule_code: e.target.value })}
            />
          </Field>
          <Field label="Tên luật">
            <input
              required
              value={form.rule_name}
              onChange={(e) => change({ rule_name: e.target.value })}
            />
          </Field>
          <Field label="Nhóm tri thức">
            <input
              required
              value={form.category}
              onChange={(e) => change({ category: e.target.value })}
            />
          </Field>
          <Field label="Độ ưu tiên">
            <input
              type="number"
              min="0"
              max="10000"
              required
              value={form.priority}
              onChange={(e) => change({ priority: Number(e.target.value) })}
            />
          </Field>
        </div>
        <Field label="Mô tả">
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => change({ description: e.target.value })}
          />
        </Field>
        <section className="builder-section">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3>
              <span className="logic-badge">IF</span> Điều kiện
            </h3>
            <label className="flex items-center gap-2 text-sm">
              Nối các nhóm{" "}
              <select
                value={form.logical_operator}
                onChange={(e) => change({ logical_operator: e.target.value })}
              >
                <option>AND</option>
                <option>OR</option>
              </select>
            </label>
          </div>
          <p className="muted text-sm mb-3">
            Các điều kiện cùng số nhóm được nối bằng AND/OR của nhóm. Kết quả
            các nhóm được nối ở trên.
          </p>
          {form.conditions.map((c, i) => (
            <div className="condition-row" key={i}>
              <select
                aria-label={"Thuộc tính điều kiện " + (i + 1)}
                value={c.attribute}
                onChange={(e) =>
                  change({
                    conditions: form.conditions.map((x, j) =>
                      j === i
                        ? {
                            ...x,
                            attribute: e.target.value,
                            value: defaultValue(
                              attrs.find((a) => a.name === e.target.value),
                            ),
                          }
                        : x,
                    ),
                  })
                }
              >
                {attrs
                  .filter((a) => a.active)
                  .map((a) => (
                    <option value={a.name} key={a.name}>
                      {a.label} ({a.name})
                    </option>
                  ))}
              </select>
              <select
                aria-label="Toán tử"
                value={c.operator}
                onChange={(e) =>
                  change({
                    conditions: form.conditions.map((x, j) =>
                      j === i
                        ? {
                            ...x,
                            operator: e.target.value,
                            value: ["IN", "NOT IN"].includes(e.target.value)
                              ? [
                                  defaultValue(
                                    attrs.find((a) => a.name === x.attribute),
                                  ),
                                ]
                              : defaultValue(
                                  attrs.find((a) => a.name === x.attribute),
                                ),
                          }
                        : x,
                    ),
                  })
                }
              >
                {operators.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <ValueInput
                attribute={attrs.find((a) => a.name === c.attribute)}
                value={c.value}
                multiple={["IN", "NOT IN"].includes(c.operator)}
                onChange={(v) =>
                  change({
                    conditions: form.conditions.map((x, j) =>
                      j === i ? { ...x, value: v } : x,
                    ),
                  })
                }
              />
              <input
                type="number"
                min="0"
                title="Số nhóm"
                aria-label="Số nhóm"
                value={c.logical_group}
                onChange={(e) =>
                  change({
                    conditions: form.conditions.map((x, j) =>
                      j === i
                        ? {
                            ...x,
                            logical_group: Number(e.target.value),
                            group_operator:
                              form.conditions.find(
                                (y) =>
                                  y.logical_group === Number(e.target.value),
                              )?.group_operator || "AND",
                          }
                        : x,
                    ),
                  })
                }
              />
              <select
                title="Toán tử trong nhóm"
                aria-label="Toán tử nhóm"
                value={c.group_operator}
                onChange={(e) =>
                  change({
                    conditions: form.conditions.map((x) =>
                      x.logical_group === c.logical_group
                        ? { ...x, group_operator: e.target.value }
                        : x,
                    ),
                  })
                }
              >
                <option>AND</option>
                <option>OR</option>
              </select>
              <button
                type="button"
                className="icon-button danger"
                disabled={form.conditions.length === 1}
                aria-label="Xóa điều kiện"
                onClick={() =>
                  change({
                    conditions: form.conditions.filter((_, j) => j !== i),
                  })
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-button mt-3"
            onClick={() =>
              change({
                conditions: [
                  ...form.conditions,
                  {
                    attribute: "purpose",
                    operator: "=",
                    value: "gaming",
                    logical_group: 0,
                    group_operator:
                      form.conditions.find((c) => c.logical_group === 0)
                        ?.group_operator || "AND",
                    sort_order: form.conditions.length,
                  },
                ],
              })
            }
          >
            <Plus size={16} /> Thêm điều kiện
          </button>
        </section>
        <section className="builder-section then">
          <h3 className="mb-4">
            <span className="logic-badge">THEN</span> Tạo kết luận / fact
          </h3>
          {form.actions.map((a, i) => (
            <div className="action-row" key={i}>
              <select
                aria-label={"Thuộc tính kết luận " + (i + 1)}
                value={a.fact_name}
                onChange={(e) =>
                  change({
                    actions: form.actions.map((x, j) =>
                      j === i
                        ? {
                            ...x,
                            fact_name: e.target.value,
                            fact_value: defaultValue(
                              attrs.find((a) => a.name === e.target.value),
                            ),
                          }
                        : x,
                    ),
                  })
                }
              >
                {attrs
                  .filter((a) => a.active)
                  .map((a) => (
                    <option key={a.name} value={a.name}>
                      {a.label} ({a.name})
                    </option>
                  ))}
              </select>
              <ValueInput
                attribute={attrs.find((x) => x.name === a.fact_name)}
                value={a.fact_value}
                onChange={(v) =>
                  change({
                    actions: form.actions.map((x, j) =>
                      j === i ? { ...x, fact_value: v as FactValue } : x,
                    ),
                  })
                }
              />
              <input
                aria-label="Thông điệp giải thích"
                placeholder="Thông điệp giải thích"
                value={a.message}
                onChange={(e) =>
                  change({
                    actions: form.actions.map((x, j) =>
                      j === i ? { ...x, message: e.target.value } : x,
                    ),
                  })
                }
              />
              <button
                type="button"
                className="icon-button danger"
                disabled={form.actions.length === 1}
                aria-label="Xóa kết luận"
                onClick={() =>
                  change({ actions: form.actions.filter((_, j) => j !== i) })
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-button mt-3"
            onClick={() =>
              change({
                actions: [
                  ...form.actions,
                  {
                    fact_name: "min_ram",
                    fact_value: 16,
                    score_delta: 0,
                    message: "",
                  },
                ],
              })
            }
          >
            <Plus size={16} /> Thêm kết luận
          </button>
        </section>
        <label className="check">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => change({ enabled: e.target.checked })}
          />{" "}
          Kích hoạt luật sau khi lưu
        </label>
        <ErrorBox error={error} />
        <div className="form-footer">
          <button className="button secondary" type="button" onClick={onClose}>
            Hủy
          </button>
          <button className="button" disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu luật"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export default function Rules() {
  const [revision, setRevision] = useState(0),
    [q, setQ] = useState(""),
    [editor, setEditor] = useState<Rule>(),
    [view, setView] = useState<Rule>(),
    [deleting, setDeleting] = useState<Rule>(),
    [error, setError] = useState("");
  const {
    data: rules,
    loading,
    error: loadError,
  } = useData<Rule[]>("/rules", revision);
  const { data: attrs } = useData<Attribute[]>("/attributes", revision);
  async function toggle(r: Rule) {
    try {
      await send(
        "/rules/" + r.id,
        { ...payload(r), enabled: !r.enabled },
        "PUT",
      );
      setRevision((x) => x + 1);
    } catch (e) {
      setError(errorText(e));
    }
  }
  async function remove() {
    try {
      await api("/rules/" + deleting?.id, { method: "DELETE" });
      setDeleting(undefined);
      setRevision((x) => x + 1);
    } catch (e) {
      setError(errorText(e));
    }
  }
  const filtered = rules?.filter((r) =>
    (r.rule_name + r.rule_code + r.category)
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">RULE BASE</div>
          <h1>Luật suy diễn</h1>
          <p>
            Biểu diễn tri thức bằng IF–THEN. Chỉnh sửa trực tiếp, không cần viết
            code.
          </p>
        </div>
        <button className="button" onClick={() => setEditor(blankRule())}>
          <Plus size={17} /> Tạo luật mới
        </button>
      </div>
      <section className="panel">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <SearchBox
            value={q}
            onChange={setQ}
            placeholder="Tìm mã luật, tên hoặc nhóm…"
          />
          <div className="flex gap-2">
            <Badge>
              {rules?.filter((r) => r.enabled).length || 0} đang bật
            </Badge>
            <Badge tone="gray">{rules?.length || 0} luật</Badge>
          </div>
        </div>
      </section>
      <ErrorBox error={error || loadError} />
      {loading ? (
        <Loading />
      ) : (
        <div className="rules-list">
          {filtered?.map((r) => (
            <article className="panel rule-card" key={r.id}>
              <div className="rule-header">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="rule-icon">
                    <GitBranch size={20} />
                  </span>
                  <div>
                    <div className="flex gap-2 items-center">
                      <code title="Rule: luật IF–THEN kết hợp điều kiện và kết luận.">
                        {r.rule_code}
                      </code>
                      <Badge tone="gray">{r.category}</Badge>
                    </div>
                    <h3>{r.rule_name}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <small>
                    Ưu tiên <b>{r.priority}</b>
                  </small>
                  <Badge tone={r.enabled ? "green" : "gray"}>
                    {r.enabled ? "Đang bật" : "Đã tắt"}
                  </Badge>
                </div>
              </div>
              <div className="rule-preview">
                <div>
                  <b>IF</b>
                  {r.conditions.map((c, i) => (
                    <span key={i}>
                      <code>
                        {c.attribute} {c.operator}{" "}
                        {displayRuleValue(
                          attrs?.find((a) => a.name === c.attribute),
                          c.value,
                        )}
                      </code>
                      <small>
                        {" "}
                        [G{c.logical_group} · {c.group_operator}]
                      </small>
                    </span>
                  ))}
                </div>
                <div>
                  <b>THEN</b>
                  {r.actions.map((a, i) => (
                    <span key={i}>
                      <code>
                        {a.fact_name} ={" "}
                        {displayRuleValue(
                          attrs?.find((attr) => attr.name === a.fact_name),
                          a.fact_value,
                        )}
                      </code>
                    </span>
                  ))}
                </div>
              </div>
              <div className="rule-actions">
                {[
                  { label: "Xem", icon: Eye, fn: () => setView(r) },
                  { label: "Sửa", icon: Pencil, fn: () => setEditor(r) },
                  {
                    label: "Nhân bản",
                    icon: Copy,
                    fn: () =>
                      setEditor({
                        ...r,
                        id: undefined,
                        rule_code: r.rule_code + "_COPY",
                        enabled: false,
                      }),
                  },
                  {
                    label: r.enabled ? "Tắt" : "Bật",
                    icon: Power,
                    fn: () => toggle(r),
                  },
                  { label: "Xóa", icon: Trash2, fn: () => setDeleting(r) },
                ].map((a) => (
                  <button key={a.label} className="text-button" onClick={a.fn}>
                    <a.icon size={14} />
                    {a.label}
                  </button>
                ))}
              </div>
            </article>
          ))}
          {!filtered?.length && <Empty>Không có luật phù hợp.</Empty>}
        </div>
      )}
      {editor && attrs && (
        <RuleEditor
          rule={editor}
          attrs={attrs}
          onClose={() => setEditor(undefined)}
          onSaved={() => {
            setEditor(undefined);
            setRevision((x) => x + 1);
          }}
        />
      )}
      {view && (
        <Modal
          title={view.rule_code + " · " + view.rule_name}
          onClose={() => setView(undefined)}
        >
          <p>{view.description}</p>
          <p className="muted mt-3">
            Nối các nhóm: {view.logical_operator}. Khi nhiều luật khớp: ưu tiên
            lớn hơn → nhiều điều kiện hơn → mã luật tăng dần.
          </p>
          <div className="rule-preview">
            <div>
              <b>IF</b>
              {view.conditions.map((condition, index) => (
                <span key={index}>
                  <code>
                    {condition.attribute} {condition.operator}{" "}
                    {displayRuleValue(
                      attrs?.find((attr) => attr.name === condition.attribute),
                      condition.value,
                    )}
                  </code>
                </span>
              ))}
            </div>
            <div>
              <b>THEN</b>
              {view.actions.map((action, index) => (
                <span key={index}>
                  <code>
                    {action.fact_name} ={" "}
                    {displayRuleValue(
                      attrs?.find((attr) => attr.name === action.fact_name),
                      action.fact_value,
                    )}
                  </code>
                </span>
              ))}
            </div>
          </div>
        </Modal>
      )}
      {deleting && (
        <Modal title="Xóa luật suy diễn" onClose={() => setDeleting(undefined)}>
          <p>
            Xóa luật <b>{deleting.rule_code}</b>? Phiên tư vấn cũ vẫn giữ bản
            chụp luật đã áp dụng.
          </p>
          <ErrorBox error={error} />
          <div className="form-footer">
            <button
              className="button secondary"
              onClick={() => setDeleting(undefined)}
            >
              Hủy
            </button>
            <button className="button danger-fill" onClick={remove}>
              Xóa luật
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
