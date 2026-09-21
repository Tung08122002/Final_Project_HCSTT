import { Fragment, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowRight,
  BookOpen,
  Database,
  GitBranch,
} from "lucide-react";
import { api, send, errorText } from "../services/api";
import { useData } from "../hooks/useData";
import {
  Field,
  Modal,
  ErrorBox,
  SearchBox,
  Loading,
  Badge,
  Pagination,
} from "../components/ui";
import type { Attribute, DashboardData } from "../types";
const productFields = [
  "has_dedicated_gpu",
  "price",
  "ram_gb",
  "weight_kg",
  "storage_gb",
  "refresh_rate_hz",
  "screen_size_inch",
  "brand",
  "cpu",
  "gpu",
  "color",
  "display_raw",
  "resolution",
  "gpu_type",
  "gpu_vendor",
  "gpu_level",
  "cpu_vendor",
  "storage_type",
];
function AttributeEditor({
  attribute,
  onClose,
  onSaved,
}: {
  attribute: Partial<Attribute>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
      ...{
        name: "",
        label: "",
        data_type: "string",
        unit: "",
        description: "",
        allowed_values: [],
        active: true,
        merge_strategy: "first",
        product_field: "",
        match_operator: "=",
        score_category: "other",
      },
      ...attribute,
    }),
    [values, setValues] = useState((attribute.allowed_values || []).join("\n")),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { id, ...data } = form;
      await send(
        "/attributes" + (id ? "/" + id : ""),
        {
          ...data,
          unit: data.unit || null,
          product_field: data.product_field || null,
          allowed_values: values
            .split("\n")
            .map((v) => v.trim())
            .filter(Boolean),
        },
        id ? "PUT" : "POST",
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
      title={
        attribute.id ? "Sửa thuộc tính tri thức" : "Thu nhận thuộc tính mới"
      }
      onClose={onClose}
      wide
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Tên fact (snake_case)">
            <input
              required
              pattern="[a-z][a-z0-9_]*"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Nhãn hiển thị">
            <input
              required
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </Field>
          <Field label="Kiểu dữ liệu">
            <select
              value={form.data_type}
              onChange={(e) =>
                setForm({
                  ...form,
                  data_type: e.target.value as Attribute["data_type"],
                  merge_strategy: "first",
                })
              }
            >
              {["number", "string", "enum", "boolean"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Đơn vị">
            <input
              value={form.unit || ""}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
          </Field>
          <Field label="Chiến lược gộp fact">
            <select
              value={form.merge_strategy}
              onChange={(e) =>
                setForm({ ...form, merge_strategy: e.target.value })
              }
            >
              <option value="first">Giữ giá trị xuất hiện trước</option>
              {form.data_type === "number" && (
                <>
                  <option value="max">Lấy giá trị lớn hơn</option>
                  <option value="min">Lấy giá trị nhỏ hơn</option>
                </>
              )}
              {form.data_type === "boolean" && (
                <option value="or">OR (true được ưu tiên)</option>
              )}
            </select>
          </Field>
          <Field label="Trường sản phẩm để đối chiếu">
            <select
              value={form.product_field || ""}
              onChange={(e) =>
                setForm({ ...form, product_field: e.target.value })
              }
            >
              <option value="">Chỉ dùng để suy luận</option>
              {productFields.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </Field>
          <Field label="Toán tử đối chiếu">
            <select
              value={form.match_operator}
              onChange={(e) =>
                setForm({ ...form, match_operator: e.target.value })
              }
            >
              {["=", "!=", ">", ">=", "<", "<=", "CONTAINS"].map((op) => (
                <option key={op}>{op}</option>
              ))}
            </select>
          </Field>
          <Field label="Nhóm chấm điểm">
            <select
              value={form.score_category}
              onChange={(e) =>
                setForm({ ...form, score_category: e.target.value })
              }
            >
              {[
                "other",
                "budget",
                "ram",
                "gpu",
                "storage",
                "display",
                "weight",
              ].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Field>
        </div>
        {form.data_type === "enum" && (
          <Field label="Allowed Values — mỗi dòng một giá trị">
            <textarea
              required
              rows={5}
              value={values}
              onChange={(e) => setValues(e.target.value)}
            />
          </Field>
        )}
        <Field label="Mô tả">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <label className="check mt-4">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />{" "}
          Đang hoạt động
        </label>
        <div className="notice mt-3">
          Ánh xạ trường sản phẩm giúp fact mới tham gia matching mà không cần
          sửa source. Nhóm “other” là ràng buộc bắt buộc.
        </div>
        <ErrorBox error={error} />
        <div className="form-footer">
          <button type="button" className="button secondary" onClick={onClose}>
            Hủy
          </button>
          <button className="button" disabled={busy}>
            Lưu thuộc tính
          </button>
        </div>
      </form>
    </Modal>
  );
}
export default function Knowledge({
  acquisition = false,
  navigate,
}: {
  acquisition?: boolean;
  navigate: (p: string) => void;
}) {
  const [revision, setRevision] = useState(0),
    [q, setQ] = useState(""),
    [page, setPage] = useState(1),
    [editor, setEditor] = useState<Partial<Attribute>>(),
    [deleting, setDeleting] = useState<Attribute>(),
    [error, setError] = useState("");
  const {
    data: attrs,
    loading,
    error: loadError,
  } = useData<Attribute[]>("/attributes", revision);
  const { data: d } = useData<DashboardData>("/dashboard", revision);
  async function remove() {
    try {
      await api("/attributes/" + deleting?.id, { method: "DELETE" });
      setDeleting(undefined);
      setRevision((x) => x + 1);
    } catch (e) {
      setError(errorText(e));
    }
  }
  const filtered =
    attrs?.filter((a) =>
      (a.name + a.label + a.data_type).toLowerCase().includes(q.toLowerCase()),
    ) || [];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">KNOWLEDGE BASE</div>
          <h1>{acquisition ? "Thu nhận tri thức" : "Cơ sở tri thức"}</h1>
          <p>
            {acquisition
              ? "Mở rộng thuộc tính, giá trị cho phép, luật và kết luận của hệ thống."
              : "Tri thức được lưu độc lập với dữ liệu sản phẩm và bộ máy suy diễn."}
          </p>
        </div>
        <button className="button" onClick={() => setEditor({})}>
          <Plus size={17} /> Thêm thuộc tính
        </button>
      </div>
      {!acquisition && (
        <>
          <div className="stats-grid">
            {[
              ["Thuộc tính", d?.total_attributes],
              ["Luật đang bật", d?.active_rules],
              ["Luật đã tắt", (d?.total_rules || 0) - (d?.active_rules || 0)],
              ["Laptop", d?.total_products],
            ].map(([label, value]) => (
              <div className="stat-card" key={label}>
                <div>
                  <p>{label}</p>
                  <strong>{value ?? "—"}</strong>
                </div>
                <BookOpen size={22} />
              </div>
            ))}
          </div>
          <div className="panel knowledge-flow mb-5">
            {[
              "Nhu cầu / Facts",
              "Luật IF–THEN",
              "Yêu cầu kỹ thuật",
              "Đối chiếu laptop",
            ].map((s, i) => (
              <Fragment key={s}>
                <span className="knowledge-node">
                  {i === 1 ? <GitBranch size={21} /> : <Database size={21} />}
                  <b>{s}</b>
                </span>
                {i < 3 && (
                  <span className="knowledge-arrow" aria-hidden="true">
                    <ArrowRight size={19} />
                  </span>
                )}
              </Fragment>
            ))}
          </div>
        </>
      )}
      {acquisition && (
        <div className="notice mb-5">
          <BookOpen size={22} />
          <div>
            <b>Quy trình bổ sung tri thức</b>
            <p>
              1. Tạo thuộc tính và allowed values → 2. Tạo luật → 3. Thêm kết
              luận ở phần THEN → 4. Xem dấu vết tại Tư vấn laptop.
            </p>
            <button
              className="text-button mt-2"
              onClick={() => navigate("rules")}
            >
              Mở trình tạo luật & kết luận <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}
      <section className="panel">
        <div className="panel-heading">
          <h3>Từ điển thuộc tính</h3>
          <SearchBox
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="Tìm thuộc tính…"
          />
        </div>
        <ErrorBox error={error || loadError} />
        {loading ? (
          <Loading />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Thuộc tính</th>
                  <th>Kiểu / Đơn vị</th>
                  <th>Giá trị cho phép</th>
                  <th>Gộp facts</th>
                  <th>Matching</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice((page - 1) * 15, page * 15).map((a) => (
                  <tr key={a.id}>
                    <td>
                      <b>{a.label}</b>
                      <code className="block">{a.name}</code>
                      {!a.active && <Badge tone="gray">Đã tắt</Badge>}
                    </td>
                    <td>
                      {a.data_type}
                      {a.unit ? " / " + a.unit : ""}
                    </td>
                    <td className="max-w-64 text-xs">
                      {a.allowed_values.join(", ") || "—"}
                    </td>
                    <td>
                      <Badge tone="gray">{a.merge_strategy}</Badge>
                    </td>
                    <td>
                      <code>
                        {a.product_field
                          ? `${a.product_field} ${a.match_operator}`
                          : "Fact trung gian"}
                      </code>
                    </td>
                    <td>
                      <div className="flex">
                        <button
                          className="icon-button"
                          aria-label={"Sửa " + a.name}
                          onClick={() => setEditor(a)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-button danger"
                          aria-label={"Xóa " + a.name}
                          onClick={() => {
                            setError("");
                            setDeleting(a);
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={page}
          size={15}
          total={filtered.length}
          onChange={setPage}
        />
      </section>
      {editor && (
        <AttributeEditor
          attribute={editor}
          onClose={() => setEditor(undefined)}
          onSaved={() => {
            setEditor(undefined);
            setRevision((x) => x + 1);
          }}
        />
      )}
      {deleting && (
        <Modal title="Xóa thuộc tính" onClose={() => setDeleting(undefined)}>
          <p>
            Xóa <b>{deleting.name}</b>? Thuộc tính đang được luật sử dụng sẽ
            không thể xóa.
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
              Xóa thuộc tính
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
