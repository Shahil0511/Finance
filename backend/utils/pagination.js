"use strict";

const appConfig = require("../config/appConfig");

function parsePositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizePagination(query = {}) {
  const page = parsePositiveInt(query.page, appConfig.pagination.defaultPage);
  const rawPageSize = parsePositiveInt(
    query.pageSize,
    appConfig.pagination.defaultPageSize,
  );
  const pageSize = Math.min(rawPageSize, appConfig.pagination.maxPageSize);
  const offset = (page - 1) * pageSize;
  return {
    page,
    pageSize,
    offset,
    pageLimit: pageSize + 1,
  };
}

function buildHasMoreResult(rows, { page, pageSize, offset }) {
  const hasMore = rows.length > pageSize;
  const data = hasMore ? rows.slice(0, pageSize) : rows;
  const total = offset + data.length + (hasMore ? 1 : 0);

  return {
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: page + (hasMore ? 1 : 0),
      hasMore,
      estimated: true,
    },
    page,
    pageSize,
    total,
    hasMore,
  };
}

module.exports = { normalizePagination, buildHasMoreResult };
