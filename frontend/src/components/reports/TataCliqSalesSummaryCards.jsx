import { motion } from 'framer-motion';
import StatCard from '../ui/StatCard';
import ErrorCard from '../ui/ErrorCard';
import { cn } from '../../lib/cn';
import { TATA_CLIQ_SALES_REPORT } from '../../config/reports';
import { useGetTataCliqSalesSummaryQuery } from '../../features/sales/salesApi';
import { cleanAggParams, useTataCliqSalesFilterStore } from '../../store/useFilterStore';

export default function TataCliqSalesSummaryCards() {
  const filters = useTataCliqSalesFilterStore((s) => s.filters);
  const { data, isLoading, isFetching, isError, error, refetch } = useGetTataCliqSalesSummaryQuery(cleanAggParams(filters));

  if (isError) {
    return <ErrorCard compact message={error?.data?.detail || 'Could not load summary'} onRetry={refetch} />;
  }

  const cards = TATA_CLIQ_SALES_REPORT.cards;
  const grid = cards.length >= 4
    ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-5'
    : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4';

  return (
    <section aria-label={`${TATA_CLIQ_SALES_REPORT.title} summary`} className={cn('relative grid gap-3 sm:gap-4', grid)}>
      {isFetching && !isLoading && (
        <div className="absolute -top-2 left-0 right-0 h-0.5 overflow-hidden rounded-full" aria-hidden="true">
          <motion.div
            className="h-full bg-primary"
            style={{ width: '45%' }}
            animate={{ x: ['-120%', '260%'] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          />
        </div>
      )}
      {cards.map((card, i) => (
        <StatCard
          key={card.key}
          label={card.label}
          icon={card.icon}
          tone={card.tone}
          loading={isLoading}
          value={card.fmt(data?.[card.key])}
          index={i}
        />
      ))}
    </section>
  );
}
