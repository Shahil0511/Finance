import { MYNTRA_OMNI_RETURN_REPORT } from '../config/reports';
import { returnsApi, useGetReturnsDataStatusQuery } from '../features/returns/returnsApi';
import { cleanParams, useMyntraOmniReturnsFilterStore } from '../store/useFilterStore';
import { useReportRefresh } from '../hooks/useReportRefresh';
import ReportShell from '../components/reports/ReportShell';
import MyntraOmniReturnsFiltersPanel from '../components/reports/MyntraOmniReturnsFiltersPanel';
import MyntraOmniReturnsSummaryCards from '../components/reports/MyntraOmniReturnsSummaryCards';
import MyntraOmniReturnsReportTable from '../components/reports/MyntraOmniReturnsReportTable';

export default function MyntraOmniReturnsReportPage() {
  const filters = useMyntraOmniReturnsFilterStore((s) => s.filters);
  const { fulfilledTimeStamp, isFetching } = returnsApi.endpoints.getMyntraOmniReturnsList.useQueryState(cleanParams(filters));
  const { data: status } = useGetReturnsDataStatusQuery();
  const { refreshing, refresh } = useReportRefresh(returnsApi, ['Returns'], isFetching);

  return (
    <ReportShell
      title={MYNTRA_OMNI_RETURN_REPORT.title}
      description={MYNTRA_OMNI_RETURN_REPORT.description}
      dateFrom={filters.dateFrom}
      dateTo={filters.dateTo}
      lastDataAt={status?.lastDataAt}
      lastFetchedAt={fulfilledTimeStamp}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <MyntraOmniReturnsFiltersPanel />
      <MyntraOmniReturnsSummaryCards />
      <MyntraOmniReturnsReportTable />
    </ReportShell>
  );
}
