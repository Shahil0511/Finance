import { motion, AnimatePresence } from 'framer-motion';
import useLoadingMessage from '../../hooks/useLoadingMessage';

/** Animated dots + rotating long-query message while a report loads. */
export default function LoadingBanner({ className = '' }) {
  const { message } = useLoadingMessage();

  return (
    <div className={`flex items-center gap-2.5 ${className}`} role="status">
      <span className="flex items-center gap-[3px]" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block size-1.5 rounded-full bg-primary"
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.75, 1, 0.75] }}
            transition={{ duration: 1.35, repeat: Infinity, delay: i * 0.22, ease: 'easeInOut' }}
          />
        ))}
      </span>

      <AnimatePresence mode="wait">
        <motion.span
          key={message}
          className="select-none text-xs font-medium text-muted-foreground"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.3 }}
        >
          {message}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
