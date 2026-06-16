"use strict";

const express = require("express");

const salesController = require("../controllers/salesController");
const salesService = require("../services/salesService");
const appConfig = require("../config/appConfig");
const { cacheMiddleware, hashParams } = require("../middlewares/cache");
const { validateReportQuery } = require("../validators/reportQueryValidator");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

const validateSalesQuery = validateReportQuery({
  allowedSortCols: salesService.allowedSortCols,
  defaultSortBy: "handover_time",
});

const cacheKey = (name) => (req) =>
  `${name}:${hashParams(req.validatedQuery || req.query)}`;

router.get(
  "/tata-cliq",
  validateSalesQuery,
  cacheMiddleware({
    keyFn: cacheKey("tata_cliq_sales_data"),
    ttl: appConfig.cacheTtl.data,
  }),
  asyncHandler(salesController.tataCliqList),
);

router.get(
  "/tata-cliq/summary",
  validateSalesQuery,
  cacheMiddleware({
    keyFn: cacheKey("tata_cliq_sales_summary"),
    ttl: appConfig.cacheTtl.summary,
  }),
  asyncHandler(salesController.tataCliqSummary),
);

router.get(
  "/tata-cliq/filters",
  cacheMiddleware({
    keyFn: () => "tata_cliq_sales_filters",
    ttl: appConfig.cacheTtl.filters,
  }),
  asyncHandler(salesController.tataCliqFilters),
);

router.get(
  "/tata-cliq/export",
  validateSalesQuery,
  asyncHandler(salesController.tataCliqExportReport),
);

router.get(
  "/",
  validateSalesQuery,
  cacheMiddleware({
    keyFn: cacheKey("sales_data"),
    ttl: appConfig.cacheTtl.data,
  }),
  asyncHandler(salesController.list),
);

router.get(
  "/summary",
  validateSalesQuery,
  cacheMiddleware({
    keyFn: cacheKey("sales_summary"),
    ttl: appConfig.cacheTtl.summary,
  }),
  asyncHandler(salesController.summary),
);

router.get(
  "/filters",
  cacheMiddleware({
    keyFn: () => "sales_filters",
    ttl: appConfig.cacheTtl.filters,
  }),
  asyncHandler(salesController.filters),
);

router.get(
  "/data-status",
  cacheMiddleware({
    keyFn: () => "sales_data_status",
    ttl: 60,
  }),
  asyncHandler(salesController.dataStatus),
);

router.get(
  "/analytics",
  validateSalesQuery,
  cacheMiddleware({
    keyFn: cacheKey("sales_analytics"),
    ttl: appConfig.cacheTtl.summary,
  }),
  asyncHandler(salesController.analytics),
);

router.get(
  "/export",
  validateSalesQuery,
  asyncHandler(salesController.exportReport),
);

module.exports = router;
