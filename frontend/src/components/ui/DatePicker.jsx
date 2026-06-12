import { Suspense, lazy, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Loader2 } from 'lucide-react';
import 'react-day-picker/style.css';
import { useAnchoredPopover } from '../../hooks/useAnchoredPopover';
import { cn } from '../../lib/cn';

// react-day-picker (+date-fns) is ~100kB — load it on first open, not upfront.
const DayPicker = lazy(() =>
  import('react-day-picker').then((m) => ({ default: m.DayPicker })),
);

const pad = (n) => String(n).padStart(2, '0');
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromStr = (s) => (s ? new Date(`${s}T00:00:00`) : undefined);

const display = (s) =>
  s
    ? new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Pick a date';

/** Premium calendar field: token-themed react-day-picker in a portal-rendered
    spring popover (never clipped), replacing the OS <input type="date">.
    Value in/out is a YYYY-MM-DD string. */
export default function DatePicker({ value, onChange, id, disabled = false }) {
  const [open, setOpen] = useState(false);
  const selected = fromStr(value);

  const { triggerRef, popRef, style, placement, onClose } = useAnchoredPopover(open, {
    estHeight: 360,
  });
  onClose.current = () => setOpen(false);

  return (
    <div ref={triggerRef}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'flex h-11 w-full items-center gap-2.5 rounded-lg border bg-card px-3 text-sm sm:h-10',
          'transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          open ? 'border-primary/60 ring-2 ring-primary/20' : 'border-input hover:border-muted-foreground/40',
        )}
      >
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className={cn('truncate', value ? 'text-foreground' : 'text-muted-foreground/80')}>
          {display(value)}
        </span>
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={popRef}
              style={style}
              role="dialog"
              aria-label="Choose date"
              initial={{ opacity: 0, y: placement === 'top' ? 6 : -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: placement === 'top' ? 6 : -6, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 480, damping: 32, mass: 0.6 }}
              className={cn(
                'rounded-xl border border-border bg-card p-3 shadow-pop',
                placement === 'top' ? 'origin-bottom' : 'origin-top',
              )}
            >
              <Suspense
                fallback={
                  <div className="grid h-[316px] w-[266px] place-items-center">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
                  </div>
                }
              >
                <DayPicker
                  mode="single"
                  selected={selected}
                  defaultMonth={selected}
                  onSelect={(day) => {
                    if (day) onChange(toStr(day));
                    setOpen(false);
                  }}
                  showOutsideDays
                  weekStartsOn={1}
                />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
