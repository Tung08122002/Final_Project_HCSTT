import {
  useEffect,
  useRef,
  useState,
  useId,
  isValidElement,
  cloneElement,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";
import { api, displayFactValue } from "../services/api";
import { useDebounce } from "../hooks/useData";
import type { Facts } from "../types";

export function Loading() {
  return (
    <div className="empty">
      <LoaderCircle className="animate-spin" size={24} /> Đang tải dữ liệu…
    </div>
  );
}
export function ErrorBox({ error }: { error: string }) {
  return error ? (
    <div className="error" role="alert">
      <AlertCircle size={18} />
      <span>{error}</span>
    </div>
  ) : null;
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const id = useId();
  const directControl =
    isValidElement(children) &&
    typeof children.type === "string" &&
    ["input", "select", "textarea"].includes(children.type);
  return (
    <div className="field">
      {directControl ? (
        <label htmlFor={id}>{label}</label>
      ) : (
        <span>{label}</span>
      )}
      {directControl
        ? cloneElement(children as ReactElement<{ id: string }>, { id })
        : children}
      {hint && <small>{hint}</small>}
    </div>
  );
}
export function Badge({
  children,
  tone = "green",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={"badge " + tone}>{children}</span>;
}
export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const old = document.activeElement as HTMLElement;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    box.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const items = box.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input, select, textarea, [tabindex="0"]',
        );
        if (items?.length) {
          const first = items[0],
            last = items[items.length - 1];
          if (
            e.shiftKey &&
            (document.activeElement === first ||
              document.activeElement === box.current)
          ) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = bodyOverflow;
      old?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={"modal " + (wide ? "wide" : "")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={box}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-button" aria-label="Đóng" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
export function Pagination({
  page,
  total,
  size,
  onChange,
}: {
  page: number;
  total: number;
  size: number;
  onChange: (n: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  const items: (number | "ellipsis-start" | "ellipsis-end")[] = [];
  if (pages <= 7) {
    for (let number = 1; number <= pages; number++) items.push(number);
  } else if (page <= 4) {
    items.push(1, 2, 3, 4, 5, "ellipsis-end", pages);
  } else if (page >= pages - 3) {
    items.push(1, "ellipsis-start");
    for (let number = pages - 4; number <= pages; number++) items.push(number);
  } else {
    items.push(
      1,
      "ellipsis-start",
      page - 1,
      page,
      page + 1,
      "ellipsis-end",
      pages,
    );
  }
  return (
    <div className="pagination">
      <span>
        {total} bản ghi · Trang {page}/{pages}
      </span>
      <div>
        <button
          className="icon-button"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          aria-label="Trang trước"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="pagination-pages" aria-label="Chọn trang">
          {items.map((item) =>
            typeof item === "number" ? (
              <button
                type="button"
                className={"page-number " + (item === page ? "active" : "")}
                aria-label={`Trang ${item}`}
                aria-current={item === page ? "page" : undefined}
                key={item}
                onClick={() => onChange(item)}
              >
                {item}
              </button>
            ) : (
              <span className="page-ellipsis" aria-hidden="true" key={item}>
                …
              </span>
            ),
          )}
        </div>
        <button
          className="icon-button"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
          aria-label="Trang sau"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
export function SearchBox({
  value,
  onChange,
  placeholder = "Tìm kiếm…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search">
      <Search size={17} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button aria-label="Xóa tìm kiếm" onClick={() => onChange("")}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}
export function Autocomplete({
  field,
  value,
  onChange,
  label,
}: {
  field: string;
  value: string;
  onChange: (s: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false),
    [items, setItems] = useState<string[]>([]),
    [error, setError] = useState(false);
  const debounced = useDebounce(value);
  useEffect(() => {
    let alive = true;
    api<(string | number)[]>(
      `/products/autocomplete?field=${field}&q=${encodeURIComponent(debounced)}`,
    )
      .then((d) => {
        if (alive) {
          setItems(d.map(String));
          setError(false);
        }
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [field, debounced]);
  return (
    <Field label={label}>
      <div
        className="autocomplete"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
        }}
      >
        <input
          aria-label={label}
          role="combobox"
          aria-expanded={open}
          aria-controls={"options-" + field}
          placeholder="Tìm hoặc để trống"
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "ArrowDown") {
              e.preventDefault();
              document
                .querySelector<HTMLButtonElement>(`#options-${field} button`)
                ?.focus();
            }
          }}
        />
        {value && (
          <button
            type="button"
            className="clear"
            aria-label={"Xóa " + label}
            onClick={() => onChange("")}
          >
            <X size={14} />
          </button>
        )}
        {open && (
          <div className="options" id={"options-" + field} role="listbox">
            {items.map((item) => (
              <button
                type="button"
                role="option"
                aria-selected={value === item}
                key={item}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(item);
                  setOpen(false);
                }}
              >
                {item}
              </button>
            ))}
            {!items.length && (
              <span>{error ? "Không tải được dữ liệu" : "Không có gợi ý"}</span>
            )}
          </div>
        )}
      </div>
    </Field>
  );
}
export function FactsTable({
  facts,
  provenance,
}: {
  facts: Facts;
  provenance?: Record<string, string[]>;
}) {
  return (
    <div className="fact-list">
      {Object.entries(facts).map(([k, v]) => (
        <div key={k}>
          <code title="Fact: một thông tin biểu diễn bằng cặp tên và giá trị.">
            {k}
          </code>
          <strong>{displayFactValue(k, v)}</strong>
          {provenance && <small>{provenance[k]?.join(", ")}</small>}
        </div>
      ))}
    </div>
  );
}
