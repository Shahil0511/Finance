import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../../store/useThemeStore';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="relative flex items-center w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
      style={{ backgroundColor: isDark ? '#3b82f6' : '#e2e8f0' }}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute flex items-center justify-center w-5 h-5 bg-white rounded-full shadow-sm"
        style={{ left: isDark ? '26px' : '2px' }}
      >
        {isDark
          ? <Moon className="w-3 h-3 text-brand-600" />
          : <Sun  className="w-3 h-3 text-amber-500" />}
      </motion.span>
    </button>
  );
}
