import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import FiltersPanel from '../components/reports/FiltersPanel';
import SummaryCards from '../components/reports/SummaryCards';
import ReportTable from '../components/reports/ReportTable';
import { cn } from '../lib/cn';

const TONES = {
  primary: 'bg-primary/10 text-primary',
  cyan:    'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  violet:  'bg-violet-500/10 text-violet-600 dark:text-violet-400',
};

/** The one report page — fully driven by a registry entry (config/reports.jsx).
    Each section fetches independently; a failure in one shows an inline error
    with retry while the others keep working.                                 */
export default function ReportPage({ report }) {
  const dispatch = useDispatch();
  const Icon = report.icon;

  return (
    <Layout>
      <motion.div
        className="space-y-4 sm:space-y-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-11', TONES[report.tone] ?? TONES.primary)}
              aria-hidden="true"
            >
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
                {report.title}
              </h1>
              <p className="truncate text-xs text-muted-foreground sm:text-sm">{report.description}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => dispatch(report.invalidate())}>
            <RefreshCw className="size-3.5" aria-hidden="true" /> Refresh
          </Button>
        </div>

        <FiltersPanel report={report} />
        <SummaryCards report={report} />
        <ReportTable report={report} />
      </motion.div>
    </Layout>
  );
}
