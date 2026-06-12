import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { useThemeStore } from './store/useThemeStore';
import { REPORTS } from './config/reports';
import ReportPage from './pages/ReportPage';

export default function App() {
  const initTheme = useThemeStore((s) => s.initTheme);
  useEffect(() => { initTheme(); }, [initTheme]);

  return (
    // reducedMotion="user" disables framer animations for prefers-reduced-motion.
    <MotionConfig reducedMotion="user">
      <Routes>
        {REPORTS.map((report) => (
          /* key on the element remounts the page between reports so the
             config-bound hooks never change identity within a mount. */
          <Route key={report.key} path={report.path} element={<ReportPage key={report.key} report={report} />} />
        ))}
        <Route path="*" element={<Navigate to="/sales" replace />} />
      </Routes>
    </MotionConfig>
  );
}
