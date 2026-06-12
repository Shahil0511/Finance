import { AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ErrorCard({ message = 'Something went wrong', onRetry, compact = false }) {
  if (compact) {
    return (
      <div className="card flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-sm">{message}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      className="card flex flex-col items-center justify-center gap-4 py-16 text-center"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30">
        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Failed to load data</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-outline flex items-center gap-1.5 text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </motion.div>
  );
}
