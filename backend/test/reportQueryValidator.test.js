"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { validateReportQuery } = require("../validators/reportQueryValidator");

const ALLOWED = new Set(["handover_time", "mrp", "sales_channel"]);
const middleware = validateReportQuery({
  allowedSortCols: ALLOWED,
  defaultSortBy: "handover_time",
});

// Drive the Express middleware synchronously; capture validatedQuery or the error.
function run(query) {
  const req = { query };
  let error = null;
  middleware(req, {}, (err) => {
    if (err) error = err;
  });
  return { validated: req.validatedQuery, error };
}

test("valid query passes; sortDir is upper-cased", () => {
  const { validated, error } = run({
    dateFrom: "2026-06-01",
    dateTo: "2026-06-10",
    sortBy: "mrp",
    sortDir: "asc",
  });
  assert.equal(error, null);
  assert.equal(validated.sortBy, "mrp");
  assert.equal(validated.sortDir, "ASC");
});

// ─── Security: this allow-list is the ONLY thing protecting `ORDER BY ${sortBy}`
//     from SQL injection in the repositories (see B8 in REFACTOR_PLAN.md). ──────
test("[security] sortBy outside the allow-list collapses to the default", () => {
  const { validated } = run({
    dateFrom: "2026-06-01",
    dateTo: "2026-06-10",
    sortBy: "1; DROP TABLE b2c_detail--",
  });
  assert.equal(validated.sortBy, "handover_time"); // injection payload rejected
});

test("[security] array sortBy (?sortBy[]=) collapses to default, no crash", () => {
  const { validated, error } = run({
    dateFrom: "2026-06-01",
    dateTo: "2026-06-10",
    sortBy: ["mrp", "x"],
  });
  assert.equal(error, null);
  assert.equal(validated.sortBy, "handover_time");
});

test("sortDir defaults to DESC for anything that isn't ASC", () => {
  const { validated } = run({
    dateFrom: "2026-06-01",
    dateTo: "2026-06-10",
    sortDir: "sideways",
  });
  assert.equal(validated.sortDir, "DESC");
});

test("invalid dateFrom format -> ApiError 400", () => {
  const { error } = run({ dateFrom: "06/01/2026", dateTo: "2026-06-10" });
  assert.ok(error, "expected an error");
  assert.equal(error.statusCode, 400);
});

test("dateFrom after dateTo -> ApiError 400", () => {
  const { error } = run({ dateFrom: "2026-06-20", dateTo: "2026-06-10" });
  assert.ok(error);
  assert.equal(error.statusCode, 400);
});

test("pageSize is capped at maxPageSize (100)", () => {
  const { validated } = run({
    dateFrom: "2026-06-01",
    dateTo: "2026-06-10",
    pageSize: "99999",
  });
  assert.equal(validated.pageSize, 100);
});
