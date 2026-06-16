import FiltersToolbar from './FiltersToolbar';
import { SALES_REPORT } from '../../config/reports';
import { useGetSalesFiltersQuery } from '../../features/sales/salesApi';
import { useSalesFilterStore } from '../../store/useFilterStore';

export default function SalesFiltersPanel() {
  const { filters, setFilters, reset } = useSalesFilterStore();
  const { data, isLoading, isError, refetch } = useGetSalesFiltersQuery();

  return (
    <FiltersToolbar
      fields={SALES_REPORT.filters}
      applied={filters}
      setFilters={setFilters}
      onClear={() => { reset(); return useSalesFilterStore.getState().filters; }}
      options={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
    />
  );
}
