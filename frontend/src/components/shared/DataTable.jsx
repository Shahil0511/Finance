import { motion } from 'framer-motion';
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, Download,
} from 'lucide-react';
import ErrorCard from '../ui/ErrorCard';
import LoadingBanner from '../ui/LoadingBanner';

function SortIcon({ active, dir }) {
  if (!active) return <ChevronsUpDown className="w-3 h-3 opacity-30" />;
  return dir === 'ASC'
    ? <ChevronUp className="w-3 h-3 text-brand-500" />
    : <ChevronDown className="w-3 h-3 text-brand-500" />;
}

export default function DataTable({
  columns = [], data = [], pagination = {},
  sortBy, sortDir, onSort, onPage, onPageSize,
  title, onExport, exportLoading,
  extraActions,
  isLoading, isFetching, isError, error, onRetry,
  executionTimeMs,
  emptyMessage = "No records match the selected filters.",
  // Stable React key per row (e.g. an order/return id). Falls back to the index.
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
    return (
      <ErrorCard
        message={error?.data?.detail || error?.error || 'Failed to load data'}
        onRetry={onRetry}
      />
    );
  }

  const handleSort = (col) => {
    if (!onSort) return;
    onSort(col, sortBy === col && sortDir === 'DESC' ? 'ASC' : 'DESC');
  };

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = data.length ? (page - 1) * pageSize + data.length : 0;
  const recordLabel = estimated && hasMore
    ? `${total.toLocaleString('en-IN')}+ records`
    : `${total.toLocaleString('en-IN')} records`;
  const queryTime = Number.isFinite(executionTimeMs)
    ? `Query ${Math.max(0.1, executionTimeMs / 1000).toFixed(1)}s`
    : null;

  return (
    <motion.div
      className="card overflow-hidden relative"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {isFetching && (
        <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden z-10 rounded-t-xl">
          <motion.div
            className="h-full bg-brand-500"
            style={{ width: '45%' }}
            animate={{ x: ['-120%', '260%'] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          {title && <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>}
          {isLoading && data.length === 0 ? (
            <LoadingBanner className="mt-0.5" />
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {recordLabel} found{queryTime ? ` - ${queryTime}` : ''}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {extraActions}
          {onExport && (
            <button
              onClick={onExport}
              disabled={exportLoading}
              className="btn-outline text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              {exportLoading ? 'Exporting...' : 'Export CSV'}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={sortBy === col.key ? (sortDir === 'ASC' ? 'ascending' : 'descending') : undefined}
                  className="px-3 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap select-none"
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1 font-semibold cursor-pointer hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      {col.header}
                      <SortIcon active={sortBy === col.key} dir={sortDir} />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">{col.header}</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-14 text-center text-slate-400 dark:text-slate-500 text-sm">
                  {isLoading ? "Loading data..." : emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={rowKey ? rowKey(row, i) : i}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap max-w-50 truncate">
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Rows</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSize?.(Number(e.target.value))}
            aria-label="Rows per page"
            className="input-base py-1 text-xs"
          >
            {[25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>
            {from.toLocaleString('en-IN')}-{to.toLocaleString('en-IN')} of {total.toLocaleString('en-IN')}{estimated && hasMore ? '+' : ''}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onPage?.(page - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onPage?.(page + 1)}
              disabled={!(hasMore || page < totalPages)}
              aria-label="Next page"
              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
