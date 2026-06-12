import { NavLink } from 'react-router-dom';
import { NAV_SECTIONS } from './Navbar';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t border-border bg-card/50">
      <div className="mx-auto max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <p className="text-sm font-bold tracking-tight text-foreground">
              LIBAS <span className="font-medium text-muted-foreground">Finance</span>
            </p>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground">
              Internal dashboard for daily Sales &amp; Returns reporting across marketplaces.
              Data refreshes from the warehouse management system.
            </p>
          </div>

          {NAV_SECTIONS.map((section) => (
            <nav key={section.label} aria-label={`${section.label} reports`}>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {section.label}
              </p>
              <ul className="mt-3 space-y-2">
                {section.items.map(({ to, label }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      className="inline-flex min-h-6 items-center rounded text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {year} LIBAS. Internal use only.</p>
          <p>Finance Team · Daily Reports</p>
        </div>
      </div>
    </footer>
  );
}
