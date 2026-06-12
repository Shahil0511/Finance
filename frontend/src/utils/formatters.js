export const formatCurrency = (v) => {
  if (v == null || v === '') return '—';
  const n = parseFloat(v);
  if (isNaN(n)) return '—';
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatNumber = (v) => {
  if (v == null) return '—';
  return Number(v).toLocaleString('en-IN');
};

/** Compact Indian-system number for chart axes: 1.2Cr / 3.4L / 12k. */
export const formatCompact = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  const abs = Math.abs(n);
  if (abs >= 1e7) return `${(n / 1e7).toFixed(1)}Cr`;
  if (abs >= 1e5) return `${(n / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(0)}k`;
  return String(Math.round(n));
};

export const formatDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d)) return String(v);
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', hour12: false });
};

export const formatDateOnly = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d)) return String(v);
  return d.toLocaleDateString('en-IN', { dateStyle: 'medium' });
};

export const getStatusVariant = (value) => {
  if (!value) return 'default';
  const v = String(value).toLowerCase();
  if (v.includes('complete') || v.includes('process') || v.includes('deliver') || v.includes('dispatch')) return 'success';
  if (v.includes('pending') || v.includes('transit') || v.includes('open') || v.includes('partial')) return 'warning';
  if (v.includes('return') || v.includes('reject') || v.includes('cancel') || v.includes('fail')) return 'error';
  if (v.includes('approv')) return 'info';
  return 'default';
};

export const getSLAVariant = (value) => {
  if (!value) return 'success';
  const v = String(value).toLowerCase();
  return ['1', 'true', 't', 'y', 'yes'].includes(v) ? 'error' : 'success';
};
