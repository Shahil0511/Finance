import FiltersToolbar from './FiltersToolbar';
import { RETURNS_REPORT } from '../../config/reports';
import { useGetReturnsFiltersQuery } from '../../features/returns/returnsApi';
import { useReturnsFilterStore } from '../../store/useFilterStore';

export default function ReturnsFiltersPanel() {
  const { filters, setFilters, reset } = useReturnsFilterStore();
  const { data, isLoading, isError, refetch } = useGetReturnsFiltersQuery();

  return (
    <FiltersToolbar
      fields={RETURNS_REPORT.filters}
      applied={filters}
      setFilters={setFilters}
      onClear={() => { reset(); return useReturnsFilterStore.getState().filters; }}
      options={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
    />
  );
}
