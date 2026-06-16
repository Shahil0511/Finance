import FiltersToolbar from './FiltersToolbar';
import { TATA_CLIQ_SALES_REPORT } from '../../config/reports';
import { useGetTataCliqSalesFiltersQuery } from '../../features/sales/salesApi';
import { useTataCliqSalesFilterStore } from '../../store/useFilterStore';

export default function TataCliqSalesFiltersPanel() {
  const { filters, setFilters, reset } = useTataCliqSalesFilterStore();
  const { data, isLoading, isError, refetch } = useGetTataCliqSalesFiltersQuery();

  return (
    <FiltersToolbar
      fields={TATA_CLIQ_SALES_REPORT.filters}
      applied={filters}
      setFilters={setFilters}
      onClear={() => { reset(); return useTataCliqSalesFilterStore.getState().filters; }}
      options={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
    />
  );
}
