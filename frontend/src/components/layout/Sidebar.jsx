import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { REPORTS } from '../../config/reports';
import { APP_BASE_PATH } from '../../config/apiBase';
import { cn } from '../../lib/cn';

/* Navigation is derived from the report registry — adding a report adds a link. */
const GROUPS = [...new Set(REPORTS.map((r) => r.group))].map((group) => ({
  group,
  items: REPORTS.filter((r) => r.group === group),
}));

function Brand() {
  return (
    <div className="flex items-center gap-3 px-2">
      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
        <img src={`${APP_BASE_PATH}/libas_animated_favicon.gif`} alt="" className="size-full object-cover" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[15px] font-bold tracking-tight text-white">LIBAS</span>
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-sidebar-muted">Finance Console</span>
      </span>
    </div>
  );
}

function NavItems() {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Reports">
      {GROUPS.map(({ group, items }) => (
        <div key={group}>
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-muted">
            {group}
          </p>
          <div className="space-y-0.5">
            {items.map(({ key, path, title, icon: Icon }) => (
              <NavLink
                key={key}
                to={path}
                className={({ isActive }) =>
                  cn(
                    'group relative flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'text-white'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-lg bg-primary shadow-lg shadow-primary/30"
                        transition={{ type: 'spring', stiffness: 480, damping: 38 }}
                      />
                    )}
                    <Icon className="relative z-10 size-4 shrink-0" aria-hidden="true" />
                    <span className="relative z-10 truncate">{title.replace(' Report', '')}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarBody() {
  return (
    <>
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <Brand />
      </div>
      <NavItems />
      <div className="border-t border-sidebar-border px-5 py-4">
        <p className="text-[11px] font-medium text-sidebar-muted">Internal use only</p>
        <p className="mt-0.5 text-[11px] text-sidebar-muted/70">Daily Sales &amp; Returns</p>
      </div>
    </>
  );
}

/** Fixed dark sidebar on desktop. */
export function DesktopSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <SidebarBody />
    </aside>
  );
}

/** Same sidebar as a left drawer on mobile. */
export function MobileSidebar({ open, onClose }) {
  const closeRef = useRef(null);
  const location = useLocation();

  useEffect(() => { onClose(); }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

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
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
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
            className="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col bg-sidebar shadow-pop lg:hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Close menu"
              className="absolute right-3 top-3.5 z-10 flex size-9 items-center justify-center rounded-lg text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4.5" aria-hidden="true" />
            </button>
            <SidebarBody />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
