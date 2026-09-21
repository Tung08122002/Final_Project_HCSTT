import { useState } from "react";
import { Eye, History as HistoryIcon, Download } from "lucide-react";
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
export default function History() {
  const [page, setPage] = useState(1),
    [result, setResult] = useState<InferenceResult>(),
    [trace, setTrace] = useState(false),
    [selected, setSelected] = useState<Recommendation>(),
    [error, setError] = useState("");
  const {
    data,
    loading,
    error: loadError,
  } = useData<Page<HistoryItem>>("/consultations?page=" + page);
  async function open(id: number) {
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
            Xem lại nhu cầu, luật đã áp dụng và kết quả tại thời điểm tư vấn.
          </p>
        </div>
        <HistoryIcon size={26} />
      </div>
      <ErrorBox error={error || loadError} />
      <section className="panel">
        {loading ? (
          <Loading />
        ) : data?.items.length ? (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
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
          product={selected.product}
          recommendation={selected}
          onClose={() => setSelected(undefined)}
        />
      )}
    </>
  );
}
