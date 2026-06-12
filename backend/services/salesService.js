"use strict";

const salesRepository = require("../repositories/salesRepository");
const { businessWindow, toDateString } = require("../utils/dateRange");
const { normalizePagination, buildHasMoreResult } = require("../utils/pagination");

// The window is clamped here (not in SQL) so the repository receives plain
// constants and TimescaleDB can prune hypertable chunks — see businessWindow.
function buildParams(q) {
  const { from, to } = businessWindow(q.dateFrom, q.dateTo);
  return [
    from,
    to,
    q.salesChannel || null,
    q.category || null,
    q.orderStatus || null,
    q.warehouse || null,
    q.paymentType || null,
    q.search ? `%${q.search}%` : null,
    q.state || null,
    q.brand || null,
  ];
}

function buildTataCliqParams(q) {
  const { from, to } = businessWindow(q.dateFrom, q.dateTo);
  return [
    from,
    to,
    q.orderStatus || null,
    q.warehouse || null,
    q.paymentType || null,
    q.state || null,
    q.brand || null,
    q.search ? `%${q.search}%` : null,
  ];
}

function withExecutionTime(startedAt, payload) {
  return {
    ...payload,
    executionTimeMs: Date.now() - startedAt,
  };
}

async function getList(query, signal) {
  const startedAt = Date.now();
  const pagination = normalizePagination(query);
  const rows = await salesRepository.list(buildParams(query), {
    sortBy: query.sortBy,
    sortDir: query.sortDir,
    pageLimit: pagination.pageLimit,
    offset: pagination.offset,
    signal,
  });
  return withExecutionTime(startedAt, buildHasMoreResult(rows, pagination));
}

async function getSummary(query, signal) {
  const startedAt = Date.now();
  const rows = await salesRepository.summary(buildParams(query), signal);
  return withExecutionTime(startedAt, rows[0] || {});
}

async function getFilters(signal) {
  const startedAt = Date.now();
  const { from, to } = businessWindow(); // current business window
  const data = await salesRepository.filters([from, to], signal);
  return withExecutionTime(startedAt, data);
}

/* Shapes the single GROUPING SETS result into chart-ready buckets.
   gmask → which grouping set the row belongs to (see repository). */
async function getAnalytics(query, signal) {
  const startedAt = Date.now();
  const rows = await salesRepository.analytics(buildParams(query), signal);

  const daily = [], byChannel = [], byBrand = [], byPayment = [], byState = [], byCategory = [];
  for (const r of rows) {
    const m = {
      orders: Number(r.orders),
      units: Number(r.units),
      revenue: Number(r.revenue),
      slaBreached: Number(r.sla_breached),
    };
    switch (Number(r.gmask)) {
      case 31: if (r.day)           daily.push({ day: toDateString(r.day), ...m }); break;
      case 47: if (r.sales_channel) byChannel.push({ key: r.sales_channel, ...m }); break;
      case 55: if (r.brand)         byBrand.push({ key: r.brand, ...m }); break;
      case 59: if (r.payment_type)  byPayment.push({ key: r.payment_type, ...m }); break;
      case 61: if (r.state)         byState.push({ key: r.state, ...m }); break;
      case 62: if (r.category)      byCategory.push({ key: r.category, ...m }); break;
    }
  }

  const byRevenue = (a, b) => b.revenue - a.revenue;
  return withExecutionTime(startedAt, {
    daily, // already day-ordered by the SQL
    byChannel: byChannel.sort(byRevenue),
    byBrand: byBrand.sort(byRevenue).slice(0, 10),
    byPayment: byPayment.sort(byRevenue),
    byState: byState.sort(byRevenue).slice(0, 10),
    byCategory: byCategory.sort(byRevenue).slice(0, 10),
  });
}

// Returns a row stream (REFACTOR_PLAN.md B2) — the controller pipes it to the
// response as CSV instead of buffering the whole export in memory.
function exportStream(query, signal) {
  return salesRepository.exportStream(buildParams(query), signal);
}

async function getTataCliqList(query, signal) {
  const startedAt = Date.now();
  const pagination = normalizePagination(query);
  const rows = await salesRepository.tataCliqList(buildTataCliqParams(query), {
    sortBy: query.sortBy,
    sortDir: query.sortDir,
    pageLimit: pagination.pageLimit,
    offset: pagination.offset,
    signal,
  });
  return withExecutionTime(startedAt, buildHasMoreResult(rows, pagination));
}

async function getTataCliqSummary(query, signal) {
  const startedAt = Date.now();
  const rows = await salesRepository.tataCliqSummary(buildTataCliqParams(query), signal);
  return withExecutionTime(startedAt, rows[0] || {});
}

async function getTataCliqFilters(signal) {
  const startedAt = Date.now();
  const { from, to } = businessWindow();
  const data = await salesRepository.tataCliqFilters([from, to], signal);
  return withExecutionTime(startedAt, data);
}

function exportTataCliqStream(query, signal) {
  return salesRepository.tataCliqExportStream(buildTataCliqParams(query), signal);
}

module.exports = {
  allowedSortCols: salesRepository.ALLOWED_SORT_COLS,
  exportCols: salesRepository.EXPORT_COLS,
  tataCliqExportCols: salesRepository.TATA_CLIQ_EXPORT_COLS,
  buildParams,
  buildTataCliqParams,
  getList,
  getSummary,
  getAnalytics,
  getFilters,
  exportStream,
  getTataCliqList,
  getTataCliqSummary,
  getTataCliqFilters,
  exportTataCliqStream,
};
