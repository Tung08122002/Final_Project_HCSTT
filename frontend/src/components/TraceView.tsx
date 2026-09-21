import { useState } from "react";
import { GitBranch, ArrowRight, CheckCircle2 } from "lucide-react";
import type { InferenceResult } from "../types";
import { Badge, FactsTable, Modal } from "./ui";
import { displayFactValue } from "../services/api";
export function TraceView({
  result: r,
  onClose,
}: {
  result: InferenceResult;
  onClose: () => void;
}) {
  const [tab, setTab] = useState("steps");
  return (
    <Modal title="Xem cách suy luận" onClose={onClose} wide>
      <p className="muted">{r.explanation.summary}</p>
      <div className="tabs">
        {[
          ["steps", "Các bước suy diễn"],
          ["facts", "Working Memory"],
          ["requirements", "Yêu cầu kỹ thuật"],
        ].map(([id, label]) => (
          <button
            className={tab === id ? "active" : ""}
            key={id}
            title={
              id === "facts"
                ? "Working Memory: bộ facts của phiên, thay đổi sau mỗi luật."
                : id === "steps"
                  ? "Forward Chaining: áp dụng luật từ facts đã biết để tạo facts mới."
                  : "Yêu cầu kỹ thuật được suy ra từ luật và đầu vào."
            }
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "steps" && (
        <>
          <div className="notice">
            <CheckCircle2 size={18} /> {r.iterations} bước ·{" "}
            {r.termination === "fixed_point"
              ? "Đã xét hết luật có thể áp dụng"
              : "Đã đạt giới hạn vòng lặp; kết quả suy diễn chưa đầy đủ"}
          </div>
          <div className="timeline">
            {r.steps.map((s) => (
              <article className="trace-step" key={s.step_number}>
                <span className="step-number">{s.step_number}</span>
                <div className="flex items-center gap-2">
                  <Badge>{s.rule_code}</Badge>
                  <h3>{s.rule_name}</h3>
                </div>
                <p className="muted mt-2">{s.selected_reason}</p>
                <details>
                  <summary title="Conflict Set: các luật cùng khớp tại một bước; engine chọn theo priority, số điều kiện và mã luật.">
                    Conflict Set · {s.conflict_set.length} luật khớp
                  </summary>
                  <div className="flex gap-2 flex-wrap py-3">
                    {s.conflict_set.map((c) => (
                      <Badge
                        key={c.rule_code}
                        tone={c.rule_code === s.rule_code ? "green" : "gray"}
                      >
                        {c.rule_code} · Ưu tiên {c.priority} ·{" "}
                        {c.condition_count} điều kiện
                      </Badge>
                    ))}
                  </div>
                </details>
                <div className="rule-sentence">
                  <b>IF</b>
                  <div>
                    {s.matched_conditions.map((c, i) => (
                      <p key={i}>
                        <code>
                          {c.attribute} {c.operator}{" "}
                          {Array.isArray(c.value)
                            ? c.value
                                .map((item) =>
                                  displayFactValue(c.attribute, item),
                                )
                                .join(", ")
                            : displayFactValue(c.attribute, c.value)}
                        </code>
                        <span
                          className={
                            c.matched ? "text-emerald-700" : "text-slate-400"
                          }
                        >
                          {" "}
                          {c.matched ? "✓" : "—"} · Nhóm {c.logical_group} (
                          {c.group_operator})
                        </span>
                      </p>
                    ))}
                  </div>
                </div>
                <div className="rule-sentence">
                  <b>THEN</b>
                  <div>
                    {s.action_outcomes.map((a, i) => (
                      <p key={i}>
                        <code>
                          {a.fact} = {displayFactValue(a.fact, a.proposed)}
                        </code>{" "}
                        <small>
                          → Giữ {displayFactValue(a.fact, a.retained)} (
                          {a.reason})
                        </small>
                      </p>
                    ))}
                  </div>
                </div>
                {s.no_new_facts && (
                  <p className="muted">
                    Luật không tạo fact mới. Tiếp tục xét các luật còn lại.
                  </p>
                )}
                <details>
                  <summary>
                    Working Memory trước{" "}
                    <ArrowRight size={12} className="inline" /> sau
                  </summary>
                  <div className="grid md:grid-cols-2 gap-4 mt-3">
                    <FactsTable facts={s.facts_before} />
                    <FactsTable facts={s.facts_after} />
                  </div>
                </details>
              </article>
            ))}
          </div>
          {!r.steps.length && <p>Không có luật khớp với facts đã nhập.</p>}
        </>
      )}
      {tab === "facts" && (
        <div className="grid md:grid-cols-2 gap-6">
          <section>
            <h3 className="section-title">Initial Facts</h3>
            <FactsTable facts={r.initial_facts} />
          </section>
          <section>
            <h3 className="section-title">Final Facts & nguồn</h3>
            <FactsTable facts={r.final_facts} provenance={r.provenance} />
          </section>
        </div>
      )}
      {tab === "requirements" && (
        <>
          <div className="notice">
            <GitBranch size={20} /> Các facts sau suy diễn được ánh xạ sang tiêu
            chí sản phẩm.
          </div>
          {r.technical_requirements.map((a) => (
            <div className="requirement-row" key={a.name}>
              <span>{a.label}</span>
              <strong>
                {a.operator} {displayFactValue(a.name, a.value)}
              </strong>
              <small>{a.source_rules.join(", ")}</small>
            </div>
          ))}
          <p className="muted mt-4">{r.explanation.matching_policy}</p>
          <p className="muted mt-3">{r.explanation.scoring_policy}</p>
        </>
      )}
    </Modal>
  );
}
