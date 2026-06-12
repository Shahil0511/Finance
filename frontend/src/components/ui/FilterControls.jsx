import { useId } from 'react';
import { ChevronDown, Info, Search } from 'lucide-react';
import { cn } from '../../lib/cn';

/* Shared filter controls. Every control gets a useId-associated <label>
   (click-to-focus + screen-reader name), a visible focus ring, an optional
   inline error, and a 44px touch target on mobile (h-11 → sm:h-10). */

const CONTROL =
  'w-full h-11 sm:h-10 rounded-lg border bg-card text-sm text-foreground ' +
  'placeholder:text-muted-foreground/70 transition-colors ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

function Field({ id, label, error, children }) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function FilterSelect({ label, value, onChange, options = [], placeholder = 'All', error, disabled }) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error}>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(CONTROL, 'appearance-none pl-3 pr-9', error ? 'border-destructive' : 'border-input')}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    </Field>
  );
}

export function FilterInput({ label, value, onChange, type = 'text', error, ...rest }) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(CONTROL, 'px-3', error ? 'border-destructive' : 'border-input', type === 'date' && 'min-w-0')}
        {...rest}
      />
    </Field>
  );
}

export function FilterSearch({ label = 'Search', value, onChange, error, ...rest }) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(CONTROL, 'pl-9 pr-3', error ? 'border-destructive' : 'border-input')}
          {...rest}
        />
      </div>
    </Field>
  );
}

export function DownloadWindowNotice() {
  return (
    <div className="mx-4 mt-4 flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs leading-relaxed text-foreground/90">
      <Info className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
      <p>
        Previous month downloads are available through the 2nd day of the current month.
        From the 3rd onward, downloads are limited to the current month.
      </p>
    </div>
  );
}
