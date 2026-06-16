import { motion } from 'framer-motion';
import { CalendarRange, RefreshCw } from 'lucide-react';
import Layout from '../layout/Layout';
import Button from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';

export function ChartsFallback() {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3" aria-hidden="true">
      <Skeleton className="h-72 rounded-lg lg:col-span-2" />
      <Skeleton className="h-72 rounded-lg" />
    </div>
  );
}

const rangeChip = (from, to) => {
  const fmt = (s) =>
    s ? new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';
  return from && to ? `${fmt(from)} – ${fmt(to)}` : 'Current window';
};

const fmtDateTime = (v) =>
  v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const fmtTime = (v) =>
  v ? new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

export default function ReportShell({
  title, description, dateFrom, dateTo, lastDataAt, lastFetchedAt, refreshing, onRefresh, children,
}) {
  return (
    <Layout title={title}>
      <motion.div
        className="space-y-4 sm:space-y-5"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden flex-col items-end leading-tight lg:flex">
              <span className="text-[11px] text-muted-foreground">
                DB updated: <span className="font-medium text-foreground/80">{fmtDateTime(lastDataAt)}</span>
              </span>
              <span className="text-[11px] text-muted-foreground">
                Fetched: <span className="font-medium text-foreground/80">{fmtTime(lastFetchedAt)}</span>
              </span>
            </div>
            <span className="hidden items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
              <CalendarRange className="size-3.5" aria-hidden="true" />
              {rangeChip(dateFrom, dateTo)}
            </span>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
              <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh
            </Button>
          </div>
        </div>

        {children}
      </motion.div>
    </Layout>
  );
}
