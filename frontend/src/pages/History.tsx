import { useState } from "react";
import { Eye, History as HistoryIcon, Download, Trash2 } from "lucide-react";
import { useData } from "../hooks/useData";
import { api, dateTime, errorText, money } from "../services/api";
import type {
  HistoryItem,
  Page,
  InferenceResult,
  Recommendation,
} from "../types";
import {
  Loading,
  ErrorBox,
  Pagination,
  Modal,
  Empty,
  Badge,
} from "../components/ui";
import { TraceView } from "../components/TraceView";
import { ProductCard, ProductDetail } from "../components/ProductView";
export default function History({ admin = false }: { admin?: boolean }) {
  const [page, setPage] = useState(1),
    [revision, setRevision] = useState(0),
    [checked, setChecked] = useState<Record<number, HistoryItem>>({}),
    [confirmDelete, setConfirmDelete] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [result, setResult] = useState<InferenceResult>(),
    [trace, setTrace] = useState(false),
    [selected, setSelected] = useState<Recommendation>(),
    [error, setError] = useState("");
  const {
    data,
    loading,
    error: loadError,
  } = useData<Page<HistoryItem>>("/consultations?page=" + page, revision);
  const checkedSessions = Object.values(checked);
  const currentSessions = data?.items ?? [];
  const allChecked =
    currentSessions.length > 0 && currentSessions.every((s) => checked[s.id]);
  const someChecked = currentSessions.some((s) => checked[s.id]);
  function checkSessions(sessions: HistoryItem[], value: boolean) {
    setChecked((old) => {
      const next = { ...old };
      for (const session of sessions) {
        if (value) next[session.id] = session;
        else delete next[session.id];
      }
      return next;
    });
    setNotice("");
  }
  async function removeSelected() {
    if (busy || !checkedSessions.length) return;
    setBusy(true);
    setError("");
    try {
      const response = await api<{ deleted: number }>("/consultations", {
        method: "DELETE",
        body: JSON.stringify({ ids: checkedSessions.map((s) => s.id) }),
      });
      setNotice(`Đã xóa ${response.deleted} phiên suy diễn.`);
      setChecked({});
      setConfirmDelete(false);
      setResult(undefined);
      setPage(1);
      setRevision((n) => n + 1);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function open(id: number) {
    setError("");
    try {
      setResult(await api("/consultations/" + id));
    } catch (e) {
      setError(errorText(e));
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `consultation-${result?.session_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">INFERENCE HISTORY</div>
          <h1>Lịch sử suy diễn</h1>
          <p>
            Lịch sử riêng của {admin ? "Quản trị demo" : "bạn"}: xem lại nhu
            cầu, luật đã áp dụng và kết quả tại thời điểm tư vấn.
          </p>
        </div>
        <HistoryIcon size={26} />
      </div>
      <ErrorBox error={error || loadError} />
      {notice && (
        <p className="notice mb-4" role="status">
          {notice}
        </p>
      )}
      {admin && (
        <p className="muted mb-4">
          Đánh dấu các phiên muốn xóa. Bạn có thể chọn ở nhiều trang trước khi
          xác nhận.
        </p>
      )}
      {admin && checkedSessions.length > 0 && (
        <div className="selection-toolbar mb-4">
          <strong>Đã chọn {checkedSessions.length} phiên</strong>
          <button className="text-button" onClick={() => setChecked({})}>
            Bỏ chọn tất cả
          </button>
          <button
            className="button danger-fill"
            onClick={() => {
              setError("");
              setConfirmDelete(true);
            }}
          >
            <Trash2 size={16} /> Xóa đã chọn ({checkedSessions.length})
          </button>
        </div>
      )}
      <section className="panel">
        {loading ? (
          <Loading />
        ) : data?.items.length ? (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {admin && (
                      <th>
                        <input
                          type="checkbox"
                          aria-label="Chọn tất cả phiên trên trang này"
                          checked={allChecked}
                          ref={(element) => {
                            if (element)
                              element.indeterminate =
                                someChecked && !allChecked;
                          }}
                          onChange={(e) =>
                            checkSessions(currentSessions, e.target.checked)
                          }
                        />
                      </th>
                    )}
                    <th>Phiên</th>
                    <th>Thời gian</th>
                    <th>Đầu vào</th>
                    <th>Luật áp dụng</th>
                    <th>Đề xuất</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((s) => (
                    <tr key={s.id}>
                      {admin && (
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Chọn phiên #${s.id}`}
                            checked={!!checked[s.id]}
                            onChange={(e) =>
                              checkSessions([s], e.target.checked)
                            }
                          />
                        </td>
                      )}
                      <td>
                        <b>#{s.id}</b>
                      </td>
                      <td>{dateTime(s.created_at)}</td>
                      <td>
                        <code>
                          {String(s.initial_facts.purpose || "Tùy chỉnh")}
                        </code>
                        <small className="block">
                          {typeof s.initial_facts.budget_max === "number"
                            ? money(s.initial_facts.budget_max)
                            : "Không giới hạn"}
                        </small>
                      </td>
                      <td>
                        <Badge>{s.rules_fired} luật</Badge>
                      </td>
                      <td>{s.recommendation_count} laptop</td>
                      <td>
                        <button
                          className="text-button"
                          onClick={() => open(s.id)}
                        >
                          <Eye size={16} /> Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              total={data.total}
              size={15}
              onChange={setPage}
            />
          </>
        ) : (
          <Empty>Chưa có phiên tư vấn được lưu.</Empty>
        )}
      </section>
      {result && !trace && !selected && (
        <Modal
          title={"Phiên tư vấn #" + result.session_id}
          onClose={() => setResult(undefined)}
          wide
        >
          <p className="muted">{result.explanation.summary}</p>
          <div className="flex gap-3 my-5 flex-wrap">
            <button className="button" onClick={() => setTrace(true)}>
              Xem cách suy luận
            </button>
            <button className="button secondary" onClick={download}>
              <Download size={16} /> Xuất log JSON
            </button>
          </div>
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
          {!result.recommended_products.length && (
            <Empty>{result.explanation.empty_message}</Empty>
          )}
        </Modal>
      )}
      {result && trace && (
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
      {confirmDelete && checkedSessions.length > 0 && (
        <Modal
          title={`Xác nhận xóa ${checkedSessions.length} phiên suy diễn`}
          onClose={() => {
            if (!busy) setConfirmDelete(false);
          }}
        >
          <p>
            <strong>Không thể hoàn tác.</strong> Các phiên đã chọn và toàn bộ
            dấu vết suy luận của chúng sẽ bị xóa. Danh sách laptop và luật suy
            diễn vẫn được giữ nguyên.
          </p>
          <ul className="bulk-delete-list">
            {checkedSessions.map((s) => (
              <li key={s.id}>
                Phiên <strong>#{s.id}</strong> · {dateTime(s.created_at)}
              </li>
            ))}
          </ul>
          <ErrorBox error={error} />
          <div className="form-footer">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setConfirmDelete(false)}
            >
              Hủy
            </button>
            <button
              className="button danger-fill"
              disabled={busy}
              onClick={removeSelected}
            >
              {busy ? "Đang xóa…" : `Xóa ${checkedSessions.length} phiên`}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
