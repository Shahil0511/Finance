import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useThemeStore }  from './store/useThemeStore';
import SalesReport   from './pages/SalesReport';
import ReturnsReport from './pages/ReturnsReport';
import MyntraOmniReturnsReport from './pages/MyntraOmniReturnsReport';
import TataCliqSalesReport from './pages/TataCliqSalesReport';
import TataCliqReturnsReport from './pages/TataCliqReturnsReport';

export default function App() {
  const initTheme = useThemeStore((s) => s.initTheme);
  useEffect(() => { initTheme(); }, []);

  return (
    <Routes>
      <Route path="/sales" element={<SalesReport />} />
      <Route path="/tata-cliq-sales" element={<TataCliqSalesReport />} />
      <Route path="/returns" element={<ReturnsReport />} />
      <Route path="/tata-cliq-return" element={<TataCliqReturnsReport />} />
      <Route path="/myntra-omni-return" element={<MyntraOmniReturnsReport />} />
      <Route path="*" element={<Navigate to="/sales" replace />} />
    </Routes>
  );
}
