import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Search } from 'lucide-react';
import { useAnchoredPopover } from '../../hooks/useAnchoredPopover';
import { cn } from '../../lib/cn';

/** Premium animated select: portal-rendered spring popover (never clipped by
    overflow containers), keyboard navigation, type-to-filter on long lists. */
export default function Select({
  value,
  onChange,
  options = [],
  placeholder = 'All',
  disabled = false,
  id,
  triggerClassName = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  const listRef = useRef(null);
  const searchRef = useRef(null);
  const listboxId = useId();

  const { triggerRef, popRef, style, placement, onClose } = useAnchoredPopover(open, {
    estHeight: 300,
    matchWidth: true,
  });
  onClose.current = () => setOpen(false);

  const searchable = options.length > 10;
  const items = useMemo(() => {
    const all = ['', ...options]; // '' = the "All" option
    if (!query) return all;
    const q = query.toLowerCase();
    return all.filter((o) => o === '' || String(o).toLowerCase().includes(q));
  }, [options, query]);

  // Reset transient state when opening; focus the search box if present.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(items.indexOf(value ?? ''));
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the active option in view.
  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const commit = (option) => {
    onChange(option);
    setOpen(false);
    triggerRef.current?.querySelector('button')?.focus();
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); break;
      case 'ArrowUp': e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); break;
      case 'Home': e.preventDefault(); setActive(0); break;
      case 'End': e.preventDefault(); setActive(items.length - 1); break;
      case 'Enter':
        e.preventDefault();
        if (active >= 0 && items[active] !== undefined) commit(items[active]);
        break;
      default: break;
    }
  };

  return (
    <div ref={triggerRef} onKeyDown={onKeyDown}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        className={cn(
          'flex h-11 w-full items-center justify-between gap-2 rounded-lg border bg-card pl-3 pr-2.5 text-sm sm:h-10',
          'transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          open ? 'border-primary/60 ring-2 ring-primary/20' : 'border-input hover:border-muted-foreground/40',
          triggerClassName,
        )}
      >
        <span className={cn('truncate text-left', value ? 'text-foreground' : 'text-muted-foreground/80')}>
          {value || placeholder}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }} className="flex shrink-0">
          <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
        </motion.span>
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={popRef}
              style={style}
              onKeyDown={onKeyDown}
              initial={{ opacity: 0, y: placement === 'top' ? 6 : -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: placement === 'top' ? 6 : -6, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 500, damping: 34, mass: 0.6 }}
              className={cn(
                'overflow-hidden rounded-xl border border-border bg-card shadow-pop',
                placement === 'top' ? 'origin-bottom' : 'origin-top',
              )}
            >
              {searchable && (
                <div className="relative border-b border-border p-1.5">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                    placeholder="Type to filter…"
                    aria-label="Filter options"
                    className="h-9 w-full rounded-lg bg-accent/60 pl-8 pr-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                  />
                </div>
              )}
              <ul ref={listRef} id={listboxId} role="listbox" className="max-h-60 overflow-y-auto p-1.5" tabIndex={-1}>
                {items.length === 0 && (
                  <li className="px-3 py-6 text-center text-xs text-muted-foreground">No matches</li>
                )}
                {items.map((option, i) => {
                  const selected = (value ?? '') === option;
                  return (
                    <li
                      key={option === '' ? '__all__' : option}
                      role="option"
                      aria-selected={selected}
                      data-index={i}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => commit(option)}
                      className={cn(
                        'flex min-h-9 cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors duration-100',
                        active === i ? 'bg-accent text-accent-foreground' : 'text-foreground/90',
                        selected && 'font-medium text-primary',
                      )}
                    >
                      <span className="truncate">{option === '' ? placeholder : option}</span>
                      {selected && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
