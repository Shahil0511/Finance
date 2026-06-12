import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../features/notifications/notificationsSlice';
import { useGetTataCliqReturnsListQuery } from '../../features/returns/returnsApi';
import { useTataCliqReturnsFilterStore, cleanParams } from '../../store/useFilterStore';
import { apiUrl } from '../../config/apiBase';
import { downloadCsv } from '../../utils/downloadCsv';
import DataTable from '../shared/DataTable';
import Badge from '../ui/Badge';
import { formatDate, getStatusVariant } from '../../utils/formatters';

const COLUMNS = [
  { key: 'channel_order_id', header: 'Order ID', sortable: true },
  { key: 'channel_parent_order_id', header: 'Parent Order', sortable: true },
  { key: 'sp1_channel_sub_order_id', header: 'Sub Order ID', sortable: true },
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
  { key: 'system_sub_order_id', header: 'System Sub Order', sortable: true },
  { key: 'return_order_item_id_count', header: 'Return Item Count', sortable: true },
  { key: 'channel_sub_order_id_count', header: 'Sub Order Count', sortable: true },
  { key: 'inward_time', header: 'Inward Time', sortable: true, render: (v) => formatDate(v) },
];

export default function TataCliqReturnsDataTable() {
  const dispatch = useDispatch();
  const [exporting, setExporting] = useState(false);
  const { filters, setPage, setSort } = useTataCliqReturnsFilterStore();
  const params = cleanParams(filters);
  const { data: res, isLoading, isFetching, isError, error, refetch } =
    useGetTataCliqReturnsListQuery(params);

  const rows = res?.data ?? [];
  const pagination = res?.pagination ?? {};

  const handleExport = async () => {
    setExporting(true);
    try {
      const url = `${apiUrl("returns/tata-cliq/export")}?${new URLSearchParams(params)}`;
      await downloadCsv(url, "tata_cliq_returns");
      dispatch(addNotification({ type: "success", message: "Tata Cliq returns exported successfully" }));
    } catch (err) {
      dispatch(addNotification({ type: "error", message: `Export failed: ${err.message}` }));
    } finally {
      setExporting(false);
    }
  };

  return (
    <DataTable
      title="Tata Cliq Return Records"
      columns={COLUMNS}
      data={rows}
      pagination={pagination}
      sortBy={filters.sortBy}
      sortDir={filters.sortDir}
      onSort={(col, dir) => setSort(col, dir)}
      onPage={(p) => setPage(p)}
      onPageSize={(ps) => useTataCliqReturnsFilterStore.getState().setFilters({ pageSize: ps })}
      onExport={handleExport}
      exportLoading={exporting}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      error={error}
      onRetry={refetch}
      executionTimeMs={res?.executionTimeMs}
      rowKey={(r, i) => `${r.return_order_item_id ?? 'row'}-${r.sp1_channel_sub_order_id ?? ''}-${i}`}
    />
  );
}
