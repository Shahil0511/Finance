# Performance Notes

## Improvements made in code

- Backend routes are now thin and delegate to controllers, services, and repositories.
- Heavy list endpoints preserve the existing business date window: current month from the 1st, and previous month remains available through the 2nd day of the current month.
- Heavy list endpoints validate `dateFrom`, `dateTo`, `page`, `pageSize`, `sortBy`, and `sortDir`.
- `pageSize` is capped by `MAX_PAGE_SIZE` with a default max of 100.
- Sales list pagination now uses the same `hasMore` strategy as returns, avoiding an expensive blocking total count on every dashboard load.
- API responses keep the existing shape and add metadata such as `executionTimeMs`, `hasMore`, and estimated pagination fields.
- Redis-backed cache is reused for repeated list, summary, and filter requests. Cache keys include normalized query parameters, including date range, pagination, filters, and sort.
- UI defaults preserve the existing business date window for Sales, Returns, and Myntra Omni Return.
- UI filter edits remain local until the user clicks Apply Filters.
- Existing data stays visible during refetch, with a small progress indicator instead of a blocking full table skeleton.
- Empty tables avoid blocking full-page skeletons and keep the dashboard usable while requests run.
- Filter panels warn that large date ranges can take longer because reports join multiple large tables.
- Frontend API requests have a timeout and already use RTK Query request cancellation when query args change or components unmount.

## What still depends on database optimization

- The TL-provided report SQL bodies contain complex joins and some `SELECT *` wrappers. These were intentionally not rewritten because changing them may change finance report correctness.
- Summary endpoints still aggregate over the selected date range. Large custom ranges can remain slow if the source tables are very large.
- Filter option endpoints use `DISTINCT` over source tables. If those columns are not indexed or pre-aggregated, first-load filter option queries can still be expensive.
- CSV exports are still synchronous. Very large exports can hold an HTTP request open for a long time.

## DBA/admin recommendations

These are recommendations only. The app does not attempt to create indexes, tables, views, or materialized data because production access may be read-only.

- Confirm indexes exist on the main date filter columns:
  - `b2c_detail.handover_time`
  - `sales_order_detail.handover_time`
  - `return_order_report_item_level_wms.return_order_processed_time`
- Confirm join/filter columns are indexed where possible:
  - `channel_parent_order_id`
  - `channel_order_id`
  - `client_sku_id_ean`
  - `system_invoice_line_item_id`
  - `sales_channel`
  - `return_order_status`
  - `return_order_item_qc_status`
  - `customer_billing_pin` / `pincode`
- For billion-row tables, consider DBA-managed reporting views or pre-aggregated reporting tables partitioned by report date.
- For daily dashboards, consider a DBA-managed daily snapshot table refreshed by an ETL job.
- For exports over large ranges, consider an async reporting-job flow that writes the export to object storage or a secure file share, then lets the UI poll job status.
- If SQL Server is the actual production source for these reports, ask the DBA to review execution plans for the same parameterized date ranges used by the API.
