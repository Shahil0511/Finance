import React from "react";

const s = {
  bar: {
    background: "#fff",
    border: "1px solid #e0ddd5",
    borderRadius: 12,
    padding: "16px 20px",
    marginBottom: 16,
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "flex-end",
  },
  group: { display: "flex", flexDirection: "column", gap: 4 },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: "#9e9e9a",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  input: {
    padding: "7px 10px",
    border: "1px solid #e0ddd5",
    borderRadius: 7,
    background: "#f5f5f3",
    color: "#1a1a18",
    minWidth: 120,
    outline: "none",
  },
  clearBtn: {
    padding: "7px 14px",
    border: "1px solid #e0ddd5",
    borderRadius: 7,
    background: "#fff",
    color: "#6b6b68",
    alignSelf: "flex-end",
    cursor: "pointer",
  },
};

function getYears() {
  const years = [];
  for (let y = new Date().getFullYear(); y >= 2020; y--) years.push(y);
  return years;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function Filters({
  filters,
  onChange,
  filterOptions = {},
  dateLabel = "Date",
  showB2cFilters = false,
  showReturnsFilters = false,
  showReturnReason = false,
}) {
  const set = (key) => (e) =>
    onChange({ ...filters, [key]: e.target.value, page: 1 });

  const _now = new Date();
  const _pad = (n) => String(n).padStart(2, '0');
  const firstDayOfMonth = `${_now.getFullYear()}-${_pad(_now.getMonth() + 1)}-01`;
  const todayStr = `${_now.getFullYear()}-${_pad(_now.getMonth() + 1)}-${_pad(_now.getDate())}`;

  return (
    <div style={s.bar}>
      {/* ── Date From ── */}
      <div style={s.group}>
        <span style={s.label}>{dateLabel} from</span>
        <input
          type="date"
          style={s.input}
          value={filters.dateFrom || ""}
          onChange={set("dateFrom")}
          min="2020-01-01"
          max={todayStr}
        />
      </div>

      {/* ── Date To ── */}
      <div style={s.group}>
        <span style={s.label}>{dateLabel} to</span>
        <input
          type="date"
          style={s.input}
          value={filters.dateTo || ""}
          onChange={set("dateTo")}
          min={filters.dateFrom || "2020-01-01"}
          max={todayStr}
        />
      </div>

      {/* ── Sales Channel ── */}
      <div style={s.group}>
        <span style={s.label}>Channel</span>
        <select
          style={s.input}
          value={filters.salesChannel || ""}
          onChange={set("salesChannel")}
        >
          <option value="">All channels</option>
          {(filterOptions.salesChannels || []).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* ── Category (B2C only) ── */}
      {!showReturnsFilters && (
        <div style={s.group}>
          <span style={s.label}>Category</span>
          <select
            style={s.input}
            value={filters.category || ""}
            onChange={set("category")}
          >
            <option value="">All categories</option>
            {(filterOptions.categories || []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Mode-specific filters */}
      {showB2cFilters ? (
        <>
          {/* ── Order Status ── */}
          <div style={s.group}>
            <span style={s.label}>Order Status</span>
            <select
              style={s.input}
              value={filters.orderStatus || ""}
              onChange={set("orderStatus")}
            >
              <option value="">All statuses</option>
              {(filterOptions.orderStatuses || []).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* ── Warehouse ── */}
          <div style={s.group}>
            <span style={s.label}>Warehouse</span>
            <select
              style={s.input}
              value={filters.warehouse || ""}
              onChange={set("warehouse")}
            >
              <option value="">All warehouses</option>
              {(filterOptions.warehouses || []).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* ── Payment Type ── */}
          <div style={s.group}>
            <span style={s.label}>Payment</span>
            <select
              style={s.input}
              value={filters.paymentType || ""}
              onChange={set("paymentType")}
            >
              <option value="">All payments</option>
              {(filterOptions.paymentTypes || []).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* ── State ── */}
          <div style={s.group}>
            <span style={s.label}>State</span>
            <select
              style={s.input}
              value={filters.state || ""}
              onChange={set("state")}
            >
              <option value="">All states</option>
              {(filterOptions.states || []).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* ── Brand ── */}
          <div style={s.group}>
            <span style={s.label}>Brand</span>
            <select
              style={s.input}
              value={filters.brand || ""}
              onChange={set("brand")}
            >
              <option value="">All brands</option>
              {(filterOptions.brands || []).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </>
      ) : showReturnsFilters ? (
        <>
          {/* ── Return Status ── */}
          <div style={s.group}>
            <span style={s.label}>Return Status</span>
            <select
              style={s.input}
              value={filters.returnStatus || ""}
              onChange={set("returnStatus")}
            >
              <option value="">All statuses</option>
              {(filterOptions.returnStatuses || []).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* ── QC Status ── */}
          <div style={s.group}>
            <span style={s.label}>QC Status</span>
            <select
              style={s.input}
              value={filters.qcStatus || ""}
              onChange={set("qcStatus")}
            >
              <option value="">All QC statuses</option>
              {(filterOptions.qcStatuses || []).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </>
      ) : (
        <>
          {/* ── Year (generic reports) ── */}
          <div style={s.group}>
            <span style={s.label}>Year</span>
            <select
              style={s.input}
              value={filters.year || ""}
              onChange={set("year")}
            >
              <option value="">All years</option>
              {getYears().map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* ── Month ── */}
          <div style={s.group}>
            <span style={s.label}>Month</span>
            <select
              style={s.input}
              value={filters.month || ""}
              onChange={set("month")}
            >
              <option value="">All months</option>
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* ── Region ── */}
          <div style={s.group}>
            <span style={s.label}>Region</span>
            <select
              style={s.input}
              value={filters.region || ""}
              onChange={set("region")}
            >
              <option value="">All regions</option>
              {(filterOptions.regions || []).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* ── Status ── */}
          <div style={s.group}>
            <span style={s.label}>Status</span>
            <select
              style={s.input}
              value={filters.status || ""}
              onChange={set("status")}
            >
              <option value="">All statuses</option>
              {(filterOptions.statuses || []).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* ── Return Reason (returns report only) ── */}
      {showReturnReason && (
        <div style={s.group}>
          <span style={s.label}>Return reason</span>
          <select
            style={s.input}
            value={filters.returnReason || ""}
            onChange={set("returnReason")}
          >
            <option value="">All reasons</option>
            {(filterOptions.returnReasons || []).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── Search ── */}
      <div style={s.group}>
        <span style={s.label}>Search</span>
        <input
          type="text"
          style={{ ...s.input, minWidth: 180 }}
          placeholder="Order ID, SKU, brand…"
          value={filters.search || ""}
          onChange={set("search")}
        />
      </div>

      {/* ── Clear ── */}
      <button
        style={s.clearBtn}
        onClick={() =>
          onChange({ page: 1, pageSize: filters.pageSize, dateFrom: firstDayOfMonth, dateTo: todayStr })
        }
      >
        ✕ Clear
      </button>
    </div>
  );
}
