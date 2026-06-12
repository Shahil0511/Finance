"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  defaultDates,
  exclusiveEndDate,
  diffDaysInclusive,
  todayString,
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
