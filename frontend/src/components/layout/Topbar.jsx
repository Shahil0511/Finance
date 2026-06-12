import { Menu } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';

/** Flat enterprise topbar: mobile menu, breadcrumb path, theme toggle. */
export default function Topbar({ title, onMenu }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card">
      <div className="flex h-12 items-center gap-3 px-4 sm:px-6">
        <button
          onClick={onMenu}
          aria-label="Open menu"
          className="flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <Menu className="size-4.5" aria-hidden="true" />
        </button>

        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex items-center gap-1.5 text-[13px]">
            <li className="hidden text-muted-foreground sm:block">Reports</li>
            <li className="hidden text-muted-foreground/50 sm:block" aria-hidden="true">/</li>
            <li className="truncate font-medium text-foreground" aria-current="page">{title}</li>
          </ol>
        </nav>

        <div className="flex-1" />
        <ThemeToggle />
      </div>
    </header>
  );
}
