import { accountHeaders } from "./account";

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  for (const [key, value] of Object.entries(accountHeaders()))
    headers.set(key, value);
  const response = await fetch("/api" + path, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => ({ detail: "Không kết nối được máy chủ" }));
    const detail = Array.isArray(body.detail)
      ? body.detail
          .map(
            (v: { loc: string[]; msg: string }) =>
              `${v.loc.join(".")}: ${v.msg}`,
          )
          .join("\n")
      : body.detail;
    throw new Error(detail || `HTTP ${response.status}`);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export const send = <T>(path: string, data: unknown, method = "POST") =>
  api<T>(path, { method, body: JSON.stringify(data) });
export const money = (value: number | null) =>
  value == null
    ? "Chưa xác minh"
    : new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(value);
export const isMoneyFact = (name: string) =>
  name === "price" || name === "budget_min" || name === "budget_max";
export const displayFactValue = (
  name: string,
  value: string | number | boolean | null | undefined,
) =>
  typeof value === "number" && isMoneyFact(name)
    ? money(value)
    : String(value ?? "?");
export const parseMoneyInput = (value: string): number | null => {
  const digits = value.replace(/[^0-9]/g, "");
  if (!digits) return null;
  const number = Number(digits);
  return Number.isSafeInteger(number) ? number : null;
};
export const formatMoneyInput = (value: number | null | undefined) =>
  value == null
    ? ""
    : new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(
        value,
      );
export const dateTime = (value: string) =>
  new Date(
    value.endsWith("Z") || value.includes("+") ? value : value + "Z",
  ).toLocaleString("vi-VN");
export const errorText = (e: unknown) =>
  e instanceof Error ? e.message : String(e);
