import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';
import { Skeleton } from './Skeleton';

/* Solid gradient icon chips + a soft matching corner glow per tone. */
const CHIPS = {
  primary:     'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30',
  success:     'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30',
  warning:     'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/30',
  destructive: 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/30',
  violet:      'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/30',
  cyan:        'bg-gradient-to-br from-cyan-400 to-sky-600 shadow-cyan-500/30',
};

const GLOWS = {
  primary:     'bg-blue-500/20',
  success:     'bg-emerald-500/20',
  warning:     'bg-amber-500/20',
  destructive: 'bg-rose-500/20',
  violet:      'bg-violet-500/20',
  cyan:        'bg-cyan-500/20',
};

/** KPI tile for the report summary strip. */
export default function StatCard({ label, value, icon: Icon, tone = 'primary', loading = false, index = 0 }) {
  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-soft transition-shadow hover:shadow-pop sm:p-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
    >
      <div
        className={cn(
          'pointer-events-none absolute -right-8 -top-8 size-28 rounded-full blur-2xl transition-opacity duration-300 opacity-60 group-hover:opacity-100',
          GLOWS[tone] ?? GLOWS.primary,
        )}
        aria-hidden="true"
      />

      <div className="relative flex items-center gap-3">
        {Icon && (
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-lg transition-transform duration-200 group-hover:scale-110',
              CHIPS[tone] ?? CHIPS.primary,
            )}
            aria-hidden="true"
          >
            <Icon className="size-5" />
          </span>
        )}
        <span className="text-xs font-medium leading-snug text-muted-foreground">{label}</span>
      </div>

      {loading ? (
        <Skeleton className="relative mt-4 h-8 w-28" />
      ) : (
        <p className="relative mt-3 text-2xl font-bold tabular-nums tracking-tight text-card-foreground sm:text-[28px]">
          {value}
        </p>
      )}
    </motion.div>
  );
}
