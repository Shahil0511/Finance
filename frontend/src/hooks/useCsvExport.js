import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { apiUrl } from '../config/apiBase';
import { downloadCsv } from '../utils/downloadCsv';
import { addNotification } from '../features/notifications/notificationsSlice';

/**
 * One export path for every report (replaces the old saga + inline-fetch split).
 * Tracks which endpoint is currently exporting so multiple buttons can share it.
 */
export function useCsvExport() {
  const dispatch = useDispatch();
  const [exporting, setExporting] = useState(null); // endpoint string | null

  const exportCsv = async ({ endpoint, prefix, successMessage }, params) => {
    if (exporting) return; // one export at a time
    setExporting(endpoint);
    try {
      const url = `${apiUrl(endpoint)}?${new URLSearchParams(params)}`;
      await downloadCsv(url, prefix);
      dispatch(addNotification({ type: 'success', message: successMessage ?? 'Export downloaded' }));
    } catch (err) {
      dispatch(addNotification({ type: 'error', message: `Export failed: ${err.message}` }));
    } finally {
      setExporting(null);
    }
  };

  return { exportCsv, exporting };
}
