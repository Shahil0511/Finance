import { motion } from 'framer-motion';
import { RotateCcw, DollarSign } from 'lucide-react';
import { useGetTataCliqReturnsSummaryQuery } from '../../features/returns/returnsApi';
import { useTataCliqReturnsFilterStore, cleanParams } from '../../store/useFilterStore';
import ErrorCard from '../ui/ErrorCard';
import LoadingBanner from '../ui/LoadingBanner';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const CARDS = [
  { key: 'total_returns', label: 'Tata Cliq Returns', Icon: RotateCcw, color: 'text-violet-500', fmt: formatNumber },
  { key: 'forward_order_value', label: 'Forward Order Value', Icon: DollarSign, color: 'text-emerald-500', fmt: formatCurrency },
];

export default function TataCliqReturnsSummaryCards() {
  const { filters } = useTataCliqReturnsFilterStore();
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetTataCliqReturnsSummaryQuery(cleanParams(filters));

  if (isLoading) return <div className="card px-4 py-3"><LoadingBanner /></div>;
  if (isError) return <ErrorCard compact message={error?.data?.detail || 'Could not load summary'} onRetry={refetch} />;

  return (
    <div className="grid grid-cols-2 gap-4 relative">
      {isFetching && (
        <div className="absolute -top-1 left-0 right-0 h-0.5 overflow-hidden rounded-full">
          <motion.div className="h-full bg-brand-500" style={{ width: '45%' }} animate={{ x: ['-120%', '260%'] }} transition={{ duration: 1.9, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }} />
        </div>
      )}
      {CARDS.map(({ key, label, Icon, color, fmt }, i) => (
        <motion.div key={key} className="card p-4 flex flex-col gap-3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }} whileHover={{ y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight">{label}</span>
            <div className={`flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 ${color}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {fmt(data?.[key])}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
