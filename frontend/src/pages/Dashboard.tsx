import {
  ArrowRight,
  Laptop,
  Layers3,
  GitBranch,
  MessageSquare,
  ArrowUpRight,
  Sparkles,
  Database,
  Workflow,
  CheckCheck,
} from "lucide-react";
import { useData } from "../hooks/useData";
import { Loading, ErrorBox, Badge } from "../components/ui";
import type { DashboardData } from "../types";
import { dateTime } from "../services/api";
export default function Dashboard({
  navigate,
}: {
  navigate: (p: string) => void;
}) {
  const { data: d, error, loading } = useData<DashboardData>("/dashboard");
  if (loading) return <Loading />;
  if (!d) return <ErrorBox error={error} />;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">KHÔNG GIAN TƯ VẤN THÔNG MINH</div>
          <h1>Tổng quan hệ thống</h1>
          <p>Mỗi lựa chọn tốt bắt đầu từ việc hiểu đúng nhu cầu.</p>
        </div>
        <Badge>
          <span className="status-dot" /> Hệ thống sẵn sàng
        </Badge>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-label">
            <Sparkles size={15} /> KNOWLEDGE-BASED LAPTOP ADVISOR
          </span>
          <h2>
            Hiểu nhu cầu.
            <br />
            Chọn đúng laptop.
          </h2>
          <p>
            Từ nhu cầu của bạn đến cấu hình phù hợp,
            <br className="hidden md:block" /> với từng bước suy luận rõ ràng và
            có thể kiểm chứng.
          </p>
          <button className="button white" onClick={() => navigate("consult")}>
            Bắt đầu tư vấn <ArrowRight size={17} />
          </button>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="visual-node node-a">
            <Database size={18} />
            <span>Cơ sở tri thức</span>
            <b>{d.active_rules} luật</b>
          </div>
          <div className="laptop-drawing">
            <div className="laptop-screen">
              <div className="screen-nav">
                <i />
                <i />
                <i />
              </div>
              <div className="screen-content">
                <Workflow size={34} />
                <span>Phân tích nhu cầu</span>
                <div className="screen-bar" />
                <div className="screen-bar short" />
              </div>
            </div>
            <div className="laptop-base" />
          </div>
          <div className="visual-node node-b">
            <CheckCheck size={18} />
            <span>Lựa chọn có cơ sở</span>
          </div>
          <span className="visual-spark">+</span>
        </div>
      </section>
      <div className="stats-grid">
        {[
          {
            label: "Laptop trong danh mục",
            value: d.total_products,
            sub: `${d.total_brands} thương hiệu`,
            icon: Laptop,
          },
          {
            label: "Luật suy diễn",
            value: d.total_rules,
            sub: `${d.active_rules} luật đang hoạt động`,
            icon: GitBranch,
          },
          {
            label: "Thuộc tính tri thức",
            value: d.total_attributes,
            sub: "Mở rộng không cần sửa code",
            icon: Layers3,
          },
          {
            label: "Phiên tư vấn",
            value: d.consultation_sessions,
            sub: "Lưu đầy đủ dấu vết suy luận",
            icon: MessageSquare,
          },
        ].map((s) => (
          <article className="stat-card" key={s.label}>
            <div>
              <p>{s.label}</p>
              <strong>{s.value}</strong>
              <small>{s.sub}</small>
            </div>
            <span>
              <s.icon size={21} />
            </span>
          </article>
        ))}
      </div>
      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Từ nhu cầu đến lựa chọn</h3>
              <p>Quy trình suy diễn tiến của hệ thống</p>
            </div>
            <Workflow size={20} />
          </div>
          <div className="flow-steps">
            {[
              {
                n: "01",
                title: "Tiếp nhận nhu cầu",
                text: "Ngân sách, mục đích & ưu tiên",
                icon: MessageSquare,
              },
              {
                n: "02",
                title: "Suy diễn từ tri thức",
                text: "Áp dụng luật IF–THEN để tạo facts mới",
                icon: GitBranch,
              },
              {
                n: "03",
                title: "Đối chiếu & chấm điểm",
                text: "So sánh yêu cầu với dữ liệu laptop",
                icon: Laptop,
              },
              {
                n: "04",
                title: "Đề xuất có giải thích",
                text: "Xem lý do phù hợp và các đánh đổi",
                icon: CheckCheck,
              },
            ].map((s) => (
              <div className="flow-step" key={s.n}>
                <span className="flow-icon">
                  <s.icon size={20} />
                </span>
                <div>
                  <h4>{s.title}</h4>
                  <p>{s.text}</p>
                </div>
                <span className="flow-number">{s.n}</span>
              </div>
            ))}
          </div>
          <button className="text-button" onClick={() => navigate("help")}>
            Tìm hiểu cách hệ thống hoạt động <ArrowUpRight size={15} />
          </button>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Danh mục thương hiệu</h3>
              <p>Phân bố dữ liệu laptop hiện có</p>
            </div>
            <Badge tone="gray">{d.total_brands} hãng</Badge>
          </div>
          <div className="brand-chart">
            {d.brands.slice(0, 7).map((b, i) => (
              <div key={b.name}>
                <div className="flex justify-between">
                  <span>{b.name}</span>
                  <strong>{b.count}</strong>
                </div>
                <div className="bar-track">
                  <div
                    style={{
                      width: `${(b.count / Math.max(...d.brands.map((x) => x.count), 1)) * 100}%`,
                      opacity: 1 - i * 0.08,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button className="text-button" onClick={() => navigate("catalog")}>
            Khám phá danh sách laptop <ArrowUpRight size={15} />
          </button>
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Phiên tư vấn gần đây</h3>
            <p>Mỗi phiên đều lưu lại quá trình suy luận</p>
          </div>
          <button className="text-button" onClick={() => navigate("history")}>
            Xem tất cả <ArrowRight size={15} />
          </button>
        </div>
        {d.recent_consultations.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Phiên</th>
                  <th>Thời gian</th>
                  <th>Mục đích</th>
                  <th>Luật áp dụng</th>
                  <th>Đề xuất</th>
                </tr>
              </thead>
              <tbody>
                {d.recent_consultations.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <b>#{String(s.id).padStart(4, "0")}</b>
                    </td>
                    <td>{dateTime(s.created_at)}</td>
                    <td>{String(s.initial_facts.purpose || "Tùy chỉnh")}</td>
                    <td>{s.rules_fired} luật</td>
                    <td>{s.recommendation_count} laptop</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty compact">
            <MessageSquare size={22} />
            <p>Chưa có phiên tư vấn. Bắt đầu để tìm laptop phù hợp với bạn.</p>
          </div>
        )}
      </section>
    </>
  );
}
