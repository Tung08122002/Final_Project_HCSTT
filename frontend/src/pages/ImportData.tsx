import { useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, Download } from "lucide-react";
import { api, errorText } from "../services/api";
import { ErrorBox, Badge } from "../components/ui";
interface ImportReport {
  total: number;
  success: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  duplicate_codes: string[];
  errors: { row: number; error: string; raw_data: Record<string, unknown> }[];
  warnings: { row: number; code: string; notes: string[] }[];
}
export default function ImportData() {
  const [file, setFile] = useState<File>(),
    [update, setUpdate] = useState(true),
    [busy, setBusy] = useState(false),
    [report, setReport] = useState<ImportReport>(),
    [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError("");
    setReport(undefined);
    const form = new FormData();
    form.append("file", file);
    try {
      setReport(
        await api("/products/import?update_existing=" + update, {
          method: "POST",
          body: form,
        }),
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "import-report.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">EXCEL IMPORT</div>
          <h1>Import dữ liệu</h1>
          <p>
            Đưa dữ liệu laptop vào danh mục, chuẩn hóa và giữ nguyên thông tin
            gốc.
          </p>
        </div>
        <Badge tone="gray">.xlsx · Tối đa 20 MB</Badge>
      </div>
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <section className="panel">
          <form onSubmit={submit}>
            <label className="upload-zone">
              <span>
                <FileSpreadsheet size={34} />
              </span>
              <h3>{file ? file.name : "Chọn file Excel laptop"}</h3>
              <p>Nhấn để chọn tệp .xlsx từ máy tính</p>
              <input
                required
                aria-label="File Excel"
                type="file"
                accept=".xlsx"
                onChange={(e) => setFile(e.target.files?.[0])}
              />
            </label>
            <label className="check my-5">
              <input
                type="checkbox"
                checked={update}
                onChange={(e) => setUpdate(e.target.checked)}
              />{" "}
              Cập nhật laptop nếu trùng mã sản phẩm
            </label>
            <ErrorBox error={error} />
            <button
              className="button w-full justify-center"
              disabled={!file || busy}
            >
              <Upload size={17} />
              {busy ? "Đang nhập dữ liệu…" : "Import vào cơ sở dữ liệu"}
            </button>
          </form>
        </section>
        <section className="panel">
          <h3 className="mb-4">Cấu trúc file Excel</h3>
          <p className="muted mb-3">Dòng đầu tiên phải chứa 12 tên cột sau:</p>
          <div className="flex gap-2 flex-wrap">
            {[
              "STT",
              "Mã sản phẩm",
              "Tên sản phẩm",
              "Giá sản phẩm",
              "Nhãn hàng",
              "CPU",
              "GPU",
              "RAM",
              "Trọng lượng",
              "Dung lượng bộ nhớ",
              "Màu sắc",
              "Màn hình",
            ].map((c) => (
              <Badge tone="gray" key={c}>
                {c}
              </Badge>
            ))}
          </div>
          <div className="notice mt-5">
            <p>
              1 TB = 1024 GB. Giá trị chưa parse được được giữ ở dữ liệu gốc.
              File có dòng lỗi vẫn nhập các dòng hợp lệ.
            </p>
          </div>
          <p className="muted text-sm mt-4">
            Mã sản phẩm là duy nhất. Khi không bật cập nhật, các mã đã tồn tại
            được bỏ qua. Chỉ đọc sheet đầu tiên.
          </p>
        </section>
      </div>
      {report && (
        <section className="panel mt-6">
          <div className="panel-heading">
            <h3 className="flex items-center gap-2">
              <CheckCircle2 size={20} /> Báo cáo import
            </h3>
            <button className="text-button" onClick={download}>
              <Download size={16} /> Tải báo cáo đầy đủ
            </button>
          </div>
          <div className="stats-grid">
            {[
              ["Thêm mới", report.created],
              ["Cập nhật", report.updated],
              ["Bỏ qua", report.skipped],
              ["Thất bại", report.failed],
            ].map(([label, n]) => (
              <div className="stat-card" key={label}>
                <div>
                  <p>{label}</p>
                  <strong>{n}</strong>
                </div>
              </div>
            ))}
          </div>
          <p className="muted">
            Tổng {report.total} dòng · {report.success} thành công ·{" "}
            {report.duplicate_codes.length} mã lặp trong file
          </p>
          {report.errors.length > 0 && (
            <div className="error mt-3">
              <div>
                {report.errors.map((e, i) => (
                  <p key={i}>
                    Dòng {e.row}: {e.error}
                  </p>
                ))}
              </div>
            </div>
          )}
          <details className="mt-4">
            <summary>Lưu ý chuẩn hóa ({report.warnings.length} dòng)</summary>
            <div className="table-wrap mt-3">
              <table>
                <thead>
                  <tr>
                    <th>Dòng / Mã</th>
                    <th>Lưu ý</th>
                  </tr>
                </thead>
                <tbody>
                  {report.warnings.map((w) => (
                    <tr key={w.row}>
                      <td>
                        {w.row} / {w.code}
                      </td>
                      <td>{w.notes.join(" · ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>
      )}
    </>
  );
}
