import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { Skeleton } from './Skeleton';
import { cn } from '../../lib/cn';

/** Card shell for a chart: title, optional headline stat, loading skeleton,
    empty state, fixed height. */
export default function ChartCard({ title, subtitle, stat, loading = false, empty = false, className = '', children, index = 0 }) {
  return (
    <motion.div
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5',
        'transition-all duration-300 hover:border-primary/25 hover:shadow-pop',
        className,
      )}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: 'easeOut' }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {stat != null && !loading && (
          <p className="shrink-0 text-lg font-bold tabular-nums tracking-tight text-card-foreground">{stat}</p>
        )}
      </div>

      <div className="h-64 min-w-0 flex-1">
        {loading ? (
          <div className="flex h-full flex-col justify-end gap-2">
            <div className="flex h-full items-end gap-2">
              {[55, 75, 45, 85, 60, 70, 40, 80].map((h, i) => (
                <Skeleton key={i} className="w-full" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        ) : empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <BarChart3 className="size-7 text-muted-foreground/50" aria-hidden="true" />
            <p className="text-xs text-muted-foreground">No data for the selected filters.</p>
          </div>
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
}
