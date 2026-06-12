import Navbar       from './Navbar';
import ToastContainer from '../ui/Toast';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
      <ToastContainer />
    </div>
  );
}
