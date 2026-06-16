import FiltersToolbar from './FiltersToolbar';
import { TATA_CLIQ_RETURN_REPORT } from '../../config/reports';
import { useGetTataCliqReturnsFiltersQuery } from '../../features/returns/returnsApi';
import { useTataCliqReturnsFilterStore } from '../../store/useFilterStore';

export default function TataCliqReturnsFiltersPanel() {
  const { filters, setFilters, reset } = useTataCliqReturnsFilterStore();
  const { data, isLoading, isError, refetch } = useGetTataCliqReturnsFiltersQuery();

  return (
    <FiltersToolbar
      fields={TATA_CLIQ_RETURN_REPORT.filters}
      applied={filters}
      setFilters={setFilters}
      onClear={() => { reset(); return useTataCliqReturnsFilterStore.getState().filters; }}
      options={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
    />
  );
}
