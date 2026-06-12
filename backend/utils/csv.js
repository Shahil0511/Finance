"use strict";

function formatCsvVal(v) {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) {
    const p = (n) => String(n).padStart(2, "0");
    return `${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())} ${p(v.getHours())}:${p(v.getMinutes())}:${p(v.getSeconds())}`;
  }
  return String(v).replace(/"/g, '""');
}

function buildCsv(rows, columns) {
  return [
    columns.map(([, h]) => h).join(","),
    ...rows.map((r) =>
      columns.map(([k]) => `"${formatCsvVal(r[k])}"`).join(","),
    ),
  ].join("\n");
}

module.exports = { buildCsv, formatCsvVal };
