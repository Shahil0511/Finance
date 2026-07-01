import { call, put, takeLatest } from "redux-saga/effects";
import { addNotification } from "../notifications/notificationsSlice";
import { setSalesExporting } from "../ui/uiSlice";
import { apiUrl } from "../../config/apiBase";

export const SALES_EXPORT_REQUESTED = "sales/exportRequested";
export const requestSalesExport = (filters) => ({
  type: SALES_EXPORT_REQUESTED,
  payload: filters,
});

function* handleSalesExport({ payload: filters }) {
  yield put(setSalesExporting(true));
  try {
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v != null && v !== ""),
      ),
    );
    const response = yield call(fetch, `${apiUrl("sales/export")}?${params}`, {
      credentials: "same-origin",
    });
    if (!response.ok) throw new Error(`Server error ${response.status}`);
    const blob = yield call([response, "blob"]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    a.href = url;
    a.download = `b2c_sales_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    yield put(
      addNotification({
        type: "success",
        message: "Sales report exported successfully",
      }),
    );
  } catch (err) {
    yield put(
      addNotification({
        type: "error",
        message: `Export failed: ${err.message}`,
      }),
    );
  } finally {
    yield put(setSalesExporting(false));
  }
}

export function* salesSagas() {
  yield takeLatest(SALES_EXPORT_REQUESTED, handleSalesExport);
}
