import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { removeNotification, selectNotifications } from '../../features/notifications/notificationsSlice';

const ICONS = {
  success: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  error:   <XCircle    className="w-4 h-4 text-red-500" />,
  info:    <Info       className="w-4 h-4 text-blue-500" />,
};
const BORDER = {
  success: 'border-l-4 border-emerald-500',
  error:   'border-l-4 border-red-500',
  info:    'border-l-4 border-blue-500',
};

function ToastItem({ id, type = 'info', message, duration = 4000 }) {
  const dispatch = useDispatch();
  const close = () => dispatch(removeNotification(id));

  useEffect(() => {
    const t = setTimeout(close, duration);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0,  scale: 1   }}
      exit={{    opacity: 0, x: 80, scale: 0.9  }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`flex items-start gap-3 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-lg px-4 py-3 ${BORDER[type] ?? BORDER.info}`}
    >
      <span className="mt-0.5 shrink-0">{ICONS[type] ?? ICONS.info}</span>
      <p className="flex-1 text-sm text-slate-700 dark:text-slate-200">{message}</p>
      <button onClick={close} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

export default function ToastContainer() {
  const items = useSelector(selectNotifications);
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {items.map((n) => <ToastItem key={n.id} {...n} />)}
      </AnimatePresence>
    </div>
  );
}
