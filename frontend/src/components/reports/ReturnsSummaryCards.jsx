import { motion } from 'framer-motion';
import StatCard from '../ui/StatCard';
import ErrorCard from '../ui/ErrorCard';
import { cn } from '../../lib/cn';
import { RETURNS_REPORT } from '../../config/reports';
import { useGetReturnsSummaryQuery } from '../../features/returns/returnsApi';
import { cleanAggParams, useReturnsFilterStore } from '../../store/useFilterStore';

export default function ReturnsSummaryCards() {
  const filters = useReturnsFilterStore((s) => s.filters);
  const { data, isLoading, isFetching, isError, error, refetch } = useGetReturnsSummaryQuery(cleanAggParams(filters));

  if (isError) {
    return <ErrorCard compact message={error?.data?.detail || 'Could not load summary'} onRetry={refetch} />;
  }

  const cards = RETURNS_REPORT.cards;
  const grid = cards.length >= 4
    ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-5'
    : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4';

  return (
    <section aria-label={`${RETURNS_REPORT.title} summary`} className={cn('relative grid gap-3 sm:gap-4', grid)}>
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
