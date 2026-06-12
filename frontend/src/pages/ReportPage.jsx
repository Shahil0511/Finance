import { Suspense, lazy } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import FiltersPanel from '../components/reports/FiltersPanel';
import SummaryCards from '../components/reports/SummaryCards';
import ReportTable from '../components/reports/ReportTable';
import { cn } from '../lib/cn';

// recharts is heavy — split the charts section into its own lazy chunk so the
// initial bundle stays lean and charts stream in after first paint.
const ChartsPanel = lazy(() => import('../components/reports/ChartsPanel'));

function ChartsFallback() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3" aria-hidden="true">
      <Skeleton className="h-80 rounded-xl lg:col-span-2" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

const EYEBROWS = {
  primary: 'text-primary',
  cyan:    'text-cyan-600 dark:text-cyan-400',
  violet:  'text-violet-600 dark:text-violet-400',
};

/** The one report page — fully driven by a registry entry (config/reports.jsx).
    Each section fetches independently; a failure in one shows an inline error
    with retry while the others keep working.                                 */
export default function ReportPage({ report }) {
  const dispatch = useDispatch();

  return (
    <Layout title={report.title}>
      <motion.div
        className="space-y-5 sm:space-y-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className={cn('text-[11px] font-bold uppercase tracking-[0.18em]', EYEBROWS[report.tone] ?? EYEBROWS.primary)}>
              {report.group} · Daily report
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {report.title}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{report.description}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => dispatch(report.invalidate())}>
            <RefreshCw className="size-3.5" aria-hidden="true" /> Refresh
          </Button>
        </div>

        <SummaryCards report={report} />
        <FiltersPanel report={report} />
        {report.analytics && (
          <Suspense fallback={<ChartsFallback />}>
            <ChartsPanel report={report} />
          </Suspense>
        )}
        <ReportTable report={report} />
      </motion.div>
    </Layout>
  );
}
