import { NavLink } from 'react-router-dom';
import { TrendingUp, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from '../ui/ThemeToggle';
import { APP_BASE_PATH } from '../../config/apiBase';

const NAV_LINKS = [
  { to: '/sales',   label: 'Sales Report',   Icon: TrendingUp },
  { to: '/tata-cliq-sales', label: 'Tata Cliq Sales', Icon: TrendingUp },
  { to: '/returns', label: 'Returns Report',  Icon: RotateCcw  },
  { to: '/tata-cliq-return', label: 'Tata Cliq Return', Icon: RotateCcw },
  { to: '/myntra-omni-return', label: 'Myntra Omni Return', Icon: RotateCcw },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 flex items-center h-14 gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-600 overflow-hidden">
            <img
              src={`${APP_BASE_PATH}/libas_animated_favicon.gif`}
              alt="Finance Logo"
              className="w-full h-full object-cover"
            />
          </div>

          <span className="hidden sm:block font-semibold text-sm text-slate-800 dark:text-slate-100">
            Finance
          </span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-700" />

        {/* Tab navigation */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                 ${
                   isActive
                     ? "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20"
                     : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-lg bg-brand-50 dark:bg-brand-900/20 -z-10"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
