import { create } from 'zustand';

const pad  = (n) => String(n).padStart(2, '0');
const fmt  = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today     = () => fmt(new Date());
const allowedStart = () => {
  const d = new Date();
  d.setDate(1);
  if (new Date().getDate() <= 2) d.setMonth(d.getMonth() - 1);
  return fmt(d);
};

// Defaults are FUNCTIONS so dates are computed when used, not frozen at module
// load — reset() after midnight/month rollover now picks up the current window.
const dateDefaults = () => ({ dateFrom: allowedStart(), dateTo: today() });

const salesDefaults = () => ({
  ...dateDefaults(),
  salesChannel: '', category: '', orderStatus: '',
  warehouse: '', paymentType: '', state: '', brand: '', search: '',
  page: 1, pageSize: 50, sortBy: 'handover_time', sortDir: 'DESC',
});

const returnsDefaults = () => ({
  ...dateDefaults(),
  salesChannel: '', returnStatus: '', qcStatus: '', search: '',
  page: 1, pageSize: 50, sortBy: 'return_order_processed_time', sortDir: 'DESC',
});

const myntraOmniReturnsDefaults = () => ({
  ...dateDefaults(),
  returnStatus: '', qcStatus: '', search: '',
  page: 1, pageSize: 50, sortBy: 'return_order_processed_time', sortDir: 'DESC',
});

const tataCliqSalesDefaults = () => ({
  ...dateDefaults(),
  orderStatus: '', warehouse: '', paymentType: '', state: '', brand: '', search: '',
  page: 1, pageSize: 50, sortBy: 'handover_time', sortDir: 'DESC',
});

const tataCliqReturnsDefaults = () => ({
  ...dateDefaults(),
  returnStatus: '', qcStatus: '', search: '',
  page: 1, pageSize: 50, sortBy: 'return_order_processed_time', sortDir: 'DESC',
});

// One factory instead of five copy-pasted stores. API is unchanged:
// { filters, setFilters, setPage, setSort, reset }.
const createFilterStore = (makeDefaults) =>
  create((set) => ({
    filters:    makeDefaults(),
    setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch, page: 1 } })),
    setPage:    (page)  => set((s) => ({ filters: { ...s.filters, page } })),
    setSort:    (sortBy, sortDir) => set((s) => ({ filters: { ...s.filters, sortBy, sortDir, page: 1 } })),
    reset:      () => set({ filters: makeDefaults() }),
  }));

export const useSalesFilterStore             = createFilterStore(salesDefaults);
export const useReturnsFilterStore           = createFilterStore(returnsDefaults);
export const useMyntraOmniReturnsFilterStore = createFilterStore(myntraOmniReturnsDefaults);
export const useTataCliqSalesFilterStore     = createFilterStore(tataCliqSalesDefaults);
export const useTataCliqReturnsFilterStore   = createFilterStore(tataCliqReturnsDefaults);

export const cleanParams = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null && v !== ''));

/** Filter params WITHOUT pagination/sort — for summary & analytics queries.
    Including page/sortBy made every table page-flip refetch the aggregates
    and fragmented the server cache into one entry per page. */
export const cleanAggParams = ({ page, pageSize, sortBy, sortDir, ...rest } = {}) =>
  cleanParams(rest);
