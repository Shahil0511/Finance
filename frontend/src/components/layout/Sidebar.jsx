import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { REPORTS } from '../../config/reports';
import { APP_BASE_PATH } from '../../config/apiBase';
import { cn } from '../../lib/cn';

/* Enterprise sidebar: flat neutral charcoal, FIXED colors (not theme tokens)
   so it is identical in light and dark mode. No gradients, no glows —
   structure comes from hairlines, weight and a single accent bar. */
const SIDEBAR = {
  bg: 'bg-[#17171a]',
  border: 'border-[#26262b]',
  item: 'text-[#9b9ba3] hover:bg-white/[0.05] hover:text-[#e4e4e8]',
  itemActive: 'text-white',
  label: 'text-[#5d5d66]',
  metaTitle: 'text-[#8a8a93]',
  meta: 'text-[#5d5d66]',
};

/* Navigation is derived from the report registry — adding a report adds a link. */
const GROUPS = [...new Set(REPORTS.map((r) => r.group))].map((group) => ({
  group,
  items: REPORTS.filter((r) => r.group === group),
}));

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/30 ring-1 ring-white/15">
        <img src={`${APP_BASE_PATH}/libas_animated_favicon.gif`} alt="" className="size-full object-cover" />
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-[13px] font-semibold tracking-tight text-white">LIBAS Finance</span>
        <span className={cn('truncate text-[10px] font-medium uppercase tracking-[0.14em]', SIDEBAR.meta)}>
          Sales &amp; Returns
        </span>
      </span>
    </div>
  );
}

function NavItems() {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Reports">
      {GROUPS.map(({ group, items }) => (
        <div key={group}>
          <p className={cn('px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em]', SIDEBAR.label)}>
            {group}
          </p>
          <div className="space-y-px">
            {items.map(({ key, path, title, icon: Icon }) => (
              <NavLink
                key={key}
                to={path}
                className={({ isActive }) =>
                  cn(
                    'relative flex min-h-9 items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
                    isActive ? cn(SIDEBAR.itemActive, 'font-medium') : SIDEBAR.item,
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 rounded-md bg-gradient-to-r from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30"
                        transition={{ type: 'spring', stiffness: 480, damping: 40 }}
                        aria-hidden="true"
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
      <div className={cn('flex h-14 items-center border-b px-4', SIDEBAR.border)}>
        <Brand />
      </div>
      <NavItems />
      <div className={cn('border-t px-4 py-3', SIDEBAR.border)}>
        <div className="flex items-center justify-between">
          <p className={cn('text-[11px] font-medium', SIDEBAR.metaTitle)}>Internal use only</p>
          <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-[#8a8a93]">
            PROD
          </span>
        </div>
      </div>
    </>
  );
}

/** Fixed flat sidebar on desktop — identical in both themes. */
export function DesktopSidebar() {
  return (
    <aside className={cn('fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r lg:flex', SIDEBAR.bg, SIDEBAR.border)}>
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
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className={cn('fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col border-r shadow-pop lg:hidden', SIDEBAR.bg, SIDEBAR.border)}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          >
            <button
              ref={closeRef}
              onClick={onClose}
              aria-label="Close menu"
              className="absolute right-2.5 top-2.5 z-10 flex size-9 items-center justify-center rounded-md text-[#9b9ba3] transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
            <SidebarBody />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
