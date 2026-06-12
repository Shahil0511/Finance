import { useDispatch, useSelector } from 'react-redux';
import { useGetSalesListQuery }    from '../../features/sales/salesApi';
import { requestSalesExport }       from '../../features/sales/salesSaga';
import { selectSalesExporting }     from '../../features/ui/uiSlice';
import { useSalesFilterStore, cleanParams } from '../../store/useFilterStore';
import DataTable from '../shared/DataTable';
import Badge     from '../ui/Badge';
import { formatCurrency, formatDate, getStatusVariant, getSLAVariant } from '../../utils/formatters';

const COLUMNS = [
  { key: 'channel_parent_order_id', header: 'Parent Order',   sortable: true  },
  { key: 'channel_order_id',        header: 'Order ID',       sortable: true  },
  { key: 'sales_channel',           header: 'Channel',        sortable: true,
    render: (v) => v ? <Badge variant="info">{v}</Badge> : '—' },
  { key: 'channel_invoice_no',      header: 'Invoice No',     sortable: false },
  { key: 'warehouse_name',          header: 'Warehouse',      sortable: true  },
  { key: 'handover_time',           header: 'Handover',       sortable: true,
    render: (v) => formatDate(v) },
  { key: 'client_sku_id_ean',       header: 'SKU / EAN',      sortable: true  },
  { key: 'brand',                   header: 'Brand',          sortable: true  },
  { key: 'category',                header: 'Category',       sortable: true  },
  { key: 'payment_type',            header: 'Payment',        sortable: true  },
  { key: 'so_quantity',             header: 'SO Qty',         sortable: true  },
  { key: 'dispatched_quantity',     header: 'Dispatched',     sortable: true  },
  { key: 'mrp',                     header: 'MRP',            sortable: true,
    render: (v) => formatCurrency(v) },
  { key: 'unit_sale_price',         header: 'Sale Price',     sortable: true,
    render: (v) => formatCurrency(v) },
  { key: 'unit_tax',                header: 'Tax',            sortable: true,
    render: (v) => formatCurrency(v) },
  { key: 'order_status',            header: 'Status',         sortable: true,
    render: (v) => v ? <Badge variant={getStatusVariant(v)}>{v}</Badge> : '—' },
  { key: 'final_resolution',        header: 'Resolution',     sortable: true  },
  { key: 'state',                   header: 'State',          sortable: true  },
  { key: 'sla_breached',            header: 'SLA Breached',   sortable: true,
    render: (v) => <Badge variant={getSLAVariant(v)}>{['1','true','t','y','yes'].includes(String(v).toLowerCase()) ? 'Yes' : 'No'}</Badge> },
];

export default function SalesDataTable() {
  const dispatch  = useDispatch();
  const exporting = useSelector(selectSalesExporting);
  const { filters, setPage, setSort } = useSalesFilterStore();

  const params = cleanParams(filters);
  const { data: res, isLoading, isFetching, isError, error, refetch } = useGetSalesListQuery(params);

  const rows       = res?.data       ?? [];
  const pagination = res?.pagination ?? {};

  return (
    <DataTable
      title="B2C Sales Records"
      columns={COLUMNS}
      data={rows}
      pagination={pagination}
      sortBy={filters.sortBy}
      sortDir={filters.sortDir}
      onSort={(col, dir) => setSort(col, dir)}
      onPage={(p) => setPage(p)}
      onPageSize={(ps) => useSalesFilterStore.getState().setFilters({ pageSize: ps })}
      onExport={() => dispatch(requestSalesExport(params))}
      exportLoading={exporting}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      error={error}
      onRetry={refetch}
      executionTimeMs={res?.executionTimeMs}
      rowKey={(r, i) => r.system_invoice_line_item_id ?? i}
    />
  );
}
