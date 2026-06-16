import { Download } from 'lucide-react';
import DataTable from '../shared/DataTable';
import Button from '../ui/Button';
import { SALES_REPORT } from '../../config/reports';
import { useGetSalesListQuery } from '../../features/sales/salesApi';
import { cleanParams, useSalesFilterStore } from '../../store/useFilterStore';
import { useCsvExport } from '../../hooks/useCsvExport';

export default function SalesReportTable() {
  const { filters, setPage, setSort, setFilters } = useSalesFilterStore();
  const params = cleanParams(filters);
  const { data: res, isLoading, isFetching, isError, error, refetch } = useGetSalesListQuery(params);
  const { exportCsv, exporting } = useCsvExport();

  const actions = SALES_REPORT.exports.map((exp) => (
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
      title={SALES_REPORT.tableTitle}
      columns={SALES_REPORT.columns}
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
      rowKey={SALES_REPORT.rowKey}
    />
  );
}
