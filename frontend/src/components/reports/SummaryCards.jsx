import { motion } from 'framer-motion';
import StatCard from '../ui/StatCard';
import ErrorCard from '../ui/ErrorCard';
import { cleanAggParams } from '../../store/useFilterStore';
import { cn } from '../../lib/cn';

/** Config-driven KPI strip — one component for every report. */
export default function SummaryCards({ report }) {
  const { filters } = report.store();
  const { useSummary } = report.api;
  const { data, isLoading, isFetching, isError, error, refetch } = useSummary(cleanAggParams(filters));

  if (isError) {
    return (
      <ErrorCard
        compact
        message={error?.data?.detail || 'Could not load summary'}
        onRetry={refetch}
      />
    );
  }

  const grid = report.cards.length >= 4
    ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-5'
    : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4';

  return (
    <section aria-label={`${report.title} summary`} className={cn('relative grid gap-3 sm:gap-4', grid)}>
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
      {report.cards.map((card, i) => (
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
