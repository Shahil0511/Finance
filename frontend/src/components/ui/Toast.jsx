import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { removeNotification, selectNotifications } from '../../features/notifications/notificationsSlice';
import { cn } from '../../lib/cn';

const STYLES = {
  success: { icon: CheckCircle2, chip: 'bg-success/10 text-success' },
  error:   { icon: XCircle,      chip: 'bg-destructive/10 text-destructive' },
  info:    { icon: Info,         chip: 'bg-primary/10 text-primary' },
};

function ToastItem({ id, type = 'info', message, duration = 4000 }) {
  const dispatch = useDispatch();
  const close = () => dispatch(removeNotification(id));
  const { icon: Icon, chip } = STYLES[type] ?? STYLES.info;

  useEffect(() => {
    const t = setTimeout(() => dispatch(removeNotification(id)), duration);
    return () => clearTimeout(t);
  }, [dispatch, id, duration]);

  return (
    <motion.div
      layout
      role={type === 'error' ? 'alert' : 'status'}
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-border bg-card p-3 pr-2 shadow-pop sm:w-96"
    >
      <span className={cn('mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg', chip)} aria-hidden="true">
        <Icon className="size-4" />
      </span>
      <p className="min-w-0 flex-1 self-center break-words text-sm text-card-foreground">{message}</p>
      <button
        onClick={close}
        aria-label="Dismiss notification"
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </motion.div>
  );
}

export default function ToastContainer() {
  const items = useSelector(selectNotifications);
  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4"
    >
      <AnimatePresence mode="popLayout">
        {items.map((n) => <ToastItem key={n.id} {...n} />)}
      </AnimatePresence>
    </div>
  );
}
