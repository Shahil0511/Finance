"use strict";

function errorHandler(err, req, res, _next) {
  if (err?.code === "CANCELLED" || res.headersSent) return;

  const status = err.statusCode || err.status || 500;
  const isServerError = status >= 500;
  const duration = req.requestStartedAt ? Date.now() - req.requestStartedAt : undefined;
  const isDev = process.env.NODE_ENV !== "production";

  if (isServerError) {
    console.error("[API Error]", {
      method: req.method,
      path: req.originalUrl || req.url,
      message: err.message,
    });
  }

  // 5xx must not leak internal error text (raw pg/SQL messages) to clients —
  // expose only a generic message, plus raw detail in non-production for debugging.
  // 4xx surface the explicitly-set publicMessage/detail, which are intentional.
  const body = isServerError
    ? {
        error: "Internal server error",
        ...(isDev && err.message ? { detail: err.message } : {}),
      }
    : {
        error: err.publicMessage || err.message || "Request failed",
        ...(err.detail ? { detail: err.detail } : {}),
      };
  if (duration !== undefined) body.executionTimeMs = duration;

  res.status(status).json(body);
}

module.exports = { errorHandler };
