import { Suspense, lazy } from 'react';
import { SALES_REPORT } from '../config/reports';
import { salesApi, useGetSalesDataStatusQuery } from '../features/sales/salesApi';
import { cleanParams, useSalesFilterStore } from '../store/useFilterStore';
import { useReportRefresh } from '../hooks/useReportRefresh';
import ReportShell, { ChartsFallback } from '../components/reports/ReportShell';
import SalesFiltersPanel from '../components/reports/SalesFiltersPanel';
import SalesSummaryCards from '../components/reports/SalesSummaryCards';
import SalesReportTable from '../components/reports/SalesReportTable';

const SalesChartsPanel = lazy(() => import('../components/reports/SalesChartsPanel'));

export default function SalesReportPage() {
  const filters = useSalesFilterStore((s) => s.filters);
  const { fulfilledTimeStamp, isFetching } = salesApi.endpoints.getSalesList.useQueryState(cleanParams(filters));
  const { data: status } = useGetSalesDataStatusQuery();
  const { refreshing, refresh } = useReportRefresh(salesApi, ['Sales'], isFetching);

  return (
    <ReportShell
      title={SALES_REPORT.title}
      description={SALES_REPORT.description}
      dateFrom={filters.dateFrom}
      dateTo={filters.dateTo}
      lastDataAt={status?.lastDataAt}
      lastFetchedAt={fulfilledTimeStamp}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <SalesFiltersPanel />
      <SalesSummaryCards />
      <Suspense fallback={<ChartsFallback />}>
        <SalesChartsPanel />
      </Suspense>
      <SalesReportTable />
    </ReportShell>
  );
}
