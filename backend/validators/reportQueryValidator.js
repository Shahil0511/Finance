"use strict";

const { ApiError } = require("../utils/httpErrors");
const { defaultDates, diffDaysInclusive } = require("../utils/dateRange");
const appConfig = require("../config/appConfig");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isDateOnly(value) {
  if (!DATE_RE.test(String(value || ""))) return false;
  const [year, month, day] = value.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return (
    !Number.isNaN(d.getTime()) &&
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}

function positiveInt(value) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function validateReportQuery({ allowedSortCols, defaultSortBy }) {
  return (req, _res, next) => {
    try {
      const todayDefaults = defaultDates();
      const query = { ...req.query };
      const dateFrom = query.dateFrom || todayDefaults.dateFrom;
      const dateTo = query.dateTo || todayDefaults.dateTo;

      if (!isDateOnly(dateFrom)) {
        throw new ApiError(400, "Invalid dateFrom. Use YYYY-MM-DD.");
      }
      if (!isDateOnly(dateTo)) {
        throw new ApiError(400, "Invalid dateTo. Use YYYY-MM-DD.");
      }
      if (new Date(`${dateFrom}T00:00:00`) > new Date(`${dateTo}T00:00:00`)) {
        throw new ApiError(400, "dateFrom cannot be after dateTo.");
      }

      const page = positiveInt(query.page) || appConfig.pagination.defaultPage;
      const requestedPageSize =
        positiveInt(query.pageSize) || appConfig.pagination.defaultPageSize;
      const pageSize = Math.min(
        requestedPageSize,
        appConfig.pagination.maxPageSize,
      );
      const sortBy = allowedSortCols.has(query.sortBy)
        ? query.sortBy
        : defaultSortBy;
      const sortDir = String(query.sortDir || "DESC").toUpperCase() === "ASC"
        ? "ASC"
        : "DESC";

      req.validatedQuery = {
        ...query,
        dateFrom,
        dateTo,
        page,
        pageSize,
        sortBy,
        sortDir,
        dateRangeDays: diffDaysInclusive(dateFrom, dateTo),
      };
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { validateReportQuery };
