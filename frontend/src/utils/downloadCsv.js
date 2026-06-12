// Shared CSV export helper. Replaces six copy-pasted fetch→blob→anchor blocks
// and fixes the "export hangs forever / isn't cancellable" bug: every request
// has an AbortController timeout, and callers (e.g. sagas) may pass their own
// signal to abort an in-flight export when a newer one starts.

const DEFAULT_TIMEOUT_MS = 120_000;

function dateStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Builds the export query string, dropping null/empty values.
export function exportQuery(filters) {
  return new URLSearchParams(
    Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v != null && v !== ""),
    ),
  ).toString();
}

// Fetches the CSV at `url` and saves it as `${filenamePrefix}_<YYYY-MM-DD>.csv`.
// Throws on HTTP error, timeout, or cancellation (caller shows the notification).
export async function downloadCsv(
  url,
  filenamePrefix,
  { timeoutMs = DEFAULT_TIMEOUT_MS, signal } = {},
) {
  const controller = new AbortController();
  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", onExternalAbort, { once: true });
  }
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      credentials: "same-origin",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Server error ${response.status}`);

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = `${filenamePrefix}_${dateStamp()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Export timed out or was cancelled");
    }
    throw err;
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener("abort", onExternalAbort);
  }
}
