import { cn } from '../../lib/cn';

export function Skeleton({ className = '' }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} aria-hidden="true" />;
}

/** @deprecated legacy alias — use Skeleton (removed once all consumers migrate). */
export const SkeletonBlock = Skeleton;

export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{ width: i === lines - 1 && lines > 1 ? '65%' : '100%' }}
        />
      ))}
    </div>
  );
}

/** Skeleton rows rendered inside the data table body while the first page loads. */
export function SkeletonRows({ rows = 8, cols = 6 }) {
  const widths = ['w-28', 'w-24', 'w-20', 'w-32', 'w-16', 'w-24', 'w-20', 'w-28'];
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={r}>
      {Array.from({ length: cols }).map((_, c) => (
        <td key={c} className="px-3 py-3">
          <Skeleton className={cn('h-3.5', widths[(r + c) % widths.length])} />
        </td>
      ))}
    </tr>
  ));
}
