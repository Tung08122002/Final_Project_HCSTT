import { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  GitBranch,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { useData } from "../hooks/useData";
import { send, errorText, displayFactValue } from "../services/api";
import { MoneyInput } from "../components/MoneyInput";
import { Autocomplete, Field, ErrorBox, Badge, Empty } from "../components/ui";
import { ProductCard, ProductDetail } from "../components/ProductView";
import { TraceView } from "../components/TraceView";
import type {
  Facts,
  InferenceResult,
  Recommendation,
  Attribute,
} from "../types";

const purposes = [
  ["student", "Học tập"],
  ["office", "Văn phòng"],
  ["programming", "Lập trình"],
  ["gaming", "Gaming"],
  ["graphics", "Thiết kế đồ họa"],
  ["video_editing", "Dựng video"],
  ["ai_data_science", "AI / Data Science"],
  ["engineering", "Kỹ thuật"],
  ["other", "Khác"],
];
export default function Consultation({ admin = false }: { admin?: boolean }) {
  const [facts, setFacts] = useState<Facts>({
    budget_min: 0,
    budget_max: 30000000,
    purpose: "programming",
    mobility_priority: "medium",
    gaming_level: "casual",
  });
  const [result, setResult] = useState<InferenceResult>();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [trace, setTrace] = useState(false),
    [selected, setSelected] = useState<Recommendation>();
  const [customName, setCustomName] = useState("");
  const { data: attrs } = useData<Attribute[]>("/attributes");
  const set = (key: string, value: string | number | boolean) =>
    setFacts((old) => {
      const next = { ...old };
      if (value === "") delete next[key];
      else next[key] = value;
      return next;
    });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      setResult(
        await send<InferenceResult>("/consultations", { facts, limit: 6 }),
      );
      setTimeout(
        () =>
          document
            .getElementById("results")
            ?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  const select = (
    key: string,
    label: string,
    options: (string | number)[][],
  ) => (
    <Field label={label}>
      <select
        value={String(facts[key] ?? "")}
        onChange={(e) =>
          set(
            key,
            e.target.value === ""
              ? ""
              : typeof options.find(
                    (x) => String(x[0]) === e.target.value,
                  )?.[0] === "number"
                ? Number(e.target.value)
                : e.target.value,
          )
        }
      >
        <option value="">Không yêu cầu</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </Field>
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">TÌM LỰA CHỌN DÀNH CHO BẠN</div>
          <h1>Tư vấn laptop</h1>
          <p>
            Chia sẻ nhu cầu, hệ thống sẽ suy ra cấu hình và giải thích từng đề
            xuất.
          </p>
        </div>
        <Badge>
          <GitBranch size={13} /> Suy diễn tiến
        </Badge>
      </div>
      <form onSubmit={submit}>
        <div className="consult-layout">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>
                  <span className="number-chip">1</span> Nhu cầu của bạn
                </h3>
                <p>Những thông tin quan trọng để bắt đầu</p>
              </div>
            </div>
            <div className="form-grid">
              <Field label="Ngân sách tối thiểu (VND)">
                <MoneyInput
                  aria-label="Ngân sách tối thiểu (VND)"
                  required
                  value={
                    typeof facts.budget_min === "number"
                      ? facts.budget_min
                      : null
                  }
                  onValueChange={(value) => set("budget_min", value ?? "")}
                />
              </Field>
              <Field label="Ngân sách tối đa (VND)">
                <MoneyInput
                  aria-label="Ngân sách tối đa (VND)"
                  required
                  value={
                    typeof facts.budget_max === "number"
                      ? facts.budget_max
                      : null
                  }
                  onValueChange={(value) => set("budget_max", value ?? "")}
                />
              </Field>
              {select("purpose", "Mục đích chính", purposes)}
              {select("secondary_purpose", "Mục đích phụ", purposes)}
              {select("gaming_level", "Mức độ chơi game", [
                ["casual", "Nhẹ / Giải trí"],
                ["medium", "Tầm trung"],
                ["high", "Chuyên sâu"],
              ])}
              {select("mobility_priority", "Nhu cầu di chuyển", [
                ["low", "Ít di chuyển"],
                ["medium", "Vừa phải"],
                ["high", "Thường xuyên"],
              ])}
            </div>
          </section>
          <aside className="consult-note">
            <div className="note-icon">
              <Sparkles size={25} />
            </div>
            <h3>
              Tư vấn có cơ sở,
              <br />
              lựa chọn có lý do.
            </h3>
            <p>
              Hệ thống chuyển nhu cầu thành facts, áp dụng luật trong cơ sở tri
              thức rồi đối chiếu với laptop thực tế.
            </p>
            <div>
              <span>01</span> Suy ra cấu hình phù hợp
            </div>
            <div>
              <span>02</span> Đánh giá từng tiêu chí
            </div>
            <div>
              <span>03</span> Giải thích rõ các đánh đổi
            </div>
            <small>
              Không chắc cấu hình? Chỉ cần nhập ngân sách và mục đích.
            </small>
          </aside>
        </div>
        <section className="panel mt-5">
          <div className="panel-heading">
            <div>
              <h3>
                <span className="number-chip">2</span> Ưu tiên cấu hình
              </h3>
              <p>Tùy chọn — hệ thống sẽ bổ sung yêu cầu từ luật</p>
            </div>
            <SlidersHorizontal size={20} />
          </div>
          <div className="form-grid three">
            {select("min_ram", "RAM tối thiểu", [
              [8, "8 GB"],
              [16, "16 GB"],
              [32, "32 GB"],
              [64, "64 GB+"],
            ])}
            {select("min_storage", "Ổ lưu trữ tối thiểu", [
              [256, "256 GB"],
              [512, "512 GB"],
              [1024, "1 TB"],
              [2048, "2 TB+"],
            ])}
            {select("max_weight", "Trọng lượng tối đa", [
              [1.3, "1.3 kg"],
              [1.5, "1.5 kg"],
              [2, "2 kg"],
            ])}
            {select("preferred_gpu_type", "Loại GPU", [
              ["integrated", "Tích hợp"],
              ["dedicated", "GPU rời"],
            ])}
            {select("preferred_gpu_vendor", "Hãng GPU", [
              ["NVIDIA", "NVIDIA"],
              ["AMD", "AMD"],
              ["Intel", "Intel"],
              ["Apple", "Apple"],
              ["Qualcomm", "Qualcomm"],
            ])}
            <Field label="Tần số quét tối thiểu (Hz)">
              <input
                type="number"
                min="0"
                placeholder="Không yêu cầu"
                value={String(facts.min_refresh_rate ?? "")}
                onChange={(e) =>
                  set(
                    "min_refresh_rate",
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />
            </Field>
          </div>
          <details className="advanced">
            <summary>Lựa chọn chi tiết từ danh mục</summary>
            <div className="form-grid three mt-4">
              {[
                ["brand", "Nhãn hàng", "brand"],
                ["cpu", "CPU cụ thể", "cpu"],
                ["gpu", "GPU cụ thể", "gpu"],
                ["color", "Màu sắc", "color"],
                ["display", "Màn hình cụ thể", "display_raw"],
              ].map(([key, label, field]) => (
                <Autocomplete
                  key={key}
                  field={field}
                  label={label}
                  value={String(facts[key] ?? "")}
                  onChange={(v) => set(key, v)}
                />
              ))}
            </div>
          </details>
          <details className="advanced">
            <summary>Facts bổ sung từ tri thức mở rộng</summary>
            <p className="muted mt-3">
              Sử dụng thuộc tính mới do quản trị viên tạo.
            </p>
            <div className="form-grid mt-3">
              <Field label="Thêm thuộc tính">
                <select
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                >
                  <option value="">Chọn thuộc tính</option>
                  {attrs
                    ?.filter((a) => a.active)
                    .map((a) => (
                      <option value={a.name} key={a.id}>
                        {a.label} ({a.name})
                      </option>
                    ))}
                </select>
              </Field>
              {customName && (
                <Field label="Giá trị">
                  {(() => {
                    const a = attrs?.find((a) => a.name === customName);
                    return a?.data_type === "boolean" ||
                      a?.data_type === "enum" ? (
                      <select
                        value={String(facts[customName] ?? "")}
                        onChange={(e) =>
                          set(
                            customName,
                            a.data_type === "boolean"
                              ? e.target.value === "true"
                              : e.target.value,
                          )
                        }
                      >
                        <option value="">Chọn</option>
                        {(a.data_type === "boolean"
                          ? ["true", "false"]
                          : a.allowed_values
                        ).map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    ) : a?.data_type === "number" &&
                      a.unit?.toUpperCase() === "VND" ? (
                      <MoneyInput
                        aria-label="Giá trị (VND)"
                        value={
                          typeof facts[customName] === "number"
                            ? (facts[customName] as number)
                            : null
                        }
                        onValueChange={(value) => set(customName, value ?? "")}
                      />
                    ) : (
                      <input
                        type={a?.data_type === "number" ? "number" : "text"}
                        value={String(facts[customName] ?? "")}
                        onChange={(e) =>
                          set(
                            customName,
                            a?.data_type === "number"
                              ? Number(e.target.value)
                              : e.target.value,
                          )
                        }
                      />
                    );
                  })()}
                </Field>
              )}
            </div>
            <div className="flex gap-2 flex-wrap mt-3">
              {Object.entries(facts).map(([k, v]) => (
                <button
                  type="button"
                  className="badge gray"
                  key={k}
                  onClick={() => set(k, "")}
                >
                  {k}: {displayFactValue(k, v)} ×
                </button>
              ))}
            </div>
          </details>
          <ErrorBox error={error} />
          <div className="form-footer">
            <span>
              <GitBranch size={16} /> Mỗi đề xuất đều kèm dấu vết suy luận
            </span>
            <button className="button" disabled={busy}>
              {busy ? "Đang suy diễn…" : "Tìm laptop phù hợp"}{" "}
              <ArrowRight size={17} />
            </button>
          </div>
        </section>
      </form>
      {result && (
        <section id="results" className="mt-8">
          <div className="page-heading">
            <div>
              <div className="eyebrow">KẾT QUẢ TƯ VẤN #{result.session_id}</div>
              <h2>Những lựa chọn phù hợp</h2>
              <p>
                {result.matched_rules.length} luật đã áp dụng ·{" "}
                {result.candidate_count} laptop trong phạm vi bắt buộc · Hiển
                thị {result.recommended_products.length} kết quả tốt nhất
              </p>
            </div>
            <button className="button secondary" onClick={() => setTrace(true)}>
              <GitBranch size={17} /> Xem cách suy luận
            </button>
          </div>
          {result.termination !== "fixed_point" && (
            <div className="error">
              Đã đạt giới hạn vòng lặp. Kết quả suy diễn chưa đầy đủ.
            </div>
          )}
          <div className="requirement-chips">
            {result.technical_requirements.map((r) => (
              <Badge key={r.name} tone="gray">
                {r.label}: {r.operator} {displayFactValue(r.name, r.value)}
              </Badge>
            ))}
          </div>
          {result.recommended_products.length ? (
            <div className="product-grid">
              {result.recommended_products.map((r) => (
                <ProductCard
                  key={r.product.id}
                  product={r.product}
                  recommendation={r}
                  onDetail={() => setSelected(r)}
                />
              ))}
            </div>
          ) : (
            <Empty>
              <RotateCcw size={24} />
              {result.explanation.empty_message}
            </Empty>
          )}
          <p className="muted text-sm mt-4">{result.explanation.warning}</p>
          <details className="mt-4">
            <summary>Cách chấm điểm</summary>
            <p className="muted mt-3">{result.explanation.scoring_policy}</p>
          </details>
        </section>
      )}
      {trace && result && (
        <TraceView result={result} onClose={() => setTrace(false)} />
      )}
      {selected && (
        <ProductDetail
          showRawData={admin}
          product={selected.product}
          recommendation={selected}
          onClose={() => setSelected(undefined)}
        />
      )}
    </>
  );
}
