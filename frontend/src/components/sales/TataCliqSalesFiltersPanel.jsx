import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ChevronDown, X, Check } from 'lucide-react';
import { useTataCliqSalesFilterStore } from '../../store/useFilterStore';
import { useGetTataCliqSalesFiltersQuery } from '../../features/sales/salesApi';
import ErrorCard from '../ui/ErrorCard';
import { SkeletonBlock } from '../ui/Skeleton';
import { FilterSelect, FilterInput, DownloadWindowNotice } from '../ui/FilterControls';

const FILTER_KEYS = ['dateFrom','dateTo','orderStatus','warehouse','paymentType','state','brand','search'];

export default function TataCliqSalesFiltersPanel() {
  const { filters, setFilters, reset } = useTataCliqSalesFilterStore();
  const { data: opts, isLoading, isError, refetch } = useGetTataCliqSalesFiltersQuery();
  const [open, setOpen] = useState(true);
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(FILTER_KEYS.map((k) => [k, filters[k] ?? '']))
  );

  const patch = (key) => (val) => setDraft((d) => ({ ...d, [key]: val }));
  const hasChanges = FILTER_KEYS.some((k) => draft[k] !== (filters[k] ?? ''));
  const hasActive = FILTER_KEYS
    .filter((k) => !['dateFrom', 'dateTo'].includes(k))
    .some((k) => (filters[k] ?? '') !== '');

  const apply = () => setFilters({ ...draft });
  const clear = () => {
    reset();
    const newFilters = useTataCliqSalesFilterStore.getState().filters;
    setDraft(Object.fromEntries(FILTER_KEYS.map((k) => [k, newFilters[k] ?? ''])));
  };

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Filters</span>
          {hasActive && <span className="w-2 h-2 rounded-full bg-brand-500" />}
          {hasChanges && <span className="text-xs font-medium text-amber-500">unapplied changes</span>}
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-200 dark:border-slate-800"
          >
            {isError && (
              <div className="px-4 py-3">
                <ErrorCard compact message="Could not load filter options" onRetry={refetch} />
              </div>
            )}
            <DownloadWindowNotice />
            <div className="px-4 py-4 flex flex-wrap gap-3">
              <FilterInput label="Handover date" type="date" value={draft.dateFrom} onChange={patch("dateFrom")} />
              <FilterInput label="To" type="date" value={draft.dateTo} onChange={patch("dateTo")} />
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1 min-w-35">
                    <SkeletonBlock className="h-3 w-16" />
                    <SkeletonBlock className="h-8 w-full rounded-lg" />
                  </div>
                ))
              ) : (
                <>
                  <FilterSelect label="Order Status" value={draft.orderStatus} onChange={patch("orderStatus")} options={opts?.orderStatuses ?? []} />
                  <FilterSelect label="Warehouse" value={draft.warehouse} onChange={patch("warehouse")} options={opts?.warehouses ?? []} />
                  <FilterSelect label="Payment" value={draft.paymentType} onChange={patch("paymentType")} options={opts?.paymentTypes ?? []} />
                  <FilterSelect label="State" value={draft.state} onChange={patch("state")} options={opts?.states ?? []} />
                  <FilterSelect label="Brand" value={draft.brand} onChange={patch("brand")} options={opts?.brands ?? []} />
                </>
              )}
              <FilterInput label="Search" value={draft.search} onChange={patch("search")} placeholder="Order ID, SKU, brand..." />
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
              {hasActive ? (
                <button onClick={clear} className="btn-ghost text-xs flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Clear filters
                </button>
              ) : <span />}
              <button onClick={apply} disabled={!hasChanges} className="btn-primary text-xs">
                <Check className="w-3.5 h-3.5" />
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
