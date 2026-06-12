import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, RotateCcw, TrendingUp, X } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import { APP_BASE_PATH } from '../../config/apiBase';
import { cn } from '../../lib/cn';

export const NAV_SECTIONS = [
  {
    label: 'Sales',
    items: [
      { to: '/sales', label: 'B2C Sales', Icon: TrendingUp },
      { to: '/tata-cliq-sales', label: 'Tata Cliq Sales', Icon: TrendingUp },
    ],
  },
  {
    label: 'Returns',
    items: [
      { to: '/returns', label: 'B2C Returns', Icon: RotateCcw },
      { to: '/tata-cliq-return', label: 'Tata Cliq Returns', Icon: RotateCcw },
      { to: '/myntra-omni-return', label: 'Myntra Omni', Icon: RotateCcw },
    ],
  },
];

const FLAT_LINKS = NAV_SECTIONS.flatMap((s) => s.items);

function Brand() {
  return (
    <NavLink to="/sales" className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="flex size-8 items-center justify-center overflow-hidden rounded-lg bg-primary shadow-sm">
        <img
          src={`${APP_BASE_PATH}/libas_animated_favicon.gif`}
          alt=""
          className="size-full object-cover"
        />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-sm font-bold tracking-tight text-foreground">LIBAS</span>
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Finance</span>
      </span>
    </NavLink>
  );
}

function DesktopNav() {
  return (
    <div className="hidden items-center gap-1 lg:flex" role="navigation" aria-label="Reports">
      {FLAT_LINKS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive ? 'text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className="size-4" aria-hidden="true" />
              <span>{label}</span>
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 -z-10 rounded-lg bg-primary/10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}

function MobileDrawer({ open, onClose }) {
  const closeRef = useRef(null);
  const location = useLocation();

  // Close on navigation.
  useEffect(() => { onClose(); }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // ESC to close + scroll lock + initial focus while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="fixed inset-y-0 right-0 z-50 flex w-[300px] max-w-[85vw] flex-col border-l border-border bg-card shadow-pop lg:hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <Brand />
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="Close menu"
                className="flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3" aria-label="Reports">
              {NAV_SECTIONS.map((section) => (
                <div key={section.label} className="mb-4">
                  <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {section.label}
                  </p>
                  <div className="space-y-1">
                    {section.items.map(({ to, label, Icon }) => (
                      <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                          cn(
                            'flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                          )
                        }
                      >
                        <Icon className="size-4 shrink-0" aria-hidden="true" />
                        {label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="border-t border-border p-4 text-xs text-muted-foreground">
              Internal finance dashboard
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Brand />
        <div className="hidden h-5 w-px bg-border lg:block" aria-hidden="true" />
        <DesktopNav />
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="flex size-11 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
      <MobileDrawer open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
