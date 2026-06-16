import { motion } from 'framer-motion';
import {
  Area, Bar, CartesianGrid, ComposedChart, Legend, Line,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import ChartCard from '../ui/ChartCard';
import ErrorCard from '../ui/ErrorCard';
import EmptyState from '../ui/EmptyState';
import { formatCompact, formatCurrency, formatNumber } from '../../utils/formatters';
import { ChartTip, Donut, HBars, dayTick, sum, useChartTheme } from './chartPrimitives';
import { SALES_REPORT } from '../../config/reports';
import { useGetSalesAnalyticsQuery } from '../../features/sales/salesApi';
import { cleanAggParams, useSalesFilterStore } from '../../store/useFilterStore';

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
      <div className="rounded-lg border border-border bg-card shadow-soft">
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
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
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
            <Area yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2} fill="url(#rev)" />
            <Line yAxisId="ord" type="monotone" dataKey="orders" name="Orders" stroke="#a855f7" strokeWidth={2} dot={false} />
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
          <HBars data={byBrand.slice(0, 8)} dataKey="revenue" color="#a855f7" formatter={formatCurrency} theme={theme} />
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

export default function SalesChartsPanel() {
  const filters = useSalesFilterStore((s) => s.filters);
  const { data, isLoading, isFetching, isError, error, refetch } = useGetSalesAnalyticsQuery(cleanAggParams(filters));
  const theme = useChartTheme();

  if (isError) {
    return <ErrorCard compact message={error?.data?.detail || 'Could not load charts'} onRetry={refetch} />;
  }

  return (
    <section aria-label={`${SALES_REPORT.title} charts`} className="relative">
      <h2 className="mb-2.5 text-[13px] font-semibold text-foreground">Analytics</h2>
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
      <SalesCharts data={data} loading={isLoading} theme={theme} />
    </section>
  );
}
