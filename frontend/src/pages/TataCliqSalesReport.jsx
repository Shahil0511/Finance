import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { salesApi } from '../features/sales/salesApi';
import Layout from '../components/layout/Layout';
import TataCliqSalesFiltersPanel from '../components/sales/TataCliqSalesFiltersPanel';
import TataCliqSalesSummaryCards from '../components/sales/TataCliqSalesSummaryCards';
import TataCliqSalesDataTable from '../components/sales/TataCliqSalesDataTable';

export default function TataCliqSalesReport() {
  const dispatch = useDispatch();

  const handleRefresh = () => {
    dispatch(salesApi.util.invalidateTags(['Sales']));
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
            <TrendingUp className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Tata Cliq Sales</h1>
          </div>
          <button onClick={handleRefresh} className="btn-ghost text-xs flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh all
          </button>
        </div>

        <TataCliqSalesFiltersPanel />
        <TataCliqSalesSummaryCards />
        <TataCliqSalesDataTable />
      </motion.div>
    </Layout>
  );
}
