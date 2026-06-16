import { motion } from 'framer-motion';
import {
  Bar, CartesianGrid, ComposedChart, Legend, Line,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import ChartCard from '../ui/ChartCard';
import ErrorCard from '../ui/ErrorCard';
import EmptyState from '../ui/EmptyState';
import { formatCompact, formatCurrency, formatNumber } from '../../utils/formatters';
import { ChartTip, Donut, HBars, dayTick, sum, useChartTheme } from './chartPrimitives';
import { RETURNS_REPORT } from '../../config/reports';
import { useGetReturnsAnalyticsQuery } from '../../features/returns/returnsApi';
import { cleanAggParams, useReturnsFilterStore } from '../../store/useFilterStore';

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
            <Bar yAxisId="cnt" dataKey="returns" name="Returns" fill="#a855f7" radius={[6, 6, 0, 0]} maxBarSize={26} />
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

export default function ReturnsChartsPanel() {
  const filters = useReturnsFilterStore((s) => s.filters);
  const { data, isLoading, isFetching, isError, error, refetch } = useGetReturnsAnalyticsQuery(cleanAggParams(filters));
  const theme = useChartTheme();

  if (isError) {
    return <ErrorCard compact message={error?.data?.detail || 'Could not load charts'} onRetry={refetch} />;
  }

  return (
    <section aria-label={`${RETURNS_REPORT.title} charts`} className="relative">
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
      <ReturnsCharts data={data} loading={isLoading} theme={theme} />
    </section>
  );
}
