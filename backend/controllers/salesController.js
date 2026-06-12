"use strict";

const salesService = require("../services/salesService");
const { streamCsvExport } = require("../utils/csvStream");

function datedFilename(prefix) {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${prefix}_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.csv`;
}

async function list(req, res) {
  res.locals.dbQueries = 1;
  const result = await salesService.getList(req.validatedQuery, req.requestSignal);
  res.json(result);
}

async function summary(req, res) {
  res.locals.dbQueries = 1;
  const result = await salesService.getSummary(req.validatedQuery, req.requestSignal);
  res.json(result);
}

async function filters(req, res) {
  res.locals.dbQueries = 7;
  const result = await salesService.getFilters(req.requestSignal);
  res.json(result);
}

async function analytics(req, res) {
  res.locals.dbQueries = 1;
  const result = await salesService.getAnalytics(req.validatedQuery, req.requestSignal);
  res.json(result);
}

async function exportReport(req, res) {
  res.locals.dbQueries = 1;
  const stream = await salesService.exportStream(req.validatedQuery, req.requestSignal);
  await streamCsvExport(res, stream, salesService.exportCols, datedFilename("b2c_sales"));
}

async function tataCliqList(req, res) {
  res.locals.dbQueries = 1;
  const result = await salesService.getTataCliqList(req.validatedQuery, req.requestSignal);
  res.json(result);
}

async function tataCliqSummary(req, res) {
  res.locals.dbQueries = 1;
  const result = await salesService.getTataCliqSummary(req.validatedQuery, req.requestSignal);
  res.json(result);
}

async function tataCliqFilters(req, res) {
  res.locals.dbQueries = 5;
  const result = await salesService.getTataCliqFilters(req.requestSignal);
  res.json(result);
}

async function tataCliqExportReport(req, res) {
  res.locals.dbQueries = 1;
  const stream = await salesService.exportTataCliqStream(req.validatedQuery, req.requestSignal);
  await streamCsvExport(res, stream, salesService.tataCliqExportCols, datedFilename("tata_cliq_sales"));
}

module.exports = {
  list,
  summary,
  filters,
  analytics,
  exportReport,
  tataCliqList,
  tataCliqSummary,
  tataCliqFilters,
  tataCliqExportReport,
};
