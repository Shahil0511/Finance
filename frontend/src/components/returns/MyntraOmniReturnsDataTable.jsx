import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../features/notifications/notificationsSlice';
import { useGetMyntraOmniReturnsListQuery } from '../../features/returns/returnsApi';
import { useMyntraOmniReturnsFilterStore, cleanParams } from '../../store/useFilterStore';
import { apiUrl } from '../../config/apiBase';
import DataTable from '../shared/DataTable';
import Badge from '../ui/Badge';
import { formatDate, getStatusVariant } from '../../utils/formatters';

const COLUMNS = [
  { key: 'channel_order_id', header: 'Order ID', sortable: true },
  { key: 'channel_parent_order_id', header: 'Parent Order', sortable: true },
  { key: 'return_order_processed_time', header: 'Processed', sortable: true, render: (v) => formatDate(v) },
  { key: 'return_order_type', header: 'Type', sortable: false },
  { key: 'client_sku_id_ean', header: 'SKU / EAN', sortable: true },
  { key: 'brand', header: 'Brand', sortable: true },
  { key: 'sales_channel', header: 'Channel', sortable: true, render: (v) => v ? <Badge variant="info">{v}</Badge> : '-' },
  { key: 'return_order_status', header: 'Return Status', sortable: true, render: (v) => v ? <Badge variant={getStatusVariant(v)}>{v}</Badge> : '-' },
  { key: 'return_order_item_qc_status', header: 'QC Status', sortable: true, render: (v) => v ? <Badge variant={getStatusVariant(v)}>{v}</Badge> : '-' },
  { key: 'qc_reason', header: 'QC Reason', sortable: false },
  { key: 'reason_for_return', header: 'Return Reason', sortable: false },
  { key: 'final_resolutions', header: 'Resolution', sortable: false },
  { key: 'wh_name', header: 'Warehouse', sortable: false },
  { key: 'inward_time', header: 'Inward Time', sortable: true, render: (v) => formatDate(v) },
];

export default function MyntraOmniReturnsDataTable() {
  const dispatch = useDispatch();
  const [exporting, setExporting] = useState(false);
  const { filters, setPage, setSort } = useMyntraOmniReturnsFilterStore();
  const params = cleanParams(filters);
  const { data: res, isLoading, isFetching, isError, error, refetch } =
    useGetMyntraOmniReturnsListQuery(params);

  const rows = res?.data ?? [];
  const pagination = res?.pagination ?? {};

  const handleExport = async () => {
    setExporting(true);
    try {
      const qs = new URLSearchParams(params);
      const response = await fetch(`${apiUrl("returns/omni/export")}?${qs}`, {
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error(`Server error ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const d = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      a.href = url;
      a.download = `myntra_omni_returns_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      dispatch(addNotification({ type: "success", message: "Myntra Omni returns exported successfully" }));
    } catch (err) {
      dispatch(addNotification({ type: "error", message: `Export failed: ${err.message}` }));
    } finally {
      setExporting(false);
    }
  };

  return (
    <DataTable
      title="Myntra Omni Return Records"
      columns={COLUMNS}
      data={rows}
      pagination={pagination}
      sortBy={filters.sortBy}
      sortDir={filters.sortDir}
      onSort={(col, dir) => setSort(col, dir)}
      onPage={(p) => setPage(p)}
      onPageSize={(ps) => useMyntraOmniReturnsFilterStore.getState().setFilters({ pageSize: ps })}
      onExport={handleExport}
      exportLoading={exporting}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      error={error}
      onRetry={refetch}
      executionTimeMs={res?.executionTimeMs}
    />
  );
}
