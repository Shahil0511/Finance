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

// ─── B3 FIXED (REFACTOR_PLAN.md) ─────────────────────────────────────────────
// Formula-trigger values are prefixed with ' so Excel/Sheets treat them as text,
// while legitimate numbers (including negatives) are left untouched.
test("[B3 fixed] formula triggers are quoted; numbers are left alone", () => {
  const cols = [["x", "X"]];
  assert.equal(buildCsv([{ x: "=1+1" }], cols), `X\n"'=1+1"`);
  assert.equal(buildCsv([{ x: "@SUM(A1)" }], cols), `X\n"'@SUM(A1)"`);
  assert.equal(buildCsv([{ x: "-cmd|'/c calc'" }], cols), `X\n"'-cmd|'/c calc'"`);
  assert.equal(buildCsv([{ x: "-5.00" }], cols), 'X\n"-5.00"'); // negative number untouched
  assert.equal(buildCsv([{ x: "Acme" }], cols), 'X\n"Acme"');
});
