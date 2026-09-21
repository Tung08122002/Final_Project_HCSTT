import {
  Cpu,
  Monitor,
  MemoryStick,
  HardDrive,
  Weight,
  Laptop,
  ArrowUpRight,
} from "lucide-react";
import type { Product, Recommendation } from "../types";
import { money, isMoneyFact, displayFactValue } from "../services/api";
import { Badge, Modal } from "./ui";

export function ProductCard({
  product: p,
  recommendation: r,
  onDetail,
  selected = false,
  onSelect,
}: {
  product: Product;
  recommendation?: Recommendation;
  onDetail: () => void;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
}) {
  return (
    <article className="product-card">
      <div className="product-top">
        <span className="product-icon">
          <Laptop size={29} />
        </span>
        <div>
          <small>{p.brand}</small>
          <code>{p.product_code}</code>
        </div>
        {onSelect && (
          <label className="product-select">
            <input
              type="checkbox"
              aria-label={"Chọn " + p.product_code}
              checked={selected}
              onChange={(event) => onSelect(event.target.checked)}
            />
            Chọn
          </label>
        )}
        {r && (
          <div className="score">
            <strong>
              {r.score}
              <small>%</small>
            </strong>
            <span>phù hợp</span>
          </div>
        )}
      </div>
      <h3>{p.product_name}</h3>
      <div className="price">{money(p.price)}</div>
      <div className="spec-grid">
        <span>
          <Cpu size={15} />
          {p.cpu || "Chưa rõ"}
        </span>
        <span>
          <MemoryStick size={15} />
          {p.ram_gb ?? "?"} GB RAM
        </span>
        <span>
          <HardDrive size={15} />
          {p.storage_raw || "Chưa rõ"}
        </span>
        <span>
          <Monitor size={15} />
          {p.display_raw || "Chưa rõ"}
        </span>
        <span>
          <Weight size={15} />
          {p.weight_kg ?? "?"} kg
        </span>
        <span>{p.color || "Chưa rõ màu"}</span>
      </div>
      <p className="gpu-line">{p.gpu || "GPU chưa xác minh"}</p>
      {r && (
        <div className="match-summary">
          <Badge tone={r.fully_matched ? "green" : "amber"}>
            {r.fully_matched
              ? "Đáp ứng các tiêu chí"
              : "Có tiêu chí cần cân nhắc"}
          </Badge>
          <p>{r.tradeoffs[0] || r.reasons[0]}</p>
        </div>
      )}
      <button className="card-action" onClick={onDetail}>
        Xem chi tiết {r ? "& điểm phù hợp" : ""}
        <ArrowUpRight size={17} />
      </button>
    </article>
  );
}
export function ProductDetail({
  product: p,
  recommendation: r,
  onClose,
}: {
  product: Product;
  recommendation?: Recommendation;
  onClose: () => void;
}) {
  return (
    <Modal title="Chi tiết laptop" onClose={onClose} wide>
      <Badge>{p.brand}</Badge>
      <h2 className="mt-3">{p.product_name}</h2>
      <p className="price">{money(p.price)}</p>
      <dl className="detail-grid">
        {Object.entries({
          "Mã sản phẩm": p.product_code,
          CPU: p.cpu,
          GPU: p.gpu,
          RAM: p.ram_gb == null ? null : p.ram_gb + " GB",
          "Ổ lưu trữ": p.storage_raw,
          "Trọng lượng gốc": p.weight_raw,
          "Trọng lượng chuẩn": p.weight_kg == null ? null : p.weight_kg + " kg",
          "Màn hình": p.display_raw,
          "Độ phân giải": p.resolution,
          "Tần số quét":
            p.refresh_rate_hz == null ? null : p.refresh_rate_hz + " Hz",
          Màu: p.color,
        }).map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v ?? "Chưa xác minh"}</dd>
          </div>
        ))}
      </dl>
      {r && (
        <>
          <h3 className="section-title">Điểm phù hợp: {r.score}%</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tiêu chí</th>
                  <th>Thực tế / Yêu cầu</th>
                  <th>Kết quả</th>
                  <th>Điểm</th>
                  <th>Nguồn suy luận</th>
                </tr>
              </thead>
              <tbody>
                {r.criteria.map((c) => (
                  <tr key={c.fact}>
                    <td>{c.label}</td>
                    <td>
                      {isMoneyFact(c.fact)
                        ? c.actual == null
                          ? "?"
                          : money(Number(c.actual))
                        : String(c.actual ?? "?")}{" "}
                      / {c.operator} {displayFactValue(c.fact, c.expected)}
                    </td>
                    <td>
                      <Badge tone={c.status === "met" ? "green" : "amber"}>
                        {c.status === "met"
                          ? "Đạt"
                          : c.status === "unknown"
                            ? "Chưa rõ"
                            : "Chưa đạt"}
                      </Badge>
                    </td>
                    <td>
                      {c.points ?? "—"} / {c.max_points ?? "—"}
                    </td>
                    <td>{c.source_rules.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {p.normalization_notes.length > 0 && (
        <div className="notice mt-4">
          {p.normalization_notes.map((n) => (
            <p key={n}>{n}</p>
          ))}
        </div>
      )}
      <details className="mt-4">
        <summary>Dữ liệu gốc từ Excel</summary>
        <pre>{JSON.stringify(p.raw_data, null, 2)}</pre>
      </details>
    </Modal>
  );
}
