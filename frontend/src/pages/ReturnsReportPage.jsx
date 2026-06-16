import { Suspense, lazy } from 'react';
import { RETURNS_REPORT } from '../config/reports';
import { returnsApi, useGetReturnsDataStatusQuery } from '../features/returns/returnsApi';
import { cleanParams, useReturnsFilterStore } from '../store/useFilterStore';
import { useReportRefresh } from '../hooks/useReportRefresh';
import ReportShell, { ChartsFallback } from '../components/reports/ReportShell';
import ReturnsFiltersPanel from '../components/reports/ReturnsFiltersPanel';
import ReturnsSummaryCards from '../components/reports/ReturnsSummaryCards';
import ReturnsReportTable from '../components/reports/ReturnsReportTable';

const ReturnsChartsPanel = lazy(() => import('../components/reports/ReturnsChartsPanel'));

export default function ReturnsReportPage() {
  const filters = useReturnsFilterStore((s) => s.filters);
  const { fulfilledTimeStamp, isFetching } = returnsApi.endpoints.getReturnsList.useQueryState(cleanParams(filters));
  const { data: status } = useGetReturnsDataStatusQuery();
  const { refreshing, refresh } = useReportRefresh(returnsApi, ['Returns'], isFetching);

  return (
    <ReportShell
      title={RETURNS_REPORT.title}
      description={RETURNS_REPORT.description}
      dateFrom={filters.dateFrom}
      dateTo={filters.dateTo}
      lastDataAt={status?.lastDataAt}
      lastFetchedAt={fulfilledTimeStamp}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <ReturnsFiltersPanel />
      <ReturnsSummaryCards />
      <Suspense fallback={<ChartsFallback />}>
        <ReturnsChartsPanel />
      </Suspense>
      <ReturnsReportTable />
    </ReportShell>
  );
}
