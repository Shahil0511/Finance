"use strict";

function errorHandler(err, req, res, _next) {
  if (err?.code === "CANCELLED" || res.headersSent) return;

  const status = err.statusCode || err.status || 500;
  const isServerError = status >= 500;
  const message = err.publicMessage || err.message || "Request failed";
  const duration = req.requestStartedAt ? Date.now() - req.requestStartedAt : undefined;

  if (isServerError) {
    console.error("[API Error]", {
      method: req.method,
      path: req.originalUrl || req.url,
      message: err.message,
    });
  }

  res.status(status).json({
    error: message,
    detail: err.detail || err.message,
    ...(duration !== undefined ? { executionTimeMs: duration } : {}),
  });
}

module.exports = { errorHandler };
