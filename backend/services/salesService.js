"use strict";

const salesRepository = require("../repositories/salesRepository");
const { buildCsv } = require("../utils/csv");
const { defaultDates, exclusiveEndDate } = require("../utils/dateRange");
const { normalizePagination, buildHasMoreResult } = require("../utils/pagination");

function buildParams(q) {
  const { dateFrom, dateTo } = defaultDates();
  return [
    q.dateFrom || dateFrom,
    exclusiveEndDate(q.dateTo || dateTo),
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
  const { dateFrom, dateTo } = defaultDates();
  return [
    q.dateFrom || dateFrom,
    exclusiveEndDate(q.dateTo || dateTo),
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
  const data = await salesRepository.filters(signal);
  return withExecutionTime(startedAt, data);
}

async function exportCsv(query, signal) {
  const startedAt = Date.now();
  const rows = await salesRepository.exportRows(buildParams(query), signal);
  return {
    rows,
    csv: rows.length ? buildCsv(rows, salesRepository.EXPORT_COLS) : "",
    executionTimeMs: Date.now() - startedAt,
  };
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
  const data = await salesRepository.tataCliqFilters(signal);
  return withExecutionTime(startedAt, data);
}

async function exportTataCliqCsv(query, signal) {
  const startedAt = Date.now();
  const rows = await salesRepository.tataCliqExportRows(buildTataCliqParams(query), signal);
  return {
    rows,
    csv: rows.length ? buildCsv(rows, salesRepository.TATA_CLIQ_EXPORT_COLS) : "",
    executionTimeMs: Date.now() - startedAt,
  };
}

module.exports = {
  allowedSortCols: salesRepository.ALLOWED_SORT_COLS,
  buildParams,
  buildTataCliqParams,
  getList,
  getSummary,
  getFilters,
  exportCsv,
  getTataCliqList,
  getTataCliqSummary,
  getTataCliqFilters,
  exportTataCliqCsv,
};
