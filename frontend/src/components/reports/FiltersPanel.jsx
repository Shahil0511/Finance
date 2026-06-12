import { useId, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Filter, X } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import ErrorCard from '../ui/ErrorCard';
import { Skeleton } from '../ui/Skeleton';
import { DownloadWindowNotice, FilterDate, FilterSearch, FilterSelect } from '../ui/FilterControls';

/** Config-driven, collapsible filter panel — one component for every report.
    Edits stay local in a draft until "Apply" commits them to the store.     */
export default function FiltersPanel({ report }) {
  const { filters: applied, setFilters, reset } = report.store();
  const { useFilters } = report.api;
  const { data: opts, isLoading, isError, refetch } = useFilters();
  const [open, setOpen] = useState(true);
  const bodyId = useId();

  const keys = useMemo(
    () => ['dateFrom', 'dateTo', ...report.filters.selects.map((s) => s.key), 'search'],
    [report],
  );
  const snapshot = (source) => Object.fromEntries(keys.map((k) => [k, source[k] ?? '']));

  const [draft, setDraft] = useState(() => snapshot(applied));
  const patch = (key) => (val) => setDraft((d) => ({ ...d, [key]: val }));

  const hasChanges = keys.some((k) => draft[k] !== (applied[k] ?? ''));
  const activeCount = keys
    .filter((k) => !['dateFrom', 'dateTo'].includes(k))
    .filter((k) => (applied[k] ?? '') !== '').length;

  const apply = () => setFilters({ ...draft });
  const clear = () => {
    reset();
    setDraft(snapshot(report.store.getState().filters));
  };

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-soft" aria-label="Filters">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="flex min-h-12 w-full items-center justify-between px-4 py-3 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"
      >
        <span className="flex items-center gap-2.5">
          <Filter className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">Filters</span>
          {activeCount > 0 && <Badge variant="info">{activeCount} active</Badge>}
          {hasChanges && <Badge variant="warning">unapplied</Badge>}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} aria-hidden="true">
          <ChevronDown className="size-4 text-muted-foreground" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={bodyId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-border"
          >
            {isError && (
              <div className="px-4 pt-4 sm:px-5">
                <ErrorCard compact message="Could not load filter options" onRetry={refetch} />
              </div>
            )}

            <DownloadWindowNotice />

            <div className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-2 sm:gap-4 sm:px-5 lg:grid-cols-3 xl:grid-cols-4">
              <FilterDate label={report.filters.dateLabel} value={draft.dateFrom} onChange={patch('dateFrom')} />
              <FilterDate label="To" value={draft.dateTo} onChange={patch('dateTo')} />

              {isLoading
                ? report.filters.selects.map((s) => (
                    <div key={s.key} className="flex flex-col gap-1.5">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-11 w-full rounded-lg sm:h-10" />
                    </div>
                  ))
                : report.filters.selects.map((s) => (
                    <FilterSelect
                      key={s.key}
                      label={s.label}
                      value={draft[s.key]}
                      onChange={patch(s.key)}
                      options={opts?.[s.optionsKey] ?? []}
                    />
                  ))}

              <FilterSearch
                value={draft.search}
                onChange={patch('search')}
                placeholder={report.filters.searchPlaceholder}
              />
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              {activeCount > 0 ? (
                <Button variant="ghost" size="sm" onClick={clear} className="w-full sm:w-auto">
                  <X className="size-3.5" aria-hidden="true" /> Clear filters
                </Button>
              ) : (
                <span aria-hidden="true" />
              )}
              <Button size="sm" onClick={apply} disabled={!hasChanges} className="w-full sm:w-auto">
                <Check className="size-3.5" aria-hidden="true" />
                Apply Filters
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
