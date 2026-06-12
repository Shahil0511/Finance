"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { errorHandler } = require("../middlewares/errorHandler");
const { ApiError } = require("../utils/httpErrors");

function mockRes() {
  return {
    statusCode: 0,
    body: null,
    headersSent: false,
    status(s) {
      this.statusCode = s;
      return this;
    },
    json(b) {
      this.body = b;
      return this;
    },
  };
}

test("4xx ApiError surfaces publicMessage and the explicit detail", () => {
  const res = mockRes();
  errorHandler(new ApiError(400, "Invalid dateFrom.", "Use YYYY-MM-DD."), {}, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, "Invalid dateFrom.");
  assert.equal(res.body.detail, "Use YYYY-MM-DD.");
});

// ─── B4 FIXED (REFACTOR_PLAN.md) ─────────────────────────────────────────────
// A raw 500 (e.g. a pg error) must not leak internal text to the client.
test("[B4 fixed] 5xx does not leak raw error text in production", () => {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    const res = mockRes();
    errorHandler(new Error('column "secret_col" does not exist'), { method: "GET", url: "/x" }, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error, "Internal server error");
    assert.equal(res.body.detail, undefined); // raw pg text NOT exposed
  } finally {
    process.env.NODE_ENV = prev;
  }
});

test("[B4] 5xx includes raw detail in non-production for debugging", () => {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  try {
    const res = mockRes();
    errorHandler(new Error("boom"), { method: "GET", url: "/x" }, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error, "Internal server error");
    assert.equal(res.body.detail, "boom");
  } finally {
    process.env.NODE_ENV = prev;
  }
});

test("cancelled/aborted requests are ignored (no response written)", () => {
  const res = mockRes();
  errorHandler({ code: "CANCELLED" }, {}, res);
  assert.equal(res.statusCode, 0); // untouched
  assert.equal(res.body, null);
});
