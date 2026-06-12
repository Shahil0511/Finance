import { motion } from 'framer-motion';
import {
  Area, Bar, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import ChartCard from '../ui/ChartCard';
import ErrorCard from '../ui/ErrorCard';
import EmptyState from '../ui/EmptyState';
import { cleanAggParams } from '../../store/useFilterStore';
import { useThemeStore } from '../../store/useThemeStore';
import { formatCompact, formatCurrency, formatNumber } from '../../utils/formatters';

const sum = (rows, key) => rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);

const rangeLabel = (from, to) => {
  const fmt = (s) =>
    s ? new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';
  return from && to ? `${fmt(from)} – ${fmt(to)}` : 'Current window';
};

const PALETTE = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#f43f5e', '#84cc16', '#ec4899', '#14b8a6', '#f97316'];

const dayTick = (d) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

/** Theme-aware axis/grid colors (SVG attrs can't resolve CSS variables). */
function useChartTheme() {
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  return {
    tick: { fill: isDark ? '#8b9bb3' : '#64748b', fontSize: 11 },
    grid: isDark ? 'rgba(148,163,184,0.12)' : 'rgba(100,116,139,0.16)',
  };
}

/** Tooltip rendered as HTML so it themes via the design tokens. */
function ChartTip({ active, payload, label, labelFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-pop">
      {label != null && (
        <p className="mb-1 font-semibold text-card-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      {payload.map((p) => (
        <p key={p.dataKey ?? p.name} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="inline-block size-2 rounded-full" style={{ background: p.color || p.payload?.fill }} aria-hidden="true" />
          {p.name}: <span className="font-medium tabular-nums text-card-foreground">{p.formatter ? p.formatter(p.value) : formatNumber(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

function Donut({ data, dataKey, nameKey = 'key', formatter }) {
  const total = data.reduce((s, d) => s + d[dataKey], 0);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey={dataKey} nameKey={nameKey} innerRadius="55%" outerRadius="80%" paddingAngle={2} strokeWidth={0}>
          {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Pie>
        <Tooltip content={<ChartTip />} formatter={(v, n) => [
          `${formatter ? formatter(v) : formatNumber(v)} (${total ? Math.round((v / total) * 100) : 0}%)`, n,
        ]} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          formatter={(value, entry) => (
            <span className="text-xs text-muted-foreground">
              {value}
              {Number.isFinite(entry?.payload?.percent) && (
                <span className="ml-1 font-medium text-foreground/80">
                  {Math.round(entry.payload.percent * 100)}%
                </span>
              )}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function HBars({ data, dataKey, color, formatter, theme }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} layout="vertical" margin={{ left: 8, right: 12, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke={theme.grid} />
        <XAxis type="number" tick={theme.tick} tickFormatter={formatCompact} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="key" width={104} tick={theme.tick} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTip />} formatter={(v, n) => [formatter ? formatter(v) : formatNumber(v), n]} cursor={{ fill: theme.grid }} />
        <Bar dataKey={dataKey} name={dataKey} fill={color} radius={[0, 6, 6, 0]} maxBarSize={18} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function SalesCharts({ data, loading, theme }) {
  const daily = data?.daily ?? [];
  const byChannel = data?.byChannel ?? [];
  const byBrand = data?.byBrand ?? [];
  const byPayment = data?.byPayment ?? [];
  const byState = data?.byState ?? [];
  const byCategory = data?.byCategory ?? [];

  // Once loaded, hide charts whose bucket came back empty — an empty card
  // teaches nothing. While loading, all skeletons render.
  const show = (rows) => loading || rows.length > 0;

  if (!loading && !daily.length) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-soft">
        <EmptyState
          title="No analytics for this window"
          description="Try widening the date range or clearing some filters."
        />
      </div>
    );
  }

  const legend = (
    <Legend
      verticalAlign="top"
      align="right"
      height={28}
      iconType="circle"
      iconSize={8}
      formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
    />
  );

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
      <ChartCard
        title="Revenue & Orders Trend"
        subtitle="Daily over the selected window"
        stat={formatCurrency(sum(daily, 'revenue'))}
        loading={loading}
        className="lg:col-span-2"
        index={0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={daily} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={theme.grid} />
            <XAxis dataKey="day" tick={theme.tick} tickFormatter={dayTick} axisLine={false} tickLine={false} />
            <YAxis yAxisId="rev" tick={theme.tick} tickFormatter={formatCompact} axisLine={false} tickLine={false} width={52} />
            <YAxis yAxisId="ord" orientation="right" tick={theme.tick} tickFormatter={formatCompact} axisLine={false} tickLine={false} width={44} />
            <Tooltip
              content={<ChartTip labelFormatter={dayTick} />}
              formatter={(v, n) => [n === 'Revenue' ? formatCurrency(v) : formatNumber(v), n]}
            />
            {legend}
            <Area yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#rev)" />
            <Line yAxisId="ord" type="monotone" dataKey="orders" name="Orders" stroke="#8b5cf6" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      {show(byChannel) && (
        <ChartCard title="Channel Share" subtitle="Revenue by sales channel" loading={loading} index={1}>
          <Donut data={byChannel} dataKey="revenue" formatter={formatCurrency} />
        </ChartCard>
      )}

      <ChartCard
        title="Units & SLA Breaches"
        subtitle="Dispatched units vs SLA misses per day"
        stat={formatNumber(sum(daily, 'units'))}
        loading={loading}
        className="lg:col-span-2"
        index={2}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={daily} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={theme.grid} />
            <XAxis dataKey="day" tick={theme.tick} tickFormatter={dayTick} axisLine={false} tickLine={false} />
            <YAxis yAxisId="units" tick={theme.tick} tickFormatter={formatCompact} axisLine={false} tickLine={false} width={48} />
            <YAxis yAxisId="sla" orientation="right" tick={theme.tick} tickFormatter={formatCompact} axisLine={false} tickLine={false} width={40} />
            <Tooltip content={<ChartTip labelFormatter={dayTick} />} formatter={(v, n) => [formatNumber(v), n]} />
            {legend}
            <Bar yAxisId="units" dataKey="units" name="Units" fill="#06b6d4" radius={[6, 6, 0, 0]} maxBarSize={26} />
            <Line yAxisId="sla" type="monotone" dataKey="slaBreached" name="SLA Breached" stroke="#f43f5e" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      {show(byPayment) && (
        <ChartCard title="Payment Mix" subtitle="Prepaid vs COD revenue" loading={loading} index={3}>
          <Donut data={byPayment} dataKey="revenue" formatter={formatCurrency} />
        </ChartCard>
      )}

      {show(byBrand) && (
        <ChartCard title="Top Brands" subtitle="By revenue" loading={loading} index={4}>
          <HBars data={byBrand.slice(0, 8)} dataKey="revenue" color="#8b5cf6" formatter={formatCurrency} theme={theme} />
        </ChartCard>
      )}

      {show(byCategory) && (
        <ChartCard title="Category Share" subtitle="Revenue by category" loading={loading} index={5}>
          <Donut data={byCategory.slice(0, 8)} dataKey="revenue" formatter={formatCurrency} />
        </ChartCard>
      )}

      {show(byState) && (
        <ChartCard title="Top States" subtitle="By revenue" loading={loading} index={6}>
          <HBars data={byState.slice(0, 8)} dataKey="revenue" color="#10b981" formatter={formatCurrency} theme={theme} />
        </ChartCard>
      )}
    </div>
  );
}

function ReturnsCharts({ data, loading, theme }) {
  const daily = data?.daily ?? [];
  const byChannel = data?.byChannel ?? [];
  const byStatus = data?.byStatus ?? [];
  const byBrand = data?.byBrand ?? [];

  const show = (rows) => loading || rows.length > 0;
  const totalReturns = sum(daily, 'returns');
  const totalValue = sum(daily, 'value');

  if (!loading && !daily.length) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-soft">
        <EmptyState
          title="No analytics for this window"
          description="Try widening the date range or clearing some filters."
        />
      </div>
    );
  }

  const legend = (
    <Legend
      verticalAlign="top"
      align="right"
      height={28}
      iconType="circle"
      iconSize={8}
      formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
    />
  );

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
      <ChartCard
        title="Returns Trend"
        subtitle="Daily count and forward value"
        stat={formatNumber(totalReturns)}
        loading={loading}
        className="lg:col-span-2"
        index={0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={daily} margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={theme.grid} />
            <XAxis dataKey="day" tick={theme.tick} tickFormatter={dayTick} axisLine={false} tickLine={false} />
            <YAxis yAxisId="cnt" tick={theme.tick} tickFormatter={formatCompact} axisLine={false} tickLine={false} width={44} />
            <YAxis yAxisId="val" orientation="right" tick={theme.tick} tickFormatter={formatCompact} axisLine={false} tickLine={false} width={52} />
            <Tooltip
              content={<ChartTip labelFormatter={dayTick} />}
              formatter={(v, n) => [n === 'Value' ? formatCurrency(v) : formatNumber(v), n]}
            />
            {legend}
            <Bar yAxisId="cnt" dataKey="returns" name="Returns" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={26} />
            <Line yAxisId="val" type="monotone" dataKey="value" name="Value" stroke="#f43f5e" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      {show(byChannel) && (
        <ChartCard title="Returns by Channel" subtitle="Share of return count" loading={loading} index={1}>
          <Donut data={byChannel} dataKey="returns" />
        </ChartCard>
      )}

      {show(byStatus) && (
        <ChartCard title="Return Status" subtitle="Count by status" loading={loading} index={2}>
          <HBars data={byStatus.slice(0, 8)} dataKey="returns" color="#06b6d4" theme={theme} />
        </ChartCard>
      )}

      <ChartCard
        title="Avg Value per Return"
        subtitle="Daily forward value ÷ returns"
        stat={formatCurrency(totalReturns ? totalValue / totalReturns : 0)}
        loading={loading}
        index={3}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={daily.map((d) => ({ ...d, avg: d.returns ? d.value / d.returns : 0 }))}
            margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke={theme.grid} />
            <XAxis dataKey="day" tick={theme.tick} tickFormatter={dayTick} axisLine={false} tickLine={false} />
            <YAxis tick={theme.tick} tickFormatter={formatCompact} axisLine={false} tickLine={false} width={48} />
            <Tooltip content={<ChartTip labelFormatter={dayTick} />} formatter={(v) => [formatCurrency(v), 'Avg value']} />
            <Line type="monotone" dataKey="avg" name="Avg value" stroke="#10b981" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      {show(byBrand) && (
        <ChartCard title="Most Returned Brands" subtitle="By return count" loading={loading} index={4}>
          <HBars data={byBrand.slice(0, 8)} dataKey="returns" color="#f59e0b" theme={theme} />
        </ChartCard>
      )}
    </div>
  );
}

/** Config-driven charts section — powered by one GROUPING SETS query per report
    (report.analytics hook), sharing the page's applied filters. */
export default function ChartsPanel({ report }) {
  const { filters } = report.store();
  const { analytics: useAnalytics } = report;
  const { data, isLoading, isFetching, isError, error, refetch } = useAnalytics(cleanAggParams(filters));
  const theme = useChartTheme();

  if (isError) {
    return <ErrorCard compact message={error?.data?.detail || 'Could not load charts'} onRetry={refetch} />;
  }

  const Charts = report.charts === 'returns' ? ReturnsCharts : SalesCharts;

  return (
    <section aria-label={`${report.title} charts`} className="relative">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Analytics</h2>
        <span className="text-xs font-medium text-muted-foreground">
          {rangeLabel(filters.dateFrom, filters.dateTo)}
        </span>
      </div>
      {isFetching && !isLoading && (
        <div className="absolute left-0 right-0 top-7 z-10 h-0.5 overflow-hidden rounded-full" aria-hidden="true">
          <motion.div
            className="h-full bg-primary"
            style={{ width: '45%' }}
            animate={{ x: ['-120%', '260%'] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: [0.4, 0, 0.6, 1] }}
          />
        </div>
      )}
      <Charts data={data} loading={isLoading} theme={theme} />
    </section>
  );
}
