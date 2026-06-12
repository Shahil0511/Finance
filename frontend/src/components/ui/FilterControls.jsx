import { useId } from 'react';
import { Info, Search } from 'lucide-react';
import Select from './Select';
import DatePicker from './DatePicker';
import { cn } from '../../lib/cn';

/* Filter fields used by the report FiltersPanel. Each control gets a
   useId-associated <label>, a visible focus ring, and 44px mobile targets.
   Selects and dates are the premium animated components. */

function Field({ id, label, children }) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

export function FilterSelect({ label, value, onChange, options = [], placeholder = 'All', disabled }) {
  const id = useId();
  return (
    <Field id={id} label={label}>
      <Select id={id} value={value} onChange={onChange} options={options} placeholder={placeholder} disabled={disabled} />
    </Field>
  );
}

export function FilterDate({ label, value, onChange, disabled }) {
  const id = useId();
  return (
    <Field id={id} label={label}>
      <DatePicker id={id} value={value} onChange={onChange} disabled={disabled} />
    </Field>
  );
}

export function FilterSearch({ label = 'Search', value, onChange, ...rest }) {
  const id = useId();
  return (
    <Field id={id} label={label}>
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
          className={cn(
            'h-11 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground sm:h-10',
            'placeholder:text-muted-foreground/70 transition-all duration-200 hover:border-muted-foreground/40',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent',
          )}
          {...rest}
        />
      </div>
    </Field>
  );
}

export function DownloadWindowNotice() {
  return (
    <div className="mx-4 mt-4 flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs leading-relaxed text-foreground/90 sm:mx-5">
      <Info className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
      <p>
        Previous month downloads are available through the 2nd day of the current month.
        From the 3rd onward, downloads are limited to the current month.
      </p>
    </div>
  );
}
