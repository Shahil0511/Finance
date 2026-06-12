import { motion } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp } from 'lucide-react';
import ErrorCard from '../ui/ErrorCard';
import LoadingBanner from '../ui/LoadingBanner';
import EmptyState from '../ui/EmptyState';
import { SkeletonRows } from '../ui/Skeleton';
import { cn } from '../../lib/cn';

function SortIcon({ active, dir }) {
  if (!active) return <ChevronsUpDown className="size-3 opacity-40" aria-hidden="true" />;
  return dir === 'ASC'
    ? <ChevronUp className="size-3 text-primary" aria-hidden="true" />
    : <ChevronDown className="size-3 text-primary" aria-hidden="true" />;
}

/** Presentational data table: card chrome, sortable headers, skeleton loading,
    empty state, horizontal scroll on small screens, hasMore-aware paging.   */
export default function DataTable({
  columns = [], data = [], pagination = {},
  sortBy, sortDir, onSort, onPage, onPageSize,
  title, actions = null,
  isLoading, isFetching, isError, error, onRetry,
  executionTimeMs,
  emptyMessage = 'No records match the selected filters.',
  rowKey,
}) {
  const {
    total = 0,
    page = 1,
    pageSize = 50,
    totalPages = 0,
    estimated = false,
    hasMore = false,
  } = pagination;

  if (isError) {
    return <ErrorCard message={error?.data?.detail || error?.error || 'Failed to load data'} onRetry={onRetry} />;
  }

  const handleSort = (col) => {
    if (!onSort) return;
    onSort(col, sortBy === col && sortDir === 'DESC' ? 'ASC' : 'DESC');
  };

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = data.length ? (page - 1) * pageSize + data.length : 0;
  const recordLabel = `${total.toLocaleString('en-IN')}${estimated && hasMore ? '+' : ''} records`;
  const queryTime = Number.isFinite(executionTimeMs)
    ? `${Math.max(0.1, executionTimeMs / 1000).toFixed(1)}s`
    : null;
  const showSkeleton = isLoading && data.length === 0;

  return (
    <motion.div
      className="relative overflow-hidden rounded-lg border border-border bg-card shadow-soft"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {isFetching && (
        <div className="absolute left-0 right-0 top-0 z-10 h-0.5 overflow-hidden" aria-hidden="true">
          <motion.div
            className="h-full bg-primary"
            style={{ width: '45%' }}
            animate={{ x: ['-120%', '260%'] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5">
          {title && <h3 className="text-[13px] font-semibold text-card-foreground">{title}</h3>}
          {showSkeleton ? (
            <LoadingBanner />
          ) : (
            <p className="text-xs tabular-nums text-muted-foreground">
              {recordLabel}
              {queryTime ? ` · ${queryTime}` : null}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {/* Table — contained scroll on both axes with a sticky header. */}
      <div className="max-h-[70vh] overflow-auto overscroll-contain">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 [box-shadow:0_1px_0_var(--border)]">
            <tr className="bg-muted">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={sortBy === col.key ? (sortDir === 'ASC' ? 'ascending' : 'descending') : undefined}
                  className="select-none whitespace-nowrap px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground first:pl-4 last:pr-4"
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1 rounded font-semibold uppercase tracking-wider transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {col.header}
                      <SortIcon active={sortBy === col.key} dir={sortDir} />
                    </button>
                  ) : (
                    <span className="flex items-center gap-1">{col.header}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {showSkeleton ? (
              <SkeletonRows rows={8} cols={columns.length} />
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState description={emptyMessage} />
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={rowKey ? rowKey(row, i) : i}
                  className="transition-colors duration-100 hover:bg-accent/50"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="max-w-56 truncate whitespace-nowrap px-3 py-2 text-[12.5px] text-foreground/90 first:pl-4 first:font-medium first:text-foreground last:pr-4"
                    >
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rows per page</span>
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => onPageSize?.(Number(e.target.value))}
              aria-label="Rows per page"
              className="h-8 appearance-none rounded-md border border-input bg-card pl-2 pr-6 text-xs text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {[25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs tabular-nums text-muted-foreground">
            Showing {from.toLocaleString('en-IN')}–{to.toLocaleString('en-IN')} of {total.toLocaleString('en-IN')}{estimated && hasMore ? '+' : ''}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onPage?.(page - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
              className={cn(
                'flex size-10 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors sm:size-8',
                'hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:pointer-events-none disabled:opacity-40',
              )}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => onPage?.(page + 1)}
              disabled={!(hasMore || page < totalPages)}
              aria-label="Next page"
              className={cn(
                'flex size-10 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors sm:size-8',
                'hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'disabled:pointer-events-none disabled:opacity-40',
              )}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
