import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS_PROPS, CHART_THEME, ChartTooltip } from './theme';
import { formatMonth, moneyCompact } from '../../utils/format';

export interface RevenuePoint {
  month: string;
  revenue: number;
  collected?: number;
  labor?: number;
  parts?: number;
  invoices?: number;
}

export interface RevenueTrendChartProps {
  data: RevenuePoint[];
  height?: number;
  showCollected?: boolean;
}

/** Billed revenue by invoice month, with collected amount overlaid. */
export function RevenueTrendChart({ data, height = 220, showCollected = true }: RevenueTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity={0.16} />
            <stop offset="100%" stopColor="#2563EB" stopOpacity={0.01} />
          </linearGradient>
          <linearGradient id="collectedFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16803C" stopOpacity={0.14} />
            <stop offset="100%" stopColor="#16803C" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={CHART_THEME.grid} strokeDasharray="2 3" />
        <XAxis dataKey="month" tickFormatter={(v) => formatMonth(v)} {...AXIS_PROPS} />
        <YAxis width={58} tickFormatter={(v) => moneyCompact(Number(v))} {...AXIS_PROPS} />
        <Tooltip
          cursor={{ stroke: CHART_THEME.axis, strokeDasharray: '3 3' }}
          content={
            <ChartTooltip
              labelFormatter={(label) => formatMonth(label)}
              formatter={(value) => moneyCompact(Number(value))}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Billed"
          stroke="#2563EB"
          strokeWidth={1.8}
          fill="url(#revenueFill)"
          isAnimationActive={false}
          dot={false}
          activeDot={{ r: 3, strokeWidth: 0 }}
        />
        {showCollected ? (
          <Area
            type="monotone"
            dataKey="collected"
            name="Collected"
            stroke="#16803C"
            strokeWidth={1.6}
            fill="url(#collectedFill)"
            isAnimationActive={false}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        ) : null}
      </AreaChart>
    </ResponsiveContainer>
  );
}
