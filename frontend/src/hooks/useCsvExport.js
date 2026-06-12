import { useState } from 'react';
import { toast } from 'sonner';
import { apiUrl } from '../config/apiBase';
import { downloadCsv } from '../utils/downloadCsv';

/**
 * One export path for every report. Tracks which endpoint is currently
 * exporting so multiple buttons can share it; sonner handles the feedback.
 */
export function useCsvExport() {
  const [exporting, setExporting] = useState(null); // endpoint string | null

  const exportCsv = async ({ endpoint, prefix, successMessage }, params) => {
    if (exporting) return; // one export at a time
    setExporting(endpoint);
    const id = toast.loading('Preparing export…');
    try {
      const url = `${apiUrl(endpoint)}?${new URLSearchParams(params)}`;
      await downloadCsv(url, prefix);
      toast.success(successMessage ?? 'Export downloaded', { id });
    } catch (err) {
      toast.error(`Export failed: ${err.message}`, { id });
    } finally {
      setExporting(null);
    }
  };

  return { exportCsv, exporting };
}
