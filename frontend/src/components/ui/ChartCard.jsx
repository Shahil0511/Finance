import { BarChart3 } from 'lucide-react';
import { Skeleton } from './Skeleton';
import { cn } from '../../lib/cn';

/** Flat enterprise chart card: hairline border, compact header, headline stat. */
export default function ChartCard({ title, subtitle, stat, loading = false, empty = false, className = '', children }) {
  return (
    <div className={cn('flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-soft', className)}>
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-card-foreground">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {stat != null && !loading && (
          <p className="shrink-0 text-base font-semibold tabular-nums tracking-tight text-card-foreground">{stat}</p>
        )}
      </div>

      <div className="h-64 min-w-0 flex-1 p-3">
        {loading ? (
          <div className="flex h-full items-end gap-2 px-1 pb-1">
            {[55, 75, 45, 85, 60, 70, 40, 80].map((h, i) => (
              <Skeleton key={i} className="w-full" style={{ height: `${h}%` }} />
            ))}
          </div>
        ) : empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <BarChart3 className="size-6 text-muted-foreground/50" aria-hidden="true" />
            <p className="text-xs text-muted-foreground">No data for the selected filters.</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
