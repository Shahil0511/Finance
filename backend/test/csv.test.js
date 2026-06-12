"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { buildCsv, formatCsvVal } = require("../utils/csv");

test("formatCsvVal: null/undefined become empty strings", () => {
  assert.equal(formatCsvVal(null), "");
  assert.equal(formatCsvVal(undefined), "");
});

test("formatCsvVal: escapes embedded double quotes by doubling them", () => {
  assert.equal(formatCsvVal('he said "hi"'), 'he said ""hi""');
});

test("formatCsvVal: formats a Date as YYYY-MM-DD HH:mm:ss (local time)", () => {
  const d = new Date(2026, 0, 5, 9, 7, 3); // 2026-01-05 09:07:03 local
  assert.equal(formatCsvVal(d), "2026-01-05 09:07:03");
});

test("buildCsv: header row from column tuples; every value wrapped in quotes", () => {
  const cols = [
    ["brand", "Brand"],
    ["mrp", "MRP"],
  ];
  const csv = buildCsv([{ brand: "Acme", mrp: 100 }], cols);
  assert.equal(csv, 'Brand,MRP\n"Acme","100"');
});

test("buildCsv: missing keys render as empty quoted cells", () => {
  const cols = [
    ["a", "A"],
    ["b", "B"],
  ];
  assert.equal(buildCsv([{ a: "x" }], cols), 'A,B\n"x",""');
});

// ─── CHARACTERIZATION of bug B3 (REFACTOR_PLAN.md) ───────────────────────────
// CSV formula injection is NOT neutralized: a value starting with = + - @ is
// written verbatim and will execute as a formula in Excel/Sheets. This pins the
// CURRENT (unsafe) behavior; Phase 2 will prefix such values with a single quote
// and this assertion will be updated to expect the sanitized form.
test("[characterizes bug B3] leading =/+/-/@ are NOT sanitized (formula injection)", () => {
  const cols = [["x", "X"]];
  assert.equal(buildCsv([{ x: "=1+1" }], cols), 'X\n"=1+1"');
  assert.equal(buildCsv([{ x: "@SUM(A1)" }], cols), 'X\n"@SUM(A1)"');
});
