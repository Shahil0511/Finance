import { call, put, takeLatest, cancelled } from "redux-saga/effects";
import { addNotification } from "../notifications/notificationsSlice";
import { setReturnsExporting } from "../ui/uiSlice";
import { apiUrl } from "../../config/apiBase";
import { downloadCsv, exportQuery } from "../../utils/downloadCsv";

export const RETURNS_EXPORT_REQUESTED = "returns/exportRequested";
export const requestReturnsExport = (filters) => ({
  type: RETURNS_EXPORT_REQUESTED,
  payload: filters,
});

function* handleReturnsExport({ payload: filters }) {
  yield put(setReturnsExporting(true));
  const controller = new AbortController();
  try {
    const url = `${apiUrl("returns/export")}?${exportQuery(filters)}`;
    yield call(downloadCsv, url, "returns_report", { signal: controller.signal });
    yield put(
      addNotification({
        type: "success",
        message: "Returns report exported successfully",
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
    yield put(setReturnsExporting(false));
  }
}

export function* returnsSagas() {
  yield takeLatest(RETURNS_EXPORT_REQUESTED, handleReturnsExport);
}
