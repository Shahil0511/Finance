import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ChevronDown, X, Check, Info } from 'lucide-react';
import { useReturnsFilterStore } from '../../store/useFilterStore';
import { useGetReturnsFiltersQuery } from '../../features/returns/returnsApi';
import ErrorCard from '../ui/ErrorCard';
import { SkeletonBlock } from '../ui/Skeleton';

const FILTER_KEYS = ['dateFrom','dateTo','salesChannel','returnStatus','qcStatus','search'];

function FilterSelect({ label, value, onChange, options = [] }) {
  return (
    <div className="flex flex-col gap-1 min-w-35">
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-base py-1.5">
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function FilterInput({ label, value, onChange, type = 'text', ...rest }) {
  return (
    <div className="flex flex-col gap-1 min-w-35">
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="input-base py-1.5" {...rest} />
    </div>
  );
}

function DownloadWindowNotice() {
  return (
    <div className="mx-4 mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
      <p>
        Previous month downloads are available through the 2nd day of the current month. From the 3rd onward, downloads are limited to the current month.
      </p>
    </div>
  );
}

export default function ReturnsFiltersPanel() {
  const { filters, setFilters, reset } = useReturnsFilterStore();
  const { data: opts, isLoading, isError, refetch } = useGetReturnsFiltersQuery();
  const [open, setOpen] = useState(true);

  // Draft: local state that the user edits freely — not committed until Apply is clicked
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
    const newFilters = useReturnsFilterStore.getState().filters;
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
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Filters
          </span>
          {hasActive && <span className="w-2 h-2 rounded-full bg-brand-500" />}
          {hasChanges && (
            <span className="text-xs font-medium text-amber-500">
              unapplied changes
            </span>
          )}
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
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
                <ErrorCard
                  compact
                  message="Could not load filter options"
                  onRetry={refetch}
                />
              </div>
            )}

            <DownloadWindowNotice />

            <div className="px-4 py-4 flex flex-wrap gap-3">
              <FilterInput
                label="Processed Time"
                type="date"
                value={draft.dateFrom}
                onChange={patch("dateFrom")}
              />
              <FilterInput
                label="To"
                type="date"
                value={draft.dateTo}
                onChange={patch("dateTo")}
              />

              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1 min-w-35">
                    <SkeletonBlock className="h-3 w-16" />
                    <SkeletonBlock className="h-8 w-full rounded-lg" />
                  </div>
                ))
              ) : (
                <>
                  <FilterSelect
                    label="Channel"
                    value={draft.salesChannel}
                    onChange={patch("salesChannel")}
                    options={opts?.salesChannels ?? []}
                  />
                  <FilterSelect
                    label="Return Status"
                    value={draft.returnStatus}
                    onChange={patch("returnStatus")}
                    options={opts?.returnStatuses ?? []}
                  />
                  <FilterSelect
                    label="QC Status"
                    value={draft.qcStatus}
                    onChange={patch("qcStatus")}
                    options={opts?.qcStatuses ?? []}
                  />
                </>
              )}

              <FilterInput
                label="Search"
                value={draft.search}
                onChange={patch("search")}
                placeholder="Order ID, SKU, brand…"
              />
            </div>

            {/* Action bar */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
              {hasActive ? (
                <button
                  onClick={clear}
                  className="btn-ghost text-xs flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Clear filters
                </button>
              ) : (
                <span />
              )}
              <button
                onClick={apply}
                disabled={!hasChanges}
                className="btn-primary text-xs"
              >
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
