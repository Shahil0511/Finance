"use strict";

function formatCsvVal(v) {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) {
    const p = (n) => String(n).padStart(2, "0");
    return `${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())} ${p(v.getHours())}:${p(v.getMinutes())}:${p(v.getSeconds())}`;
  }
  let s = String(v);
  // Defuse CSV/spreadsheet formula injection: a leading = or @ (or +/- not
  // followed by a digit, or tab/CR) is executed as a formula by Excel/Sheets.
  // Prefix with ' so it stays text — without mangling numbers like "-5.00".
  if (/^[=@\t\r]/.test(s) || /^[+\-](?!\d)/.test(s)) s = "'" + s;
  return s.replace(/"/g, '""');
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
