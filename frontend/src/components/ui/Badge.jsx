import { cn } from '../../lib/cn';

const VARIANTS = {
  default: 'bg-muted text-muted-foreground',
  info:    'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning',
  error:   'bg-destructive/10 text-destructive',
  outline: 'border border-border text-muted-foreground',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium',
        VARIANTS[variant] ?? VARIANTS.default,
        className,
      )}
    >
      {children}
    </span>
  );
}
