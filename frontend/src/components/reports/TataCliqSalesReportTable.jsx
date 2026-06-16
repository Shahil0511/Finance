import { Download } from 'lucide-react';
import DataTable from '../shared/DataTable';
import Button from '../ui/Button';
import { TATA_CLIQ_SALES_REPORT } from '../../config/reports';
import { useGetTataCliqSalesListQuery } from '../../features/sales/salesApi';
import { cleanParams, useTataCliqSalesFilterStore } from '../../store/useFilterStore';
import { useCsvExport } from '../../hooks/useCsvExport';

export default function TataCliqSalesReportTable() {
  const { filters, setPage, setSort, setFilters } = useTataCliqSalesFilterStore();
  const params = cleanParams(filters);
  const { data: res, isLoading, isFetching, isError, error, refetch } = useGetTataCliqSalesListQuery(params);
  const { exportCsv, exporting } = useCsvExport();

  const actions = TATA_CLIQ_SALES_REPORT.exports.map((exp) => (
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
      title={TATA_CLIQ_SALES_REPORT.tableTitle}
      columns={TATA_CLIQ_SALES_REPORT.columns}
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
      rowKey={TATA_CLIQ_SALES_REPORT.rowKey}
    />
  );
}
