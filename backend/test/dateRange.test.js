"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  defaultDates,
  exclusiveEndDate,
  diffDaysInclusive,
  todayString,
  businessWindow,
} = require("../utils/dateRange");

test("exclusiveEndDate: returns the next calendar day", () => {
  assert.equal(exclusiveEndDate("2026-01-31"), "2026-02-01");
  // 2026 is not a leap year, so Feb has 28 days
  assert.equal(exclusiveEndDate("2026-02-28"), "2026-03-01");
});

test("diffDaysInclusive: counts both endpoints", () => {
  assert.equal(diffDaysInclusive("2026-06-01", "2026-06-01"), 1);
  assert.equal(diffDaysInclusive("2026-06-01", "2026-06-30"), 30);
});

test("todayString / defaultDates: produce YYYY-MM-DD strings", () => {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  assert.match(todayString(), re);
  const d = defaultDates();
  assert.match(d.dateFrom, re);
  assert.match(d.dateTo, re);
});

test("defaultDates: window starts on the 1st of a month and ends today", () => {
  const d = defaultDates();
  assert.equal(d.dateFrom.slice(-2), "01"); // business window always begins on the 1st
  assert.equal(d.dateTo, todayString());
});

test("businessWindow: clamps requests outside the business window", () => {
  const defaults = defaultDates();
  const tomorrow = exclusiveEndDate(defaults.dateTo);

  // Way-too-wide request collapses to [window start, tomorrow).
  const wide = businessWindow("2000-01-01", "2100-01-01");
  assert.equal(wide.from, defaults.dateFrom);
  assert.equal(wide.to, tomorrow);

  // Missing dates fall back to the same window.
  const none = businessWindow();
  assert.deepEqual(none, wide);

  // An in-window request passes through; `to` becomes exclusive (+1 day).
  const inWin = businessWindow(defaults.dateFrom, defaults.dateTo);
  assert.equal(inWin.from, defaults.dateFrom);
  assert.equal(inWin.to, tomorrow);
});

test("businessWindow: fully-past ranges yield an empty (from >= to) window", () => {
  const w = businessWindow("2020-01-01", "2020-01-31");
  assert.ok(w.from >= w.to); // empty result set, same as the old in-SQL clamp
});
