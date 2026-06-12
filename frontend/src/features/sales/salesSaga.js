import { call, put, takeLatest, cancelled } from "redux-saga/effects";
import { addNotification } from "../notifications/notificationsSlice";
import { setSalesExporting } from "../ui/uiSlice";
import { apiUrl } from "../../config/apiBase";
import { downloadCsv, exportQuery } from "../../utils/downloadCsv";

export const SALES_EXPORT_REQUESTED = "sales/exportRequested";
export const requestSalesExport = (filters) => ({
  type: SALES_EXPORT_REQUESTED,
  payload: filters,
});

function* handleSalesExport({ payload: filters }) {
  yield put(setSalesExporting(true));
  const controller = new AbortController();
  try {
    const url = `${apiUrl("sales/export")}?${exportQuery(filters)}`;
    yield call(downloadCsv, url, "b2c_sales", { signal: controller.signal });
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
    // takeLatest cancels this task on a newer export → abort the in-flight fetch.
    if (yield cancelled()) controller.abort();
    yield put(setSalesExporting(false));
  }
}

export function* salesSagas() {
  yield takeLatest(SALES_EXPORT_REQUESTED, handleSalesExport);
}
