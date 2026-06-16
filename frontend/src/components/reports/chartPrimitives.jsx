import {
  Bar, CartesianGrid, Cell, ComposedChart, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useThemeStore } from '../../store/useThemeStore';
import { formatCompact, formatNumber } from '../../utils/formatters';

export const sum = (rows, key) => rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);

/* Vivid product palette — bright, high-energy series colors. */
export const PALETTE = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#06b6d4', '#f43f5e', '#84cc16', '#ec4899', '#14b8a6', '#f97316'];

export const dayTick = (d) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

/** Theme-aware axis/grid colors (SVG attrs can't resolve CSS variables). */
export function useChartTheme() {
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  return {
    tick: { fill: isDark ? '#8e8e96' : '#6b7280', fontSize: 11 },
    grid: isDark ? 'rgba(160,160,170,0.12)' : 'rgba(120,120,130,0.16)',
  };
}

/** Tooltip rendered as HTML so it themes via the design tokens. */
export function ChartTip({ active, payload, label, labelFormatter }) {
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

export function Donut({ data, dataKey, nameKey = 'key', formatter }) {
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

export function HBars({ data, dataKey, color, formatter, theme }) {
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
