import { useId } from 'react';
import { Search } from 'lucide-react';
import Select from './Select';
import DatePicker from './DatePicker';
import { cn } from '../../lib/cn';

/* Compact filter fields for the report toolbar. Each control gets a
   useId-associated label, a visible focus ring, and 40px+ mobile targets. */

function Field({ id, label, className = '', children }) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="text-[11px] font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

export function FilterSelect({ label, value, onChange, options = [], placeholder = 'All', disabled, className }) {
  const id = useId();
  return (
    <Field id={id} label={label} className={className}>
      <Select id={id} value={value} onChange={onChange} options={options} placeholder={placeholder} disabled={disabled} />
    </Field>
  );
}

export function FilterDate({ label, value, onChange, disabled, className }) {
  const id = useId();
  return (
    <Field id={id} label={label} className={className}>
      <DatePicker id={id} value={value} onChange={onChange} disabled={disabled} />
    </Field>
  );
}

export function FilterSearch({ label = 'Search', value, onChange, className, ...rest }) {
  const id = useId();
  return (
    <Field id={id} label={label} className={className}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'h-10 w-full rounded-md border border-input bg-card pl-8 pr-2.5 text-[13px] text-foreground sm:h-9',
            'placeholder:text-muted-foreground/70 transition-colors duration-150 hover:border-muted-foreground/40',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent',
          )}
          {...rest}
        />
      </div>
    </Field>
  );
}
