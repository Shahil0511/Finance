// Coordinates the dashboard Refresh button with the API layer.
//
// Clicking Refresh marks a short window; every API request that starts inside
// it carries `Cache-Control: no-cache`, which tells the backend to skip the
// Redis READ and overwrite the cached entry with fresh data. RTK Query fires
// its invalidation refetches immediately, so a few seconds is plenty.

let forcedUntil = 0;

export function markForcedRefresh(windowMs = 3000) {
  forcedUntil = Date.now() + windowMs;
}

export function isForcedRefresh() {
  return Date.now() < forcedUntil;
}
