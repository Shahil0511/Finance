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

module.exports = {
  defaultDates,
  exclusiveEndDate,
  todayString,
  diffDaysInclusive,
};
