import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, PackageSearch } from "lucide-react";
import { useData, useDebounce } from "../hooks/useData";
import { api, send, money, errorText } from "../services/api";
import { MoneyInput } from "../components/MoneyInput";
import {
  SearchBox,
  Autocomplete,
  Pagination,
  Loading,
  ErrorBox,
  Empty,
  Modal,
  Field,
} from "../components/ui";
import { ProductCard, ProductDetail } from "../components/ProductView";
import type { Product, Page } from "../types";

const fields: [keyof Product, string, boolean?][] = [
  ["product_code", "Mã sản phẩm"],
  ["product_name", "Tên sản phẩm"],
  ["price", "Giá (VND)", true],
  ["brand", "Nhãn hàng"],
  ["cpu", "CPU"],
  ["gpu", "GPU"],
  ["ram_gb", "RAM (GB)", true],
  ["storage_raw", "Ổ lưu trữ (gốc)"],
  ["storage_gb", "Dung lượng (GB)", true],
  ["weight_raw", "Trọng lượng (gốc)"],
  ["weight_kg", "Trọng lượng (kg)", true],
  ["color", "Màu sắc"],
  ["display_raw", "Màn hình (gốc)"],
  ["screen_size_inch", "Kích thước (inch)", true],
  ["resolution", "Độ phân giải"],
  ["refresh_rate_hz", "Tần số quét (Hz)", true],
];
function ProductEditor({
  product,
  onClose,
  onSaved,
}: {
  product: Partial<Product>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Record<string, unknown>>({ ...product }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = Object.fromEntries(
        fields.map(([k, , numeric]) => [
          k,
          form[k] === "" || form[k] == null
            ? null
            : numeric
              ? Number(form[k])
              : form[k],
        ]),
      );
      await send(
        "/products" + (product.id ? "/" + product.id : ""),
        {
          ...body,
          raw_data: product.raw_data || {},
          normalization_notes: product.normalization_notes || [],
        },
        product.id ? "PUT" : "POST",
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
      title={product.id ? "Sửa laptop" : "Thêm laptop"}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          {fields.map(([k, label, numeric]) => (
            <Field label={label} key={k}>
              {k === "price" ? (
                <MoneyInput
                  aria-label={label}
                  value={
                    typeof form[k] === "number" ? (form[k] as number) : null
                  }
                  onValueChange={(value) => setForm({ ...form, [k]: value })}
                />
              ) : (
                <input
                  required={k === "product_code" || k === "product_name"}
                  type={numeric ? "number" : "text"}
                  min={numeric ? 0 : undefined}
                  step={numeric ? "any" : undefined}
                  value={String(form[k] ?? "")}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                />
              )}
            </Field>
          ))}
        </div>
        <ErrorBox error={error} />
        <div className="form-footer">
          <button type="button" className="button secondary" onClick={onClose}>
            Hủy
          </button>
          <button className="button" disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu laptop"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export default function Products({
  admin = false,
  canDelete = false,
}: {
  admin?: boolean;
  canDelete?: boolean;
}) {
  const [q, setQ] = useState(""),
    [brand, setBrand] = useState(""),
    [page, setPage] = useState(1),
    [sort, setSort] = useState("product_name"),
    [revision, setRevision] = useState(0),
    [editor, setEditor] = useState<Partial<Product>>(),
    [detail, setDetail] = useState<Product>(),
    [selected, setSelected] = useState<Record<number, Product>>({}),
    [bulkDeleting, setBulkDeleting] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const canManage = admin || canDelete;
  useEffect(() => {
    if (!canManage) {
      setSelected({});
      setBulkDeleting(false);
    }
  }, [canManage]);
  const search = useDebounce(q),
    filter = useDebounce(brand);
  const {
    data,
    loading,
    error: loadError,
  } = useData<Page<Product>>(
    `/products?q=${encodeURIComponent(search)}&brand=${encodeURIComponent(filter)}&page=${page}&page_size=12&sort=${sort}`,
    revision,
  );
  const selectedProducts = Object.values(selected);
  const currentProducts = data?.items ?? [];
  const allCurrentSelected =
    currentProducts.length > 0 &&
    currentProducts.every((product) => selected[product.id]);
  function selectProduct(product: Product, checked: boolean) {
    setSelected((current) => {
      const next = { ...current };
      if (checked) next[product.id] = product;
      else delete next[product.id];
      return next;
    });
  }
  function selectCurrentPage(checked: boolean) {
    setSelected((current) => {
      const next = { ...current };
      for (const product of currentProducts) {
        if (checked) next[product.id] = product;
        else delete next[product.id];
      }
      return next;
    });
  }
  async function removeSelected() {
    const ids = selectedProducts.map((product) => product.id);
    if (!ids.length) return;
    setBusy(true);
    setError("");
    try {
      await api("/products", {
        method: "DELETE",
        body: JSON.stringify({ ids }),
      });
      setSelected({});
      setBulkDeleting(false);
      setRevision((current) => current + 1);
      setPage(1);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">DỮ LIỆU SẢN PHẨM</div>
          <h1>{admin ? "Quản lý sản phẩm" : "Danh sách laptop"}</h1>
          <p>Khám phá cấu hình, thông số và dữ liệu gốc của từng laptop.</p>
        </div>
        {admin && (
          <button className="button" onClick={() => setEditor({})}>
            <Plus size={18} /> Thêm laptop
          </button>
        )}
      </div>
      <section className="panel">
        <div className="filter-bar">
          <SearchBox
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="Tìm tên, mã sản phẩm, CPU, GPU…"
          />
          <Autocomplete
            field="brand"
            label="Nhãn hàng"
            value={brand}
            onChange={(v) => {
              setBrand(v);
              setPage(1);
            }}
          />
          <Field label="Sắp xếp">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              <option value="product_name">Tên sản phẩm</option>
              <option value="price">Giá tăng dần</option>
              <option value="-price">Giá giảm dần</option>
              <option value="-id">Mới thêm</option>
            </select>
          </Field>
        </div>
      </section>
      <ErrorBox error={loadError || error} />
      {canManage &&
        (currentProducts.length > 0 || selectedProducts.length > 0) && (
          <div className="product-selection-bar">
            {currentProducts.length > 0 && (
              <label>
                <input
                  type="checkbox"
                  aria-label="Chọn tất cả trên trang này"
                  checked={allCurrentSelected}
                  onChange={(event) => selectCurrentPage(event.target.checked)}
                />
                Chọn tất cả trên trang này
              </label>
            )}
            {selectedProducts.length > 0 && (
              <>
                <span>Đã chọn {selectedProducts.length} laptop</span>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setSelected({})}
                >
                  Bỏ chọn
                </button>
                <button
                  type="button"
                  className="button danger-fill"
                  onClick={() => {
                    setError("");
                    setBulkDeleting(true);
                  }}
                >
                  <Trash2 size={16} /> Xóa đã chọn ({selectedProducts.length})
                </button>
              </>
            )}
          </div>
        )}
      {loading ? (
        <Loading />
      ) : !data?.items.length ? (
        <Empty>
          <PackageSearch size={28} />
          Không tìm thấy laptop phù hợp bộ lọc.
        </Empty>
      ) : admin ? (
        <section className="panel mt-5">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Chọn</th>
                  <th>Sản phẩm</th>
                  <th>Hãng</th>
                  <th>Giá</th>
                  <th>RAM / SSD</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={"Chọn " + p.product_code}
                        checked={Boolean(selected[p.id])}
                        onChange={(event) =>
                          selectProduct(p, event.target.checked)
                        }
                      />
                    </td>
                    <td className="product-cell">
                      <button onClick={() => setDetail(p)}>
                        {p.product_name}
                      </button>
                      <code>{p.product_code}</code>
                    </td>
                    <td>{p.brand}</td>
                    <td className="whitespace-nowrap">{money(p.price)}</td>
                    <td>
                      {p.ram_gb ?? "?"} / {p.storage_gb ?? "?"} GB
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          className="icon-button"
                          title="Sửa laptop"
                          aria-label={"Sửa " + p.product_code}
                          onClick={() => setEditor(p)}
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="product-grid mt-5">
          {data.items.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onDetail={() => setDetail(p)}
              selected={Boolean(selected[p.id])}
              onSelect={
                canDelete ? (checked) => selectProduct(p, checked) : undefined
              }
            />
          ))}
        </div>
      )}
      {data && (
        <Pagination
          page={page}
          total={data.total}
          size={12}
          onChange={setPage}
        />
      )}
      {editor && (
        <ProductEditor
          product={editor}
          onClose={() => setEditor(undefined)}
          onSaved={() => {
            setEditor(undefined);
            setRevision((x) => x + 1);
          }}
        />
      )}
      {detail && (
        <ProductDetail product={detail} onClose={() => setDetail(undefined)} />
      )}
      {bulkDeleting && selectedProducts.length > 0 && (
        <Modal
          title={`Xác nhận xóa ${selectedProducts.length} laptop`}
          onClose={() => {
            if (!busy) setBulkDeleting(false);
          }}
        >
          <p>
            Xóa toàn bộ laptop đã chọn khỏi database? Lịch sử tư vấn đã lưu vẫn
            giữ bản chụp sản phẩm. Nếu nhập lại file Excel chứa các mã này,
            laptop sẽ được thêm trở lại.
          </p>
          <ul className="bulk-delete-list">
            {selectedProducts.map((product) => (
              <li key={product.id}>
                <code>{product.product_code}</code> · {product.product_name}
              </li>
            ))}
          </ul>
          <ErrorBox error={error} />
          <div className="form-footer">
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={() => setBulkDeleting(false)}
            >
              Hủy
            </button>
            <button
              type="button"
              className="button danger-fill"
              disabled={busy}
              onClick={removeSelected}
            >
              {busy ? "Đang xóa…" : `Xóa ${selectedProducts.length} laptop`}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
