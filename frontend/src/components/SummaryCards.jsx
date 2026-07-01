import React from 'react';

function fmt(n) {
  if (n === null || n === undefined) return '—';
  const num = parseFloat(n);
  if (isNaN(num)) return '—';
  if (num >= 10000000) return '₹' + (num / 10000000).toFixed(2) + ' Cr';
  if (num >= 100000)   return '₹' + (num / 100000).toFixed(2)   + ' L';
  return '₹' + num.toLocaleString('en-IN');
}

export default function SummaryCards({ data = {}, type = 'sales' }) {
  if (!data || Object.keys(data).length === 0) return null;

  const cards = type === 'sales' ? [
    { label: 'Total Orders',     val: parseInt(data.total_orders     || 0).toLocaleString(), sub: 'unique orders',  color: '#1e40af', bg: '#dbeafe' },
    { label: 'Line Items',       val: parseInt(data.total_line_items || 0).toLocaleString(), sub: 'records',        color: '#374151', bg: '#f3f4f6' },
    { label: 'Sale Value',       val: fmt(data.total_sale_value),                            sub: 'gross revenue',  color: '#166534', bg: '#dcfce7' },
    { label: 'Tax Collected',    val: fmt(data.total_tax),                                   sub: 'GST total',      color: '#1e40af', bg: '#dbeafe' },
    { label: 'Dispatched Qty',   val: parseInt(data.total_dispatched || 0).toLocaleString(), sub: 'units shipped',  color: '#166534', bg: '#dcfce7' },
    { label: 'SLA Breached',     val: parseInt(data.sla_breached_count || 0).toLocaleString(), sub: 'orders',       color: '#991b1b', bg: '#fee2e2' },
  ] : [
    { label: 'Total Returns',  val: parseInt(data.total_returns        || 0).toLocaleString(), sub: 'return items',    color: '#991b1b', bg: '#fee2e2' },
    { label: 'Total Orders',   val: parseInt(data.total_orders         || 0).toLocaleString(), sub: 'unique orders',   color: '#1e40af', bg: '#dbeafe' },
    { label: 'Processed',      val: parseInt(data.processed_count      || 0).toLocaleString(), sub: 'completed',       color: '#166534', bg: '#dcfce7' },
    { label: 'Pending',        val: parseInt(data.pending_count        || 0).toLocaleString(), sub: 'in progress',     color: '#92400e', bg: '#fef3c7' },
    { label: 'Units Returned', val: parseInt(data.total_units_returned || 0).toLocaleString(), sub: 'dispatched units',color: '#374151', bg: '#f3f4f6' },
    { label: 'SLA Breached',   val: parseInt(data.sla_breached_count   || 0).toLocaleString(), sub: 'from forward',   color: '#991b1b', bg: '#fee2e2' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 16 }}>
      {cards.map(c => (
        <div key={c.label} style={{ background: '#fff', border: '1px solid #e0ddd5', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9e9e9a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{c.label}</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: c.color, background: c.bg, display: 'inline-block', padding: '2px 8px', borderRadius: 6 }}>{c.val}</div>
          <div style={{ fontSize: 11, color: '#9e9e9a', marginTop: 4 }}>{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
