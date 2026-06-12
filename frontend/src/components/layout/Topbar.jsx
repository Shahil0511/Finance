import { Menu } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';

/** Slim sticky bar above the content: mobile menu, breadcrumb, theme toggle. */
export default function Topbar({ title, onMenu }) {
  return (
    <header className="sticky top-0 z-30 bg-background/75 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onMenu}
          aria-label="Open menu"
          className="flex size-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>

        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex items-center gap-2 text-sm">
            <li className="hidden text-muted-foreground sm:block">Reports</li>
            <li className="hidden text-muted-foreground/40 sm:block" aria-hidden="true">/</li>
            <li
              className="truncate rounded-lg bg-primary/10 px-2.5 py-1 text-[13px] font-semibold text-primary"
              aria-current="page"
            >
              {title}
            </li>
          </ol>
        </nav>

        <div className="flex-1" />
        <ThemeToggle />
      </div>
      {/* Gradient hairline instead of a flat border. */}
      <div
        className="h-px bg-gradient-to-r from-transparent via-border to-transparent"
        aria-hidden="true"
      />
    </header>
  );
}
