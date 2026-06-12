import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';
import { Skeleton } from './Skeleton';

/* Bright tone accent on the left edge + matching icon. */
const ACCENTS = {
  primary:     'before:bg-indigo-500',
  success:     'before:bg-emerald-500',
  warning:     'before:bg-amber-500',
  destructive: 'before:bg-rose-500',
  violet:      'before:bg-violet-500',
  cyan:        'before:bg-cyan-500',
};

const ICONS = {
  primary:     'text-indigo-500',
  success:     'text-emerald-500',
  warning:     'text-amber-500',
  destructive: 'text-rose-500',
  violet:      'text-violet-500',
  cyan:        'text-cyan-500',
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
