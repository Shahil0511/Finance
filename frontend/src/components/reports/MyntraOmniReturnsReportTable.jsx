import { Download } from 'lucide-react';
import DataTable from '../shared/DataTable';
import Button from '../ui/Button';
import { MYNTRA_OMNI_RETURN_REPORT } from '../../config/reports';
import { useGetMyntraOmniReturnsListQuery } from '../../features/returns/returnsApi';
import { cleanParams, useMyntraOmniReturnsFilterStore } from '../../store/useFilterStore';
import { useCsvExport } from '../../hooks/useCsvExport';

export default function MyntraOmniReturnsReportTable() {
  const { filters, setPage, setSort, setFilters } = useMyntraOmniReturnsFilterStore();
  const params = cleanParams(filters);
  const { data: res, isLoading, isFetching, isError, error, refetch } = useGetMyntraOmniReturnsListQuery(params);
  const { exportCsv, exporting } = useCsvExport();

  const actions = MYNTRA_OMNI_RETURN_REPORT.exports.map((exp) => (
    <Button
      key={exp.endpoint}
      variant="outline"
      size="sm"
      loading={exporting === exp.endpoint}
      disabled={Boolean(exporting) && exporting !== exp.endpoint}
      onClick={() => exportCsv(exp, params)}
    >
      {exporting !== exp.endpoint && <Download className="size-3.5" aria-hidden="true" />}
      {exp.label}
    </Button>
  ));

  return (
    <DataTable
      title={MYNTRA_OMNI_RETURN_REPORT.tableTitle}
      columns={MYNTRA_OMNI_RETURN_REPORT.columns}
      data={res?.data ?? []}
      pagination={res?.pagination ?? {}}
      sortBy={filters.sortBy}
      sortDir={filters.sortDir}
      onSort={setSort}
      onPage={setPage}
      onPageSize={(pageSize) => setFilters({ pageSize })}
      actions={actions}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      error={error}
      onRetry={refetch}
      executionTimeMs={res?.executionTimeMs}
      rowKey={MYNTRA_OMNI_RETURN_REPORT.rowKey}
    />
  );
}
