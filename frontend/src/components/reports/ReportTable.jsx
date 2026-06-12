import { Download } from 'lucide-react';
import DataTable from '../shared/DataTable';
import Button from '../ui/Button';
import { useCsvExport } from '../../hooks/useCsvExport';
import { cleanParams } from '../../store/useFilterStore';

/** Config-driven table glue — binds a report's store + list query + exports
    to the presentational DataTable. One component for every report.        */
export default function ReportTable({ report }) {
  const { filters, setPage, setSort } = report.store();
  const { useList } = report.api;
  const params = cleanParams(filters);
  const { data: res, isLoading, isFetching, isError, error, refetch } = useList(params);
  const { exportCsv, exporting } = useCsvExport();

  const actions = report.exports.map((exp) => (
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
      title={report.tableTitle}
      columns={report.columns}
      data={res?.data ?? []}
      pagination={res?.pagination ?? {}}
      sortBy={filters.sortBy}
      sortDir={filters.sortDir}
      onSort={setSort}
      onPage={setPage}
      onPageSize={(pageSize) => report.store.getState().setFilters({ pageSize })}
      actions={actions}
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      error={error}
      onRetry={refetch}
      executionTimeMs={res?.executionTimeMs}
      rowKey={report.rowKey}
    />
  );
}
