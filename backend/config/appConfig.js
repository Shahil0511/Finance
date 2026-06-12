"use strict";

function intFromEnv(name, fallback) {
  const value = parseInt(process.env[name] || "", 10);
  return Number.isFinite(value) ? value : fallback;
}

const configuredBasePath = process.env.VITE_BASE_PATH || "/finance-gst-tracker";

module.exports = {
  port: intFromEnv("PORT", 4000),
  basePath: `/${configuredBasePath.replace(/^\/+|\/+$/g, "")}`,
  cacheTtl: {
    data: intFromEnv("CACHE_TTL_DATA", 300),
    summary: intFromEnv("CACHE_TTL_SUMMARY", 300),
    filters: intFromEnv("CACHE_TTL_FILTERS", 600),
  },
  pagination: {
    defaultPage: 1,
    defaultPageSize: 50,
    maxPageSize: intFromEnv("MAX_PAGE_SIZE", 100),
  },
};
