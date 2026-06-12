import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../features/notifications/notificationsSlice';
import { useGetTataCliqSalesListQuery } from '../../features/sales/salesApi';
import { useTataCliqSalesFilterStore, cleanParams } from '../../store/useFilterStore';
import { apiUrl } from '../../config/apiBase';
import { downloadCsv } from '../../utils/downloadCsv';
import DataTable from '../shared/DataTable';
import Badge from '../ui/Badge';
import { formatCurrency, formatDate, getStatusVariant, getSLAVariant } from '../../utils/formatters';

const COLUMNS = [
  { key: 'handover_dt', header: 'Handover Dt', sortable: true, render: (v) => formatDate(v) },
  { key: 'channel_parent_order_id', header: 'Parent Order', sortable: true },
  { key: 'channel_order_id', header: 'Order ID', sortable: true },
  { key: 'channel_sub_order_id', header: 'Sub Order ID', sortable: true },
  { key: 'sales_channel', header: 'Channel', sortable: true, render: (v) => v ? <Badge variant="info">{v}</Badge> : '-' },
  { key: 'channel_invoice_no', header: 'Invoice No', sortable: false },
  { key: 'warehouse_name', header: 'Warehouse', sortable: true },
  { key: 'handover_time', header: 'Handover', sortable: true, render: (v) => formatDate(v) },
  { key: 'client_sku_id_ean', header: 'SKU / EAN', sortable: true },
  { key: 'brand', header: 'Brand', sortable: true },
  { key: 'category', header: 'Category', sortable: true },
  { key: 'payment_type', header: 'Payment', sortable: true },
  { key: 'so_quantity', header: 'SO Qty', sortable: true },
  { key: 'ordered_quantity', header: 'Ordered Qty', sortable: true },
  { key: 'dispatched_quantity', header: 'Dispatched', sortable: true },
  { key: 'mrp', header: 'MRP', sortable: true, render: (v) => formatCurrency(v) },
  { key: 'unit_sale_price', header: 'Sale Price', sortable: true, render: (v) => formatCurrency(v) },
  { key: 'split_mrp', header: 'Split MRP', sortable: true, render: (v) => formatCurrency(v) },
  { key: 'split_unit_sale_price', header: 'Split Sale', sortable: true, render: (v) => formatCurrency(v) },
  { key: 'unit_tax', header: 'Tax', sortable: true, render: (v) => formatCurrency(v) },
  { key: 'order_status', header: 'Status', sortable: true, render: (v) => v ? <Badge variant={getStatusVariant(v)}>{v}</Badge> : '-' },
  { key: 'final_resolution', header: 'Resolution', sortable: true },
  { key: 'state', header: 'State', sortable: true },
  { key: 'split_remarks', header: 'Split Remarks', sortable: true },
  { key: 'sla_breached', header: 'SLA Breached', sortable: true, render: (v) => <Badge variant={getSLAVariant(v)}>{['1','true','t','y','yes'].includes(String(v).toLowerCase()) ? 'Yes' : 'No'}</Badge> },
];

export default function TataCliqSalesDataTable() {
  const dispatch = useDispatch();
  const [exporting, setExporting] = useState(false);
  const { filters, setPage, setSort } = useTataCliqSalesFilterStore();
  const params = cleanParams(filters);
  const { data: res, isLoading, isFetching, isError, error, refetch } =
    useGetTataCliqSalesListQuery(params);

  const rows = res?.data ?? [];
  const pagination = res?.pagination ?? {};

  const handleExport = async () => {
    setExporting(true);
    try {
      const url = `${apiUrl("sales/tata-cliq/export")}?${new URLSearchParams(params)}`;
      await downloadCsv(url, "tata_cliq_sales");
      dispatch(addNotification({ type: "success", message: "Tata Cliq sales exported successfully" }));
    } catch (err) {
      dispatch(addNotification({ type: "error", message: `Export failed: ${err.message}` }));
    } finally {
      setExporting(false);
    }
  };

  return (
    <DataTable
      title="Tata Cliq Sales Records"
      columns={COLUMNS}
      data={rows}
      pagination={pagination}
      sortBy={filters.sortBy}
      sortDir={filters.sortDir}
      onSort={(col, dir) => setSort(col, dir)}
      onPage={(p) => setPage(p)}
      onPageSize={(ps) => useTataCliqSalesFilterStore.getState().setFilters({ pageSize: ps })}
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
