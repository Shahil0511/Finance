import { TATA_CLIQ_SALES_REPORT } from '../config/reports';
import { salesApi, useGetSalesDataStatusQuery } from '../features/sales/salesApi';
import { cleanParams, useTataCliqSalesFilterStore } from '../store/useFilterStore';
import { useReportRefresh } from '../hooks/useReportRefresh';
import ReportShell from '../components/reports/ReportShell';
import TataCliqSalesFiltersPanel from '../components/reports/TataCliqSalesFiltersPanel';
import TataCliqSalesSummaryCards from '../components/reports/TataCliqSalesSummaryCards';
import TataCliqSalesReportTable from '../components/reports/TataCliqSalesReportTable';

export default function TataCliqSalesReportPage() {
  const filters = useTataCliqSalesFilterStore((s) => s.filters);
  const { fulfilledTimeStamp, isFetching } = salesApi.endpoints.getTataCliqSalesList.useQueryState(cleanParams(filters));
  const { data: status } = useGetSalesDataStatusQuery();
  const { refreshing, refresh } = useReportRefresh(salesApi, ['Sales'], isFetching);

  return (
    <ReportShell
      title={TATA_CLIQ_SALES_REPORT.title}
      description={TATA_CLIQ_SALES_REPORT.description}
      dateFrom={filters.dateFrom}
      dateTo={filters.dateTo}
      lastDataAt={status?.lastDataAt}
      lastFetchedAt={fulfilledTimeStamp}
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <TataCliqSalesFiltersPanel />
      <TataCliqSalesSummaryCards />
      <TataCliqSalesReportTable />
    </ReportShell>
  );
}
