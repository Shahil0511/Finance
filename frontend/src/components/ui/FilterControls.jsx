import { useId } from 'react';
import { Info } from 'lucide-react';

// Shared filter controls — previously copy-pasted into all five FiltersPanels.
// useId gives every control a unique id so the <label> is programmatically
// associated (click-to-focus + screen-reader announcement).

export function FilterSelect({ label, value, onChange, options = [], placeholder = 'All' }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1 min-w-35">
      <label htmlFor={id} className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="input-base py-1.5">
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export function FilterInput({ label, value, onChange, type = 'text', ...rest }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1 min-w-35">
      <label htmlFor={id} className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="input-base py-1.5" {...rest} />
    </div>
  );
}

export function DownloadWindowNotice() {
  return (
    <div className="mx-4 mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
      <p>
        Previous month downloads are available through the 2nd day of the current month. From the 3rd onward, downloads are limited to the current month.
      </p>
    </div>
  );
}
