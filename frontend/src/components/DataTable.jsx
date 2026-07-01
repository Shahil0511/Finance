import React from 'react';

const STATUS_COLORS = {
  Completed:  { bg: '#dcfce7', color: '#166534' },
  Pending:    { bg: '#fef3c7', color: '#92400e' },
  Returned:   { bg: '#fee2e2', color: '#991b1b' },
  Cancelled:  { bg: '#f3f4f6', color: '#374151' },
  Processed:  { bg: '#dcfce7', color: '#166534' },
  Rejected:   { bg: '#fee2e2', color: '#991b1b' },
  Approved:   { bg: '#dbeafe', color: '#1e40af' },
};

function Badge({ val }) {
  const c = STATUS_COLORS[val] || { bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: '2px 8px', borderRadius: 99,
      fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap'
    }}>{val}</span>
  );
}

function fmtVal(key, val) {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    return new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  if (key && (key.includes('amount') || key.includes('price') || key.includes('refund') || key.includes('revenue'))) {
    return '₹' + Number(val).toLocaleString('en-IN');
  }
  return String(val);
}

const STATUS_KEYS = ['status'];

export default function DataTable({ columns, rows = [], pagination = {}, filters, onFilterChange, loading }) {
  const { total = 0, page = 1, pageSize = 50, totalPages = 1 } = pagination;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const setSort = (col) => {
    const currentDir = filters.sortBy === col ? filters.sortDir : 'ASC';
    onFilterChange({ ...filters, sortBy: col, sortDir: currentDir === 'ASC' ? 'DESC' : 'ASC', page: 1 });
  };

  return (
    <div>
      {/* Table */}
      <div style={{ overflowX: 'auto', border: '1px solid #e0ddd5', borderRadius: 12, background: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f5f5f3', borderBottom: '1px solid #e0ddd5' }}>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => setSort(col.key)}
                  style={{
                    padding: '10px 14px', textAlign: 'left', fontWeight: 600,
                    fontSize: 11, color: '#6b6b68', textTransform: 'uppercase',
                    letterSpacing: '0.05em', whiteSpace: 'nowrap', cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  {col.label}
                  {filters.sortBy === col.key ? (filters.sortDir === 'ASC' ? ' ↑' : ' ↓') : ' ↕'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} style={{ padding: '40px', textAlign: 'center', color: '#9e9e9a' }}>
                Loading…
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={columns.length} style={{ padding: '40px', textAlign: 'center', color: '#9e9e9a' }}>
                No records found for the selected filters.
              </td></tr>
            ) : rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f0efea' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafaf8'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                {columns.map(col => (
                  <td key={col.key} style={{ padding: '9px 14px', whiteSpace: 'nowrap', color: '#1a1a18' }}>
                    {STATUS_KEYS.includes(col.key)
                      ? <Badge val={row[col.key]} />
                      : col.key.includes('id') || col.key.includes('invoice')
                        ? <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b6b68' }}>{fmtVal(col.key, row[col.key])}</span>
                        : fmtVal(col.key, row[col.key])
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 13, color: '#6b6b68' }}>
          {total > 0 ? `Showing ${start}–${end} of ${total.toLocaleString()} records` : 'No records'}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <select
            value={pageSize}
            onChange={e => onFilterChange({ ...filters, pageSize: parseInt(e.target.value), page: 1 })}
            style={{ padding: '5px 8px', border: '1px solid #e0ddd5', borderRadius: 6, background: '#fff', color: '#1a1a18', fontSize: 13 }}
          >
            {[25, 50, 100, 200].map(n => <option key={n} value={n}>{n} per page</option>)}
          </select>
          <button
            disabled={page <= 1}
            onClick={() => onFilterChange({ ...filters, page: page - 1 })}
            style={{ padding: '5px 12px', border: '1px solid #e0ddd5', borderRadius: 6, background: '#fff', color: page <= 1 ? '#ccc' : '#1a1a18', cursor: page <= 1 ? 'default' : 'pointer' }}
          >← Prev</button>
          <span style={{ fontSize: 13, color: '#6b6b68', minWidth: 80, textAlign: 'center' }}>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => onFilterChange({ ...filters, page: page + 1 })}
            style={{ padding: '5px 12px', border: '1px solid #e0ddd5', borderRadius: 6, background: '#fff', color: page >= totalPages ? '#ccc' : '#1a1a18', cursor: page >= totalPages ? 'default' : 'pointer' }}
          >Next →</button>
        </div>
      </div>
    </div>
  );
}
