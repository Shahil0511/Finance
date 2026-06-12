import {
  AlertTriangle, DollarSign, RotateCcw, ShoppingCart, TrendingUp, Truck,
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import { formatCurrency, formatDate, formatNumber, getSLAVariant, getStatusVariant } from '../utils/formatters';
import { salesApi, useGetSalesFiltersQuery, useGetSalesListQuery, useGetSalesSummaryQuery, useGetTataCliqSalesFiltersQuery, useGetTataCliqSalesListQuery, useGetTataCliqSalesSummaryQuery } from '../features/sales/salesApi';
import { returnsApi, useGetMyntraOmniReturnsFiltersQuery, useGetMyntraOmniReturnsListQuery, useGetMyntraOmniReturnsSummaryQuery, useGetReturnsFiltersQuery, useGetReturnsListQuery, useGetReturnsSummaryQuery, useGetTataCliqReturnsFiltersQuery, useGetTataCliqReturnsListQuery, useGetTataCliqReturnsSummaryQuery } from '../features/returns/returnsApi';
import {
  useMyntraOmniReturnsFilterStore, useReturnsFilterStore, useSalesFilterStore,
  useTataCliqReturnsFilterStore, useTataCliqSalesFilterStore,
} from '../store/useFilterStore';

/* ── Cell render helpers ──────────────────────────────────────────────────── */
const date = (v) => formatDate(v);
const money = (v) => formatCurrency(v);
const channelBadge = (v) => (v ? <Badge variant="info">{v}</Badge> : '—');
const statusBadge = (v) => (v ? <Badge variant={getStatusVariant(v)}>{v}</Badge> : '—');
const slaBadge = (v) => (
  <Badge variant={getSLAVariant(v)}>
    {['1', 'true', 't', 'y', 'yes'].includes(String(v).toLowerCase()) ? 'Yes' : 'No'}
  </Badge>
);

/* ── Shared card sets ─────────────────────────────────────────────────────── */
const salesCards = (firstLabel) => [
  { key: 'total_orders',       label: firstLabel,        icon: ShoppingCart,  tone: 'primary',     fmt: formatNumber },
  { key: 'total_sale_value',   label: 'Sale Value',      icon: DollarSign,    tone: 'success',     fmt: formatCurrency },
  { key: 'total_tax',          label: 'Tax Collected',   icon: TrendingUp,    tone: 'warning',     fmt: formatCurrency },
  { key: 'total_dispatched',   label: 'Dispatched Qty',  icon: Truck,         tone: 'cyan',        fmt: formatNumber },
  { key: 'sla_breached_count', label: 'SLA Breached',    icon: AlertTriangle, tone: 'destructive', fmt: formatNumber },
];

const returnCards = (firstLabel) => [
  { key: 'total_returns',       label: firstLabel,            icon: RotateCcw,  tone: 'violet',  fmt: formatNumber },
  { key: 'forward_order_value', label: 'Forward Order Value', icon: DollarSign, tone: 'success', fmt: formatCurrency },
];

/* ── Shared column sets ───────────────────────────────────────────────────── */
const SALES_COLUMNS = [
  { key: 'channel_parent_order_id', header: 'Parent Order', sortable: true },
  { key: 'channel_order_id',        header: 'Order ID',     sortable: true },
  { key: 'sales_channel',           header: 'Channel',      sortable: true,  render: channelBadge },
  { key: 'channel_invoice_no',      header: 'Invoice No',   sortable: false },
  { key: 'warehouse_name',          header: 'Warehouse',    sortable: true },
  { key: 'handover_time',           header: 'Handover',     sortable: true,  render: date },
  { key: 'client_sku_id_ean',       header: 'SKU / EAN',    sortable: true },
  { key: 'brand',                   header: 'Brand',        sortable: true },
  { key: 'category',                header: 'Category',     sortable: true },
  { key: 'payment_type',            header: 'Payment',      sortable: true },
  { key: 'so_quantity',             header: 'SO Qty',       sortable: true },
  { key: 'dispatched_quantity',     header: 'Dispatched',   sortable: true },
  { key: 'mrp',                     header: 'MRP',          sortable: true,  render: money },
  { key: 'unit_sale_price',         header: 'Sale Price',   sortable: true,  render: money },
  { key: 'unit_tax',                header: 'Tax',          sortable: true,  render: money },
  { key: 'order_status',            header: 'Status',       sortable: true,  render: statusBadge },
  { key: 'final_resolution',        header: 'Resolution',   sortable: true },
  { key: 'state',                   header: 'State',        sortable: true },
  { key: 'sla_breached',            header: 'SLA Breached', sortable: true,  render: slaBadge },
];

const TATA_SALES_COLUMNS = [
  { key: 'handover_dt',             header: 'Handover Dt',   sortable: true,  render: date },
  { key: 'channel_parent_order_id', header: 'Parent Order',  sortable: true },
  { key: 'channel_order_id',        header: 'Order ID',      sortable: true },
  { key: 'channel_sub_order_id',    header: 'Sub Order ID',  sortable: true },
  { key: 'sales_channel',           header: 'Channel',       sortable: true,  render: channelBadge },
  { key: 'channel_invoice_no',      header: 'Invoice No',    sortable: false },
  { key: 'warehouse_name',          header: 'Warehouse',     sortable: true },
  { key: 'handover_time',           header: 'Handover',      sortable: true,  render: date },
  { key: 'client_sku_id_ean',       header: 'SKU / EAN',     sortable: true },
  { key: 'brand',                   header: 'Brand',         sortable: true },
  { key: 'category',                header: 'Category',      sortable: true },
  { key: 'payment_type',            header: 'Payment',       sortable: true },
  { key: 'so_quantity',             header: 'SO Qty',        sortable: true },
  { key: 'ordered_quantity',        header: 'Ordered Qty',   sortable: true },
  { key: 'dispatched_quantity',     header: 'Dispatched',    sortable: true },
  { key: 'mrp',                     header: 'MRP',           sortable: true,  render: money },
  { key: 'unit_sale_price',         header: 'Sale Price',    sortable: true,  render: money },
  { key: 'split_mrp',               header: 'Split MRP',     sortable: true,  render: money },
  { key: 'split_unit_sale_price',   header: 'Split Sale',    sortable: true,  render: money },
  { key: 'unit_tax',                header: 'Tax',           sortable: true,  render: money },
  { key: 'order_status',            header: 'Status',        sortable: true,  render: statusBadge },
  { key: 'final_resolution',        header: 'Resolution',    sortable: true },
  { key: 'state',                   header: 'State',         sortable: true },
  { key: 'split_remarks',           header: 'Split Remarks', sortable: true },
  { key: 'sla_breached',            header: 'SLA Breached',  sortable: true,  render: slaBadge },
];

const RETURN_COLUMNS = [
  { key: 'channel_order_id',            header: 'Order ID',      sortable: true },
  { key: 'channel_parent_order_id',     header: 'Parent Order',  sortable: true },
  { key: 'return_order_processed_time', header: 'Processed',     sortable: true,  render: date },
  { key: 'return_order_type',           header: 'Type',          sortable: false },
  { key: 'client_sku_id_ean',           header: 'SKU / EAN',     sortable: true },
  { key: 'brand',                       header: 'Brand',         sortable: true },
  { key: 'sales_channel',               header: 'Channel',       sortable: true,  render: channelBadge },
  { key: 'return_order_status',         header: 'Return Status', sortable: true,  render: statusBadge },
  { key: 'return_order_item_qc_status', header: 'QC Status',     sortable: true,  render: statusBadge },
  { key: 'qc_reason',                   header: 'QC Reason',     sortable: false },
  { key: 'reason_for_return',           header: 'Return Reason', sortable: false },
  { key: 'final_resolutions',           header: 'Resolution',    sortable: false },
  { key: 'wh_name',                     header: 'Warehouse',     sortable: false },
  { key: 'inward_time',                 header: 'Inward Time',   sortable: true,  render: date },
];

const TATA_RETURN_COLUMNS = [
  ...RETURN_COLUMNS.slice(0, 2),
  { key: 'sp1_channel_sub_order_id',    header: 'Sub Order ID',      sortable: true },
  ...RETURN_COLUMNS.slice(2, 13),
  { key: 'system_sub_order_id',         header: 'System Sub Order',  sortable: true },
  { key: 'return_order_item_id_count',  header: 'Return Item Count', sortable: true },
  { key: 'channel_sub_order_id_count',  header: 'Sub Order Count',   sortable: true },
  RETURN_COLUMNS[13],
];

/* ── Shared filter field sets ─────────────────────────────────────────────── */
const RETURN_STATUS_SELECTS = [
  { key: 'returnStatus', label: 'Return Status', optionsKey: 'returnStatuses' },
  { key: 'qcStatus',     label: 'QC Status',     optionsKey: 'qcStatuses' },
];

/* ── The registry ─────────────────────────────────────────────────────────────
   One entry per report. Pages, navigation, summary cards, table columns,
   filter fields and exports are all derived from this single source.        */
export const REPORTS = [
  {
    key: 'sales',
    group: 'Sales',
    path: '/sales',
    title: 'B2C Sales Report',
    description: 'Daily B2C sales by handover date across all channels.',
    icon: TrendingUp,
    tone: 'primary',
    tableTitle: 'B2C Sales Records',
    invalidate: () => salesApi.util.invalidateTags(['Sales']),
    store: useSalesFilterStore,
    api: { useList: useGetSalesListQuery, useSummary: useGetSalesSummaryQuery, useFilters: useGetSalesFiltersQuery },
    cards: salesCards('Total Orders'),
    columns: SALES_COLUMNS,
    filters: {
      dateLabel: 'Handover date',
      selects: [
        { key: 'salesChannel', label: 'Channel',      optionsKey: 'salesChannels' },
        { key: 'category',     label: 'Category',     optionsKey: 'categories' },
        { key: 'orderStatus',  label: 'Order Status', optionsKey: 'orderStatuses' },
        { key: 'warehouse',    label: 'Warehouse',    optionsKey: 'warehouses' },
        { key: 'paymentType',  label: 'Payment',      optionsKey: 'paymentTypes' },
        { key: 'state',        label: 'State',        optionsKey: 'states' },
        { key: 'brand',        label: 'Brand',        optionsKey: 'brands' },
      ],
      searchPlaceholder: 'Order ID, SKU, brand…',
    },
    exports: [
      { label: 'Export CSV', endpoint: 'sales/export', prefix: 'b2c_sales', successMessage: 'Sales report exported successfully' },
    ],
    rowKey: (r, i) => r.system_invoice_line_item_id ?? i,
  },
  {
    key: 'tata-cliq-sales',
    group: 'Sales',
    path: '/tata-cliq-sales',
    title: 'Tata Cliq Sales Report',
    description: 'TATACLIQ_ZIVORE sales with sub-order split details.',
    icon: TrendingUp,
    tone: 'cyan',
    tableTitle: 'Tata Cliq Sales Records',
    invalidate: () => salesApi.util.invalidateTags(['Sales']),
    store: useTataCliqSalesFilterStore,
    api: { useList: useGetTataCliqSalesListQuery, useSummary: useGetTataCliqSalesSummaryQuery, useFilters: useGetTataCliqSalesFiltersQuery },
    cards: salesCards('Total Rows'),
    columns: TATA_SALES_COLUMNS,
    filters: {
      dateLabel: 'Handover date',
      selects: [
        { key: 'orderStatus', label: 'Order Status', optionsKey: 'orderStatuses' },
        { key: 'warehouse',   label: 'Warehouse',    optionsKey: 'warehouses' },
        { key: 'paymentType', label: 'Payment',      optionsKey: 'paymentTypes' },
        { key: 'state',       label: 'State',        optionsKey: 'states' },
        { key: 'brand',       label: 'Brand',        optionsKey: 'brands' },
      ],
      searchPlaceholder: 'Order ID, sub order, SKU, brand…',
    },
    exports: [
      { label: 'Export CSV', endpoint: 'sales/tata-cliq/export', prefix: 'tata_cliq_sales', successMessage: 'Tata Cliq sales exported successfully' },
    ],
    rowKey: (r, i) => `${r.system_invoice_line_item_id ?? 'row'}-${r.channel_sub_order_id ?? ''}-${i}`,
  },
  {
    key: 'returns',
    group: 'Returns',
    path: '/returns',
    title: 'Returns Report',
    description: 'Processed returns with QC status across all channels.',
    icon: RotateCcw,
    tone: 'violet',
    tableTitle: 'Returns Records',
    invalidate: () => returnsApi.util.invalidateTags(['Returns']),
    store: useReturnsFilterStore,
    api: { useList: useGetReturnsListQuery, useSummary: useGetReturnsSummaryQuery, useFilters: useGetReturnsFiltersQuery },
    cards: returnCards('Total Returns'),
    columns: RETURN_COLUMNS,
    filters: {
      dateLabel: 'Processed time',
      selects: [
        { key: 'salesChannel', label: 'Channel', optionsKey: 'salesChannels' },
        ...RETURN_STATUS_SELECTS,
      ],
      searchPlaceholder: 'Order ID, SKU, brand…',
    },
    exports: [
      { label: 'Export CSV', endpoint: 'returns/export', prefix: 'returns_report', successMessage: 'Returns report exported successfully' },
      { label: 'Past Sale Return', endpoint: 'returns/past-return/export', prefix: 'past_returns_report', successMessage: 'Past returns exported successfully', secondary: true },
    ],
    rowKey: (r, i) => r.return_order_item_id ?? i,
  },
  {
    key: 'tata-cliq-return',
    group: 'Returns',
    path: '/tata-cliq-return',
    title: 'Tata Cliq Returns Report',
    description: 'TATACLIQ_ZIVORE returns with sub-order mapping.',
    icon: RotateCcw,
    tone: 'violet',
    tableTitle: 'Tata Cliq Return Records',
    invalidate: () => returnsApi.util.invalidateTags(['Returns']),
    store: useTataCliqReturnsFilterStore,
    api: { useList: useGetTataCliqReturnsListQuery, useSummary: useGetTataCliqReturnsSummaryQuery, useFilters: useGetTataCliqReturnsFiltersQuery },
    cards: returnCards('Tata Cliq Returns'),
    columns: TATA_RETURN_COLUMNS,
    filters: {
      dateLabel: 'Processed time',
      selects: RETURN_STATUS_SELECTS,
      searchPlaceholder: 'Order ID, SKU, brand…',
    },
    exports: [
      { label: 'Export CSV', endpoint: 'returns/tata-cliq/export', prefix: 'tata_cliq_returns', successMessage: 'Tata Cliq returns exported successfully' },
    ],
    rowKey: (r, i) => `${r.return_order_item_id ?? 'row'}-${r.sp1_channel_sub_order_id ?? ''}-${i}`,
  },
  {
    key: 'myntra-omni-return',
    group: 'Returns',
    path: '/myntra-omni-return',
    title: 'Myntra Omni Returns Report',
    description: 'MYNTRA-OMNI store returns processed in the current window.',
    icon: RotateCcw,
    tone: 'violet',
    tableTitle: 'Myntra Omni Return Records',
    invalidate: () => returnsApi.util.invalidateTags(['Returns']),
    store: useMyntraOmniReturnsFilterStore,
    api: { useList: useGetMyntraOmniReturnsListQuery, useSummary: useGetMyntraOmniReturnsSummaryQuery, useFilters: useGetMyntraOmniReturnsFiltersQuery },
    cards: returnCards('Omni Returns'),
    columns: RETURN_COLUMNS,
    filters: {
      dateLabel: 'Processed time',
      selects: RETURN_STATUS_SELECTS,
      searchPlaceholder: 'Order ID, SKU, brand…',
    },
    exports: [
      { label: 'Export CSV', endpoint: 'returns/omni/export', prefix: 'myntra_omni_returns', successMessage: 'Myntra Omni returns exported successfully' },
    ],
    rowKey: (r, i) => `${r.return_order_item_id ?? 'row'}-${i}`,
  },
];
