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

const DEFAULT_SALES = {
  dateFrom: allowedStart(), dateTo: today(),
  salesChannel: '', category: '', orderStatus: '',
  warehouse: '', paymentType: '', state: '', brand: '', search: '',
  page: 1, pageSize: 50, sortBy: 'handover_time', sortDir: 'DESC',
};

const DEFAULT_RETURNS = {
  dateFrom: allowedStart(), dateTo: today(),
  salesChannel: '', returnStatus: '', qcStatus: '', search: '',
  page: 1, pageSize: 50, sortBy: 'return_order_processed_time', sortDir: 'DESC',
};

const DEFAULT_MYNTRA_OMNI_RETURNS = {
  dateFrom: allowedStart(), dateTo: today(),
  returnStatus: '', qcStatus: '', search: '',
  page: 1, pageSize: 50, sortBy: 'return_order_processed_time', sortDir: 'DESC',
};

const DEFAULT_TATA_CLIQ_SALES = {
  dateFrom: allowedStart(), dateTo: today(),
  orderStatus: '', warehouse: '', paymentType: '', state: '', brand: '', search: '',
  page: 1, pageSize: 50, sortBy: 'handover_time', sortDir: 'DESC',
};

const DEFAULT_TATA_CLIQ_RETURNS = {
  dateFrom: allowedStart(), dateTo: today(),
  returnStatus: '', qcStatus: '', search: '',
  page: 1, pageSize: 50, sortBy: 'return_order_processed_time', sortDir: 'DESC',
};

export const useSalesFilterStore = create((set) => ({
  filters:    { ...DEFAULT_SALES },
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch, page: 1 } })),
  setPage:    (page)  => set((s) => ({ filters: { ...s.filters, page } })),
  setSort:    (sortBy, sortDir) => set((s) => ({ filters: { ...s.filters, sortBy, sortDir, page: 1 } })),
  reset:      () => set({ filters: { ...DEFAULT_SALES } }),
}));

export const useReturnsFilterStore = create((set) => ({
  filters:    { ...DEFAULT_RETURNS },
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch, page: 1 } })),
  setPage:    (page)  => set((s) => ({ filters: { ...s.filters, page } })),
  setSort:    (sortBy, sortDir) => set((s) => ({ filters: { ...s.filters, sortBy, sortDir, page: 1 } })),
  reset:      () => set({ filters: { ...DEFAULT_RETURNS } }),
}));

export const useMyntraOmniReturnsFilterStore = create((set) => ({
  filters:    { ...DEFAULT_MYNTRA_OMNI_RETURNS },
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch, page: 1 } })),
  setPage:    (page)  => set((s) => ({ filters: { ...s.filters, page } })),
  setSort:    (sortBy, sortDir) => set((s) => ({ filters: { ...s.filters, sortBy, sortDir, page: 1 } })),
  reset:      () => set({ filters: { ...DEFAULT_MYNTRA_OMNI_RETURNS } }),
}));

export const useTataCliqSalesFilterStore = create((set) => ({
  filters:    { ...DEFAULT_TATA_CLIQ_SALES },
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch, page: 1 } })),
  setPage:    (page)  => set((s) => ({ filters: { ...s.filters, page } })),
  setSort:    (sortBy, sortDir) => set((s) => ({ filters: { ...s.filters, sortBy, sortDir, page: 1 } })),
  reset:      () => set({ filters: { ...DEFAULT_TATA_CLIQ_SALES } }),
}));

export const useTataCliqReturnsFilterStore = create((set) => ({
  filters:    { ...DEFAULT_TATA_CLIQ_RETURNS },
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch, page: 1 } })),
  setPage:    (page)  => set((s) => ({ filters: { ...s.filters, page } })),
  setSort:    (sortBy, sortDir) => set((s) => ({ filters: { ...s.filters, sortBy, sortDir, page: 1 } })),
  reset:      () => set({ filters: { ...DEFAULT_TATA_CLIQ_RETURNS } }),
}));

export const cleanParams = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null && v !== ''));
