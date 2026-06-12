"use strict";

const express = require("express");

const returnsController = require("../controllers/returnsController");
const returnsService = require("../services/returnsService");
const appConfig = require("../config/appConfig");
const { cacheMiddleware, hashParams } = require("../middlewares/cache");
const { validateReportQuery } = require("../validators/reportQueryValidator");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

const validateReturnsQuery = validateReportQuery({
  allowedSortCols: returnsService.allowedSortCols,
  defaultSortBy: "return_order_processed_time",
});

const cacheKey = (name) => (req) =>
  `${name}:${hashParams(req.validatedQuery || req.query)}`;

router.get(
  "/tata-cliq",
  validateReturnsQuery,
  cacheMiddleware({
    keyFn: cacheKey("tata_cliq_returns_data"),
    ttl: appConfig.cacheTtl.data,
  }),
  asyncHandler(returnsController.tataCliqList),
);

router.get(
  "/tata-cliq/summary",
  validateReturnsQuery,
  cacheMiddleware({
    keyFn: cacheKey("tata_cliq_returns_summary"),
    ttl: appConfig.cacheTtl.summary,
  }),
  asyncHandler(returnsController.tataCliqSummary),
);

router.get(
  "/tata-cliq/filters",
  cacheMiddleware({
    keyFn: () => "tata_cliq_returns_filters",
    ttl: appConfig.cacheTtl.filters,
  }),
  asyncHandler(returnsController.tataCliqFilters),
);

router.get(
  "/tata-cliq/export",
  validateReturnsQuery,
  asyncHandler(returnsController.tataCliqExportReport),
);

router.get(
  "/omni",
  validateReturnsQuery,
  cacheMiddleware({
    keyFn: cacheKey("omni_returns_data"),
    ttl: appConfig.cacheTtl.data,
  }),
  asyncHandler(returnsController.omniList),
);

router.get(
  "/omni/summary",
  validateReturnsQuery,
  cacheMiddleware({
    keyFn: cacheKey("omni_returns_summary"),
    ttl: appConfig.cacheTtl.summary,
  }),
  asyncHandler(returnsController.omniSummary),
);

router.get(
  "/omni/filters",
  cacheMiddleware({
    keyFn: () => "omni_returns_filters",
    ttl: appConfig.cacheTtl.filters,
  }),
  asyncHandler(returnsController.omniFilters),
);

router.get(
  "/omni/export",
  validateReturnsQuery,
  asyncHandler(returnsController.omniExportReport),
);

router.get(
  "/",
  validateReturnsQuery,
  cacheMiddleware({
    keyFn: cacheKey("returns_data"),
    ttl: appConfig.cacheTtl.data,
  }),
  asyncHandler(returnsController.list),
);

router.get(
  "/summary",
  validateReturnsQuery,
  cacheMiddleware({
    keyFn: cacheKey("returns_summary"),
    ttl: appConfig.cacheTtl.summary,
  }),
  asyncHandler(returnsController.summary),
);

router.get(
  "/filters",
  cacheMiddleware({
    keyFn: () => "returns_filters",
    ttl: appConfig.cacheTtl.filters,
  }),
  asyncHandler(returnsController.filters),
);

router.get(
  "/export",
  validateReturnsQuery,
  asyncHandler(returnsController.exportReport),
);

router.get(
  "/past-return/export",
  validateReturnsQuery,
  asyncHandler(returnsController.pastReturnExportReport),
);

module.exports = router;
