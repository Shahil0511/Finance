import { Suspense, lazy } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { CalendarRange, RefreshCw } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import FiltersPanel from '../components/reports/FiltersPanel';
import SummaryCards from '../components/reports/SummaryCards';
import ReportTable from '../components/reports/ReportTable';
import { markForcedRefresh } from '../lib/refreshBus';

// recharts is heavy — split the charts section into its own lazy chunk so the
// initial bundle stays lean and charts stream in after first paint.
const ChartsPanel = lazy(() => import('../components/reports/ChartsPanel'));

function ChartsFallback() {
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

/** The one report page — fully driven by a registry entry (config/reports.jsx).
    Each section fetches independently; a failure in one shows an inline error
    with retry while the others keep working.                                 */
export default function ReportPage({ report }) {
  const dispatch = useDispatch();
  const { filters } = report.store();

  const handleRefresh = () => {
    // Mark the refetch window so every request carries Cache-Control:
    // no-cache — the backend skips its Redis read and overwrites the cached
    // entry with fresh data. Then invalidate the RTK tags to refetch.
    markForcedRefresh();
    dispatch(report.invalidate());
  };

  return (
    <Layout title={report.title}>
      <motion.div
        className="space-y-4 sm:space-y-5"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {/* Page header: compact enterprise hierarchy. */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
              {report.title}
            </h1>
            <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{report.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
              <CalendarRange className="size-3.5" aria-hidden="true" />
              {rangeChip(filters.dateFrom, filters.dateTo)}
            </span>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="size-3.5" aria-hidden="true" /> Refresh
            </Button>
          </div>
        </div>

        <SummaryCards report={report} />
        {report.analytics && (
          <Suspense fallback={<ChartsFallback />}>
            <ChartsPanel report={report} />
          </Suspense>
        )}
        <FiltersPanel report={report} />
        <ReportTable report={report} />
      </motion.div>
    </Layout>
  );
}
