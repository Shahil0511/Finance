import { useMemo, useState } from 'react';
import { Check, Info, X } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import ErrorCard from '../ui/ErrorCard';
import { Skeleton } from '../ui/Skeleton';
import { FilterDate, FilterSearch, FilterSelect } from '../ui/FilterControls';

/** Compact enterprise filter toolbar — one dense row that wraps. Edits stay
    local in a draft until "Apply" commits them to the store.               */
export default function FiltersPanel({ report }) {
  const { filters: applied, setFilters, reset } = report.store();
  const { useFilters } = report.api;
  const { data: opts, isLoading, isError, refetch } = useFilters();

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
    <section className="rounded-lg border border-border bg-card shadow-soft" aria-label="Filters">
      {isError && (
        <div className="border-b border-border px-3 py-2.5 sm:px-4">
          <ErrorCard compact message="Could not load filter options" onRetry={refetch} />
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2.5 px-3 py-3 sm:px-4">
        <FilterDate label={report.filters.dateLabel} value={draft.dateFrom} onChange={patch('dateFrom')} className="w-full sm:w-36" />
        <FilterDate label="To" value={draft.dateTo} onChange={patch('dateTo')} className="w-full sm:w-36" />

        {isLoading
          ? report.filters.selects.map((s) => (
              <div key={s.key} className="flex w-full flex-col gap-1 sm:w-44">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-10 w-full rounded-md sm:h-9" />
              </div>
            ))
          : report.filters.selects.map((s) => (
              <FilterSelect
                key={s.key}
                label={s.label}
                value={draft[s.key]}
                onChange={patch(s.key)}
                options={opts?.[s.optionsKey] ?? []}
                className="w-full sm:w-44"
              />
            ))}

        <FilterSearch
          value={draft.search}
          onChange={patch('search')}
          placeholder={report.filters.searchPlaceholder}
          className="w-full sm:w-52"
        />

        <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
          {activeCount > 0 && <Badge variant="info">{activeCount} active</Badge>}
          {hasChanges && <Badge variant="warning">unapplied</Badge>}
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clear}>
              <X className="size-3.5" aria-hidden="true" /> Clear
            </Button>
          )}
          <Button size="sm" onClick={apply} disabled={!hasChanges}>
            <Check className="size-3.5" aria-hidden="true" /> Apply
          </Button>
        </div>
      </div>

      <p className="flex items-start gap-1.5 border-t border-border px-3 py-2 text-xs leading-relaxed text-muted-foreground sm:px-4">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        Previous month is available through the 2nd of the current month; from the 3rd onward, data covers the current month only.
      </p>
    </section>
  );
}
