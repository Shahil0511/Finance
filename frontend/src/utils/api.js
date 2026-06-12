import { API_BASE_PATH } from "../config/apiBase";

async function apiFetch(path, params = {}) {
  const url = new URL(API_BASE_PATH + path, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString(), {
    credentials: "same-origin",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "API error");
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("text/csv")) return res.blob();
  return res.json();
}

export const salesApi = {
  list: (params) => apiFetch("/sales", params),
  summary: (params) => apiFetch("/sales/summary", params),
  filters: () => apiFetch("/sales/filters"),
  export: (params) => apiFetch("/sales/export", params),
};

export const returnsApi = {
  list: (params) => apiFetch("/returns", params),
  summary: (params) => apiFetch("/returns/summary", params),
  filters: () => apiFetch("/returns/filters"),
  export: (params) => apiFetch("/returns/export", params),
};

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
