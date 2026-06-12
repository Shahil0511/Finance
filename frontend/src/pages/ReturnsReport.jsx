import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { returnsApi } from '../features/returns/returnsApi';
import Layout              from '../components/layout/Layout';
import ReturnsFiltersPanel from '../components/returns/ReturnsFiltersPanel';
import ReturnsSummaryCards from '../components/returns/ReturnsSummaryCards';
import ReturnsDataTable    from '../components/returns/ReturnsDataTable';

export default function ReturnsReport() {
  const dispatch = useDispatch();

  const handleRefresh = () => {
    dispatch(returnsApi.util.invalidateTags(['Returns']));
  };

  return (
    <Layout>
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Returns Report</h1>
          </div>
          <button onClick={handleRefresh} className="btn-ghost text-xs flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh all
          </button>
        </div>

        {/* Each section independently fetches its own data.
            If one fails, only that section shows an error + retry button. */}
        <ReturnsFiltersPanel />
        <ReturnsSummaryCards />
        <ReturnsDataTable />
      </motion.div>
    </Layout>
  );
}
