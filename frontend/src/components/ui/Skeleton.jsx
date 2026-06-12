import { motion } from 'framer-motion';
import LoadingBanner from './LoadingBanner';

export function SkeletonBlock({ className = '' }) {
  return <div className={`skeleton-block ${className}`} />;
}

export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton-block h-3"
          style={{ width: i === lines - 1 && lines > 1 ? '65%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card p-5 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-8 w-8 rounded-lg" />
      </div>
      <SkeletonBlock className="h-7 w-32" />
      <SkeletonBlock className="h-3 w-20" />
    </div>
  );
}

export function SkeletonTable({ rows = 8, cols = 6 }) {
  const colWidths = ['w-28', 'w-24', 'w-20', 'w-32', 'w-16', 'w-24', 'w-20', 'w-28'];
  return (
    <div className="card overflow-hidden relative">
      {/* Indeterminate progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden rounded-t-xl">
        <motion.div
          className="h-full bg-brand-500"
          style={{ width: '45%' }}
          animate={{ x: ['-120%', '260%'] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
        />
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <LoadingBanner />
        <SkeletonBlock className="h-8 w-28 rounded-lg" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-3 py-3">
                  <SkeletonBlock className={`h-3 ${colWidths[i % colWidths.length]}`} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="border-t border-slate-100 dark:border-slate-800/60">
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="px-3 py-2.5">
                    <SkeletonBlock className={`h-3 ${colWidths[c % colWidths.length]}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800">
        <SkeletonBlock className="h-7 w-40 rounded-lg" />
        <SkeletonBlock className="h-7 w-32 rounded-lg" />
      </div>
    </div>
  );
}
