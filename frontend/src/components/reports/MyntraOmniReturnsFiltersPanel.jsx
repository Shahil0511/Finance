import FiltersToolbar from './FiltersToolbar';
import { MYNTRA_OMNI_RETURN_REPORT } from '../../config/reports';
import { useGetMyntraOmniReturnsFiltersQuery } from '../../features/returns/returnsApi';
import { useMyntraOmniReturnsFilterStore } from '../../store/useFilterStore';

export default function MyntraOmniReturnsFiltersPanel() {
  const { filters, setFilters, reset } = useMyntraOmniReturnsFilterStore();
  const { data, isLoading, isError, refetch } = useGetMyntraOmniReturnsFiltersQuery();

  return (
    <FiltersToolbar
      fields={MYNTRA_OMNI_RETURN_REPORT.filters}
      applied={filters}
      setFilters={setFilters}
      onClear={() => { reset(); return useMyntraOmniReturnsFilterStore.getState().filters; }}
      options={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
    />
  );
}
