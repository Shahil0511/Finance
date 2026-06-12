import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { REPORTS } from '../../config/reports';
import { APP_BASE_PATH } from '../../config/apiBase';
import { cn } from '../../lib/cn';

/* The sidebar uses FIXED colors (not theme tokens) so it is pixel-identical
   in light and dark mode — one constant brand anchor. */
const SIDEBAR_BG = 'bg-[linear-gradient(180deg,#0d1430_0%,#0a0f22_45%,#070b18_100%)]';

/* Navigation is derived from the report registry — adding a report adds a link. */
const GROUPS = [...new Set(REPORTS.map((r) => r.group))].map((group) => ({
  group,
  items: REPORTS.filter((r) => r.group === group),
}));

function Brand() {
  return (
    <div className="relative flex items-center gap-3 px-2">
      <span
        className="pointer-events-none absolute -left-2 -top-4 size-20 rounded-full bg-blue-500/20 blur-2xl"
        aria-hidden="true"
      />
      <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/40 ring-1 ring-white/15">
        <img src={`${APP_BASE_PATH}/libas_animated_favicon.gif`} alt="" className="size-full object-cover" />
      </span>
      <span className="relative flex flex-col leading-tight">
        <span className="text-base font-extrabold tracking-tight text-white">LIBAS</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Finance Console</span>
      </span>
    </div>
  );
}

function NavItems() {
  return (
    <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-6" aria-label="Reports">
      {GROUPS.map(({ group, items }) => (
        <div key={group}>
          <p className="px-3 pb-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
            {group}
          </p>
          <div className="space-y-1">
            {items.map(({ key, path, title, icon: Icon }) => (
              <NavLink
                key={key}
                to={path}
                className={({ isActive }) =>
                  cn(
                    'group relative flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:bg-white/[0.06] hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/40"
                        transition={{ type: 'spring', stiffness: 480, damping: 38 }}
                      />
                    )}
                    <Icon
                      className={cn(
                        'relative z-10 size-4 shrink-0 transition-transform duration-200',
                        !isActive && 'group-hover:scale-110',
                      )}
                      aria-hidden="true"
                    />
                    <span className="relative z-10 truncate">{title.replace(' Report', '')}</span>
                    {isActive && (
                      <span className="relative z-10 ml-auto size-1.5 rounded-full bg-white/80" aria-hidden="true" />
                    )}
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
      <div className="flex h-16 items-center border-b border-white/[0.06] px-4">
        <Brand />
      </div>
      <NavItems />
      <div className="border-t border-white/[0.06] px-6 py-4">
        <p className="text-[11px] font-semibold text-slate-400">Internal use only</p>
        <p className="mt-0.5 text-[11px] text-slate-500">Daily Sales &amp; Returns</p>
      </div>
    </>
  );
}

/** Fixed gradient sidebar on desktop — identical in both themes. */
export function DesktopSidebar() {
  return (
    <aside className={cn('fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-white/[0.06] lg:flex', SIDEBAR_BG)}>
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
            className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm lg:hidden"
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
            className={cn('fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[85vw] flex-col shadow-pop lg:hidden', SIDEBAR_BG)}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Close menu"
              className="absolute right-3 top-3.5 z-10 flex size-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
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
