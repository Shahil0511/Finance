import { useState } from 'react';
import { DesktopSidebar, MobileSidebar } from './Sidebar';
import Topbar from './Topbar';
import ToastContainer from '../ui/Toast';

/** Dashboard shell: fixed dark sidebar (drawer on mobile) + topbar + content. */
export default function Layout({ title, children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <DesktopSidebar />
      <MobileSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex min-h-screen flex-col lg:pl-64">
        <Topbar title={title} onMenu={() => setMenuOpen(true)} />
        <main id="main" className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
