import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

const BASE =
  'inline-flex items-center justify-center gap-1.5 font-medium rounded-lg whitespace-nowrap select-none ' +
  'transition-all duration-200 active:scale-[0.98] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
  'disabled:opacity-50 disabled:pointer-events-none';

const VARIANTS = {
  primary:     'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-600/25 hover:from-blue-500 hover:to-indigo-600 hover:shadow-lg hover:shadow-blue-600/30',
  secondary:   'bg-accent text-accent-foreground hover:bg-accent/70',
  outline:     'border border-border bg-card text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground',
  ghost:       'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
};

/* 44px touch targets on mobile, compact on desktop. */
const SIZES = {
  sm:        'h-9 px-3 text-xs',
  md:        'h-11 sm:h-10 px-4 text-sm',
  lg:        'h-12 sm:h-11 px-5 text-sm',
  icon:      'h-11 w-11 sm:h-10 sm:w-10',
  'icon-sm': 'h-9 w-9',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(BASE, VARIANTS[variant] ?? VARIANTS.primary, SIZES[size] ?? SIZES.md, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
