import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { MotionConfig } from 'framer-motion';
import { useThemeStore } from './store/useThemeStore';
import { salesApi } from './features/sales/salesApi';
import { returnsApi } from './features/returns/returnsApi';
import {
  cleanAggParams,
  cleanParams,
  useMyntraOmniReturnsFilterStore,
  useReturnsFilterStore,
  useSalesFilterStore,
  useTataCliqReturnsFilterStore,
  useTataCliqSalesFilterStore,
} from './store/useFilterStore';
import SalesReportPage from './pages/SalesReportPage';
import TataCliqSalesReportPage from './pages/TataCliqSalesReportPage';
import ReturnsReportPage from './pages/ReturnsReportPage';
import TataCliqReturnsReportPage from './pages/TataCliqReturnsReportPage';
import MyntraOmniReturnsReportPage from './pages/MyntraOmniReturnsReportPage';

export default function App() {
  const initTheme = useThemeStore((s) => s.initTheme);
  const dispatch = useDispatch();

  useEffect(() => { initTheme(); }, [initTheme]);

  // The current report loads immediately via its own page. Once the browser is
  // idle, warm every other report's queries in the background so switching tabs
  // is instant (prefetch skips queries already cached, e.g. the current page).
  useEffect(() => {
    const run = () => {
      const salesF = useSalesFilterStore.getState().filters;
      const tataSalesF = useTataCliqSalesFilterStore.getState().filters;
      const returnsF = useReturnsFilterStore.getState().filters;
      const tataRetF = useTataCliqReturnsFilterStore.getState().filters;
      const omniF = useMyntraOmniReturnsFilterStore.getState().filters;

      const p = (api, name, arg) => dispatch(api.util.prefetch(name, arg, {}));

      p(salesApi, 'getSalesList', cleanParams(salesF));
      p(salesApi, 'getSalesSummary', cleanAggParams(salesF));
      p(salesApi, 'getSalesFilters', undefined);
      p(salesApi, 'getSalesAnalytics', cleanAggParams(salesF));
      p(salesApi, 'getSalesDataStatus', undefined);

      p(salesApi, 'getTataCliqSalesList', cleanParams(tataSalesF));
      p(salesApi, 'getTataCliqSalesSummary', cleanAggParams(tataSalesF));
      p(salesApi, 'getTataCliqSalesFilters', undefined);

      p(returnsApi, 'getReturnsList', cleanParams(returnsF));
      p(returnsApi, 'getReturnsSummary', cleanAggParams(returnsF));
      p(returnsApi, 'getReturnsFilters', undefined);
      p(returnsApi, 'getReturnsAnalytics', cleanAggParams(returnsF));
      p(returnsApi, 'getReturnsDataStatus', undefined);

      p(returnsApi, 'getTataCliqReturnsList', cleanParams(tataRetF));
      p(returnsApi, 'getTataCliqReturnsSummary', cleanAggParams(tataRetF));
      p(returnsApi, 'getTataCliqReturnsFilters', undefined);

      p(returnsApi, 'getMyntraOmniReturnsList', cleanParams(omniF));
      p(returnsApi, 'getMyntraOmniReturnsSummary', cleanAggParams(omniF));
      p(returnsApi, 'getMyntraOmniReturnsFilters', undefined);
    };

    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(run, { timeout: 3000 })
      : window.setTimeout(run, 1500);
    return () => {
      if (window.requestIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, [dispatch]);

  return (
    <MotionConfig reducedMotion="user">
      <Routes>
        <Route path="/sales" element={<SalesReportPage />} />
        <Route path="/tata-cliq-sales" element={<TataCliqSalesReportPage />} />
        <Route path="/returns" element={<ReturnsReportPage />} />
        <Route path="/tata-cliq-return" element={<TataCliqReturnsReportPage />} />
        <Route path="/myntra-omni-return" element={<MyntraOmniReturnsReportPage />} />
        <Route path="*" element={<Navigate to="/sales" replace />} />
      </Routes>
    </MotionConfig>
  );
}
