"use strict";

const returnsRepository = require("../repositories/returnsRepository");
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

// Row streams (REFACTOR_PLAN.md B2) — controllers pipe these to the response
// as CSV instead of buffering whole exports in memory.
function exportStream(query, signal) {
  return returnsRepository.exportStream(buildParams(query), signal);
}

function exportPastReturnStream(query, signal) {
  return returnsRepository.pastReturnExportStream(buildParams(query), signal);
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

function exportOmniStream(query, signal) {
  return returnsRepository.omniExportStream(buildOmniParams(query), signal);
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

function exportTataCliqStream(query, signal) {
  return returnsRepository.tataCliqExportStream(buildTataCliqParams(query), signal);
}

module.exports = {
  allowedSortCols: returnsRepository.ALLOWED_SORT_COLS,
  exportCols: returnsRepository.EXPORT_COLS,
  tataCliqExportCols: returnsRepository.TATA_CLIQ_EXPORT_COLS,
  buildParams,
  buildOmniParams,
  buildTataCliqParams,
  getList,
  getSummary,
  getFilters,
  exportStream,
  exportPastReturnStream,
  getOmniList,
  getOmniSummary,
  getOmniFilters,
  exportOmniStream,
  getTataCliqList,
  getTataCliqSummary,
  getTataCliqFilters,
  exportTataCliqStream,
};
