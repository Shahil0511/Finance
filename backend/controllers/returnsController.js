"use strict";

const returnsService = require("../services/returnsService");

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
  const result = await returnsService.exportCsv(req.validatedQuery, req.requestSignal);
  if (!result.rows.length) {
    return res.json({
      data: [],
      message: "No records found",
      executionTimeMs: result.executionTimeMs,
    });
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${datedFilename("returns_report")}"`,
  );
  res.send(result.csv);
}

async function pastReturnExportReport(req, res) {
  res.locals.dbQueries = 1;
  const result = await returnsService.exportPastReturnCsv(req.validatedQuery, req.requestSignal);
  if (!result.rows.length) {
    return res.json({
      data: [],
      message: "No records found",
      executionTimeMs: result.executionTimeMs,
    });
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${datedFilename("past_returns_report")}"`,
  );
  res.send(result.csv);
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
  const result = await returnsService.exportOmniCsv(req.validatedQuery, req.requestSignal);
  if (!result.rows.length) {
    return res.json({
      data: [],
      message: "No records found",
      executionTimeMs: result.executionTimeMs,
    });
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${datedFilename("myntra_omni_returns")}"`,
  );
  res.send(result.csv);
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
  const result = await returnsService.exportTataCliqCsv(req.validatedQuery, req.requestSignal);
  if (!result.rows.length) {
    return res.json({
      data: [],
      message: "No records found",
      executionTimeMs: result.executionTimeMs,
    });
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${datedFilename("tata_cliq_returns")}"`,
  );
  res.send(result.csv);
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
