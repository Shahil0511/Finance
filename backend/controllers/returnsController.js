"use strict";

const returnsService = require("../services/returnsService");
const { streamCsvExport } = require("../utils/csvStream");

function datedFilename(prefix) {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${prefix}_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.csv`;
}

async function list(req, res) {
  res.locals.dbQueries = 1;
  const result = await returnsService.getList(req.validatedQuery, req.requestSignal);
  res.json(result);
}

async function summary(req, res) {
  res.locals.dbQueries = 1;
  const result = await returnsService.getSummary(req.validatedQuery, req.requestSignal);
  res.json(result);
}

async function filters(req, res) {
  res.locals.dbQueries = 3;
  const result = await returnsService.getFilters(req.requestSignal);
  res.json(result);
}

async function exportReport(req, res) {
  res.locals.dbQueries = 1;
  const stream = await returnsService.exportStream(req.validatedQuery, req.requestSignal);
  await streamCsvExport(res, stream, returnsService.exportCols, datedFilename("returns_report"));
}

async function pastReturnExportReport(req, res) {
  res.locals.dbQueries = 1;
  const stream = await returnsService.exportPastReturnStream(req.validatedQuery, req.requestSignal);
  await streamCsvExport(res, stream, returnsService.exportCols, datedFilename("past_returns_report"));
}

async function omniList(req, res) {
  res.locals.dbQueries = 1;
  const result = await returnsService.getOmniList(req.validatedQuery, req.requestSignal);
  res.json(result);
}

async function omniSummary(req, res) {
  res.locals.dbQueries = 1;
  const result = await returnsService.getOmniSummary(req.validatedQuery, req.requestSignal);
  res.json(result);
}

async function omniFilters(req, res) {
  res.locals.dbQueries = 2;
  const result = await returnsService.getOmniFilters(req.requestSignal);
  res.json(result);
}

async function omniExportReport(req, res) {
  res.locals.dbQueries = 1;
  const stream = await returnsService.exportOmniStream(req.validatedQuery, req.requestSignal);
  await streamCsvExport(res, stream, returnsService.exportCols, datedFilename("myntra_omni_returns"));
}

async function tataCliqList(req, res) {
  res.locals.dbQueries = 1;
  const result = await returnsService.getTataCliqList(req.validatedQuery, req.requestSignal);
  res.json(result);
}

async function tataCliqSummary(req, res) {
  res.locals.dbQueries = 1;
  const result = await returnsService.getTataCliqSummary(req.validatedQuery, req.requestSignal);
  res.json(result);
}

async function tataCliqFilters(req, res) {
  res.locals.dbQueries = 2;
  const result = await returnsService.getTataCliqFilters(req.requestSignal);
  res.json(result);
}

async function tataCliqExportReport(req, res) {
  res.locals.dbQueries = 1;
  const stream = await returnsService.exportTataCliqStream(req.validatedQuery, req.requestSignal);
  await streamCsvExport(res, stream, returnsService.tataCliqExportCols, datedFilename("tata_cliq_returns"));
}

module.exports = {
  list,
  summary,
  filters,
  exportReport,
  pastReturnExportReport,
  omniList,
  omniSummary,
  omniFilters,
  omniExportReport,
  tataCliqList,
  tataCliqSummary,
  tataCliqFilters,
  tataCliqExportReport,
};
