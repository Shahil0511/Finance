import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

const BASE =
  'inline-flex items-center justify-center gap-1.5 font-medium rounded-md whitespace-nowrap select-none ' +
  'transition-colors duration-150 active:scale-[0.99] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
  'disabled:opacity-50 disabled:pointer-events-none';

const VARIANTS = {
  primary:     'bg-primary text-primary-foreground shadow-soft hover:bg-primary/90',
  secondary:   'bg-accent text-accent-foreground hover:bg-accent/70',
  outline:     'border border-border bg-card text-foreground shadow-soft hover:bg-accent hover:text-accent-foreground',
  ghost:       'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90',
};

/* Enterprise density on desktop, 40-44px touch targets on mobile. */
const SIZES = {
  sm:        'h-10 sm:h-8 px-3 text-xs',
  md:        'h-11 sm:h-9 px-3.5 text-[13px]',
  lg:        'h-12 sm:h-10 px-4 text-sm',
  icon:      'h-11 w-11 sm:h-9 sm:w-9',
  'icon-sm': 'h-9 w-9 sm:h-8 sm:w-8',
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
