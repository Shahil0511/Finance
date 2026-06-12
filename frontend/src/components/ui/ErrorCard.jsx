import { AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from './Button';

export default function ErrorCard({ message = 'Something went wrong', onRetry, compact = false }) {
  if (compact) {
    return (
      <div
        role="alert"
        className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3"
      >
        <div className="flex min-w-0 items-center gap-2 text-destructive">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate text-sm">{message}</span>
        </div>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive">
            <RefreshCw className="size-3.5" aria-hidden="true" /> Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card py-16 text-center shadow-soft"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10" aria-hidden="true">
        <AlertTriangle className="size-6 text-destructive" />
      </div>
      <div className="px-6">
        <p className="text-sm font-semibold text-foreground">Failed to load data</p>
        <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Retry
        </Button>
      )}
    </motion.div>
  );
}
