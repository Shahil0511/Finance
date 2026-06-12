const VARIANTS = {
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
  error:   'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
  info:    'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  default: 'bg-slate-100  text-slate-600  dark:bg-slate-700     dark:text-slate-300',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${VARIANTS[variant] ?? VARIANTS.default} ${className}`}>
      {children}
    </span>
  );
}
