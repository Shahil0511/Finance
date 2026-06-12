import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';
import { Skeleton } from './Skeleton';

/* Thin tone accent on the left edge — classic finance-tile treatment. */
const ACCENTS = {
  primary:     'before:bg-primary',
  success:     'before:bg-success',
  warning:     'before:bg-warning',
  destructive: 'before:bg-destructive',
  violet:      'before:bg-violet-500',
  cyan:        'before:bg-cyan-600',
};

const ICONS = {
  primary:     'text-primary',
  success:     'text-success',
  warning:     'text-warning',
  destructive: 'text-destructive',
  violet:      'text-violet-500',
  cyan:        'text-cyan-600',
};

/** Enterprise KPI tile: uppercase label, tabular value, muted icon, flat card. */
export default function StatCard({ label, value, icon: Icon, tone = 'primary', loading = false, index = 0 }) {
  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-lg border border-border bg-card p-4 shadow-soft',
        'before:absolute before:inset-y-0 before:left-0 before:w-[3px]',
        ACCENTS[tone] ?? ACCENTS.primary,
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {Icon && <Icon className={cn('size-4 shrink-0 opacity-80', ICONS[tone] ?? ICONS.primary)} aria-hidden="true" />}
      </div>
      {loading ? (
        <Skeleton className="mt-2.5 h-7 w-28" />
      ) : (
        <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-card-foreground">
          {value}
        </p>
      )}
    </motion.div>
  );
}
