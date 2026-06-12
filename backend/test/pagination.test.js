"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizePagination,
  buildHasMoreResult,
} = require("../utils/pagination");

test("normalizePagination: defaults when query is empty", () => {
  const r = normalizePagination({});
  assert.equal(r.page, 1);
  assert.equal(r.pageSize, 50);
  assert.equal(r.offset, 0);
  // fetches pageSize + 1 so the repo can detect "is there a next page?"
  assert.equal(r.pageLimit, 51);
});

test("normalizePagination: caps pageSize at maxPageSize (100)", () => {
  const r = normalizePagination({ pageSize: "5000" });
  assert.equal(r.pageSize, 100);
  assert.equal(r.pageLimit, 101);
});

test("normalizePagination: invalid/negative values fall back to defaults", () => {
  assert.equal(normalizePagination({ page: "0" }).page, 1);
  assert.equal(normalizePagination({ page: "-3" }).page, 1);
  assert.equal(normalizePagination({ page: "abc" }).page, 1);
  assert.equal(normalizePagination({ pageSize: "0" }).pageSize, 50);
});

test("normalizePagination: offset = (page - 1) * pageSize", () => {
  assert.equal(normalizePagination({ page: "3", pageSize: "20" }).offset, 40);
});

test("buildHasMoreResult: trims the probe row and flags hasMore", () => {
  // pageSize 2 but 3 rows came back (the +1 probe) -> there IS a next page
  const r = buildHasMoreResult([{ id: 1 }, { id: 2 }, { id: 3 }], {
    page: 1,
    pageSize: 2,
    offset: 0,
  });
  assert.equal(r.hasMore, true);
  assert.deepEqual(r.data, [{ id: 1 }, { id: 2 }]);
});

test("buildHasMoreResult: no probe row -> hasMore false, all rows kept", () => {
  const r = buildHasMoreResult([{ id: 1 }, { id: 2 }], {
    page: 1,
    pageSize: 2,
    offset: 0,
  });
  assert.equal(r.hasMore, false);
  assert.deepEqual(r.data, [{ id: 1 }, { id: 2 }]);
});

// ─── CHARACTERIZATION of bug A5 (REFACTOR_PLAN.md) ───────────────────────────
// `total` / `totalPages` are NOT true counts — they are "current page (+1)"
// estimates. This test pins the CURRENT (misleading) behavior. When Phase 2
// changes pagination semantics, this test SHOULD fail and be updated on purpose.
test("[characterizes bug A5] total/totalPages are estimates, not true totals", () => {
  // 50 real rows + 1 probe on page 1 of a much larger set
  const rows = Array.from({ length: 51 }, (_, i) => ({ id: i }));
  const r = buildHasMoreResult(rows, { page: 1, pageSize: 50, offset: 0 });
  assert.equal(r.hasMore, true);
  assert.equal(r.pagination.total, 51); // known limitation: not the real grand total
  assert.equal(r.pagination.totalPages, 2); // known limitation: not the real page count
  assert.equal(r.pagination.estimated, true); // at least it's flagged
});
