import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';
import { Skeleton } from './Skeleton';

const TONES = {
  primary:     'bg-primary/10 text-primary',
  success:     'bg-success/10 text-success',
  warning:     'bg-warning/15 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  violet:      'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  cyan:        'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
};

/** Single KPI tile used by the report summary strip. */
export default function StatCard({ label, value, icon: Icon, tone = 'primary', loading = false, index = 0 }) {
  return (
    <motion.div
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-soft sm:p-5"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium leading-tight text-muted-foreground">{label}</span>
        {Icon && (
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110',
              TONES[tone] ?? TONES.primary,
            )}
            aria-hidden="true"
          >
            <Icon className="size-4" />
          </span>
        )}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-7 w-24" />
      ) : (
        <p className="mt-2 text-xl font-bold tabular-nums tracking-tight text-card-foreground sm:text-2xl">
          {value}
        </p>
      )}
    </motion.div>
  );
}
