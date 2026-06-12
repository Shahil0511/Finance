"use strict";

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayString() {
  return formatDate(new Date());
}

function defaultDates() {
  const today = new Date();
  const allowedStart = new Date(today.getFullYear(), today.getMonth(), 1);
  if (today.getDate() <= 2) {
    allowedStart.setMonth(allowedStart.getMonth() - 1);
  }
  return {
    dateFrom: formatDate(allowedStart),
    dateTo: formatDate(today),
  };
}

function exclusiveEndDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return formatDate(d);
}

function diffDaysInclusive(dateFrom, dateTo) {
  const from = new Date(`${dateFrom}T00:00:00`);
  const to = new Date(`${dateTo}T00:00:00`);
  return Math.floor((to - from) / 86_400_000) + 1;
}

/**
 * Clamps a requested range to the business window and returns it as
 * [inclusive from, exclusive to] date strings.
 *
 * Window: current month from the 1st (previous month stays available through
 * the 2nd), up to tomorrow. This used to be computed inside the SQL via a
 * date_params CTE + GREATEST/LEAST — but those are runtime expressions, so
 * TimescaleDB could not prune hypertable chunks at plan time and every query
 * planned/probed all ~1,259 chunks (11-13s of planning alone). Clamping here
 * and passing plain constants restores pruning.
 */
function businessWindow(dateFrom, dateTo) {
  const defaults = defaultDates(); // { dateFrom: grace month start, dateTo: today }
  const minFrom = defaults.dateFrom;
  const maxToExclusive = exclusiveEndDate(defaults.dateTo); // tomorrow

  // YYYY-MM-DD strings compare correctly lexicographically.
  const from = !dateFrom || dateFrom < minFrom ? minFrom : dateFrom;
  const requestedToExclusive = exclusiveEndDate(dateTo || defaults.dateTo);
  const to = requestedToExclusive > maxToExclusive ? maxToExclusive : requestedToExclusive;

  return { from, to }; // from >= to yields an empty range, same as the old SQL clamp
}

module.exports = {
  defaultDates,
  exclusiveEndDate,
  todayString,
  diffDaysInclusive,
  businessWindow,
};
