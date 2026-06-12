import { Inbox } from 'lucide-react';

/** Friendly no-data view for tables and panels. */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'Try widening the date range or clearing some filters.',
  action = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted" aria-hidden="true">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
