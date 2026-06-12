"use strict";

const returnsRepository = require("../repositories/returnsRepository");
const { buildCsv } = require("../utils/csv");
const { defaultDates, exclusiveEndDate } = require("../utils/dateRange");
const { normalizePagination, buildHasMoreResult } = require("../utils/pagination");

function buildParams(q) {
  const { dateFrom, dateTo } = defaultDates();
  return [
    q.dateFrom || dateFrom,
    exclusiveEndDate(q.dateTo || dateTo),
    q.salesChannel || null,
    q.returnStatus || null,
    q.qcStatus || null,
    q.search ? `%${q.search}%` : null,
  ];
}

function buildOmniParams(q) {
  const { dateFrom, dateTo } = defaultDates();
  return [
    q.dateFrom || dateFrom,
    exclusiveEndDate(q.dateTo || dateTo),
    q.returnStatus || null,
    q.qcStatus || null,
    q.search ? `%${q.search}%` : null,
  ];
}

function buildTataCliqParams(q) {
  const { dateFrom, dateTo } = defaultDates();
  return [
    q.dateFrom || dateFrom,
    exclusiveEndDate(q.dateTo || dateTo),
    q.returnStatus || null,
    q.qcStatus || null,
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
  const rows = await returnsRepository.list(buildParams(query), {
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
  const rows = await returnsRepository.summary(buildParams(query), signal);
  return withExecutionTime(startedAt, rows[0] || {});
}

async function getFilters(signal) {
  const startedAt = Date.now();
  const data = await returnsRepository.filters(signal);
  return withExecutionTime(startedAt, data);
}

async function exportCsv(query, signal) {
  const startedAt = Date.now();
  const rows = await returnsRepository.exportRows(buildParams(query), signal);
  return {
    rows,
    csv: rows.length ? buildCsv(rows, returnsRepository.EXPORT_COLS) : "",
    executionTimeMs: Date.now() - startedAt,
  };
}

async function exportPastReturnCsv(query, signal) {
  const startedAt = Date.now();
  const rows = await returnsRepository.pastReturnExportRows(buildParams(query), signal);
  return {
    rows,
    csv: rows.length ? buildCsv(rows, returnsRepository.EXPORT_COLS) : "",
    executionTimeMs: Date.now() - startedAt,
  };
}

async function getOmniList(query, signal) {
  const startedAt = Date.now();
  const pagination = normalizePagination(query);
  const rows = await returnsRepository.omniList(buildOmniParams(query), {
    sortBy: query.sortBy,
    sortDir: query.sortDir,
    pageLimit: pagination.pageLimit,
    offset: pagination.offset,
    signal,
  });
  return withExecutionTime(startedAt, buildHasMoreResult(rows, pagination));
}

async function getOmniSummary(query, signal) {
  const startedAt = Date.now();
  const rows = await returnsRepository.omniSummary(buildOmniParams(query), signal);
  return withExecutionTime(startedAt, rows[0] || {});
}

async function getOmniFilters(signal) {
  const startedAt = Date.now();
  const data = await returnsRepository.omniFilters(signal);
  return withExecutionTime(startedAt, data);
}

async function exportOmniCsv(query, signal) {
  const startedAt = Date.now();
  const rows = await returnsRepository.omniExportRows(buildOmniParams(query), signal);
  return {
    rows,
    csv: rows.length ? buildCsv(rows, returnsRepository.EXPORT_COLS) : "",
    executionTimeMs: Date.now() - startedAt,
  };
}

async function getTataCliqList(query, signal) {
  const startedAt = Date.now();
  const pagination = normalizePagination(query);
  const rows = await returnsRepository.tataCliqList(buildTataCliqParams(query), {
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
  const rows = await returnsRepository.tataCliqSummary(buildTataCliqParams(query), signal);
  return withExecutionTime(startedAt, rows[0] || {});
}

async function getTataCliqFilters(signal) {
  const startedAt = Date.now();
  const data = await returnsRepository.tataCliqFilters(signal);
  return withExecutionTime(startedAt, data);
}

async function exportTataCliqCsv(query, signal) {
  const startedAt = Date.now();
  const rows = await returnsRepository.tataCliqExportRows(buildTataCliqParams(query), signal);
  return {
    rows,
    csv: rows.length ? buildCsv(rows, returnsRepository.TATA_CLIQ_EXPORT_COLS) : "",
    executionTimeMs: Date.now() - startedAt,
  };
}

module.exports = {
  allowedSortCols: returnsRepository.ALLOWED_SORT_COLS,
  buildParams,
  buildOmniParams,
  buildTataCliqParams,
  getList,
  getSummary,
  getFilters,
  exportCsv,
  exportPastReturnCsv,
  getOmniList,
  getOmniSummary,
  getOmniFilters,
  exportOmniCsv,
  getTataCliqList,
  getTataCliqSummary,
  getTataCliqFilters,
  exportTataCliqCsv,
};
