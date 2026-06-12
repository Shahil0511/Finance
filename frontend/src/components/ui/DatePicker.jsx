import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Loader2 } from 'lucide-react';
import 'react-day-picker/style.css';
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

/** Premium calendar field: token-themed react-day-picker inside a spring
    popover, replacing the OS-default <input type="date">. Value in/out is a
    YYYY-MM-DD string (same contract as the old input). */
export default function DatePicker({ value, onChange, id, disabled = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = fromStr(value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
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

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Choose date"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 480, damping: 32, mass: 0.6 }}
            className="absolute left-0 top-full z-50 mt-1.5 origin-top rounded-xl border border-border bg-card p-3 shadow-pop"
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
      </AnimatePresence>
    </div>
  );
}
