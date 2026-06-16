import { TATA_CLIQ_RETURN_REPORT } from '../config/reports';
import { returnsApi, useGetReturnsDataStatusQuery } from '../features/returns/returnsApi';
import { cleanParams, useTataCliqReturnsFilterStore } from '../store/useFilterStore';
import { useReportRefresh } from '../hooks/useReportRefresh';
import ReportShell from '../components/reports/ReportShell';
import TataCliqReturnsFiltersPanel from '../components/reports/TataCliqReturnsFiltersPanel';
import TataCliqReturnsSummaryCards from '../components/reports/TataCliqReturnsSummaryCards';
import TataCliqReturnsReportTable from '../components/reports/TataCliqReturnsReportTable';

export default function TataCliqReturnsReportPage() {
  const filters = useTataCliqReturnsFilterStore((s) => s.filters);
  const { fulfilledTimeStamp, isFetching } = returnsApi.endpoints.getTataCliqReturnsList.useQueryState(cleanParams(filters));
  const { data: status } = useGetReturnsDataStatusQuery();
  const { refreshing, refresh } = useReportRefresh(returnsApi, ['Returns'], isFetching);

  return (
    <ReportShell
      title={TATA_CLIQ_RETURN_REPORT.title}
      description={TATA_CLIQ_RETURN_REPORT.description}
      dateFrom={filters.dateFrom}
      dateTo={filters.dateTo}
      lastDataAt={status?.lastDataAt}
      lastFetchedAt={fulfilledTimeStamp}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <TataCliqReturnsFiltersPanel />
      <TataCliqReturnsSummaryCards />
      <TataCliqReturnsReportTable />
    </ReportShell>
  );
}
