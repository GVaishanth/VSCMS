import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS_PROPS, CHART_THEME, CHART_COLORS, ChartTooltip } from './theme';
import { count } from '../../utils/format';

export interface ValueBarChartProps {
  data: { label: string; value: number; secondary?: number }[];
  height?: number;
  color?: string;
  multiColor?: boolean;
  valueFormatter?: (value: number) => string;
  secondaryName?: string;
  valueName?: string;
  horizontal?: boolean;
  labelWidth?: number;
}

/** Generic compact bar chart used across the Reports analytics panels. */
export function ValueBarChart({
  data,
  height = 220,
  color = '#0E2433',
  multiColor = false,
  valueFormatter = (v) => count(v),
  secondaryName,
  valueName = 'Total',
  horizontal = false,
  labelWidth = 92,
}: ValueBarChartProps) {
  if (!data.length) {
    return <p className="px-1 py-8 text-center text-xs text-ink-faint">No data to chart.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 6, right: 12, bottom: horizontal ? 0 : 4, left: 0 }}
        barGap={3}
      >
        <CartesianGrid
          horizontal={!horizontal}
          vertical={horizontal}
          stroke={CHART_THEME.grid}
          strokeDasharray="2 3"
        />
        {horizontal ? (
          <>
            <XAxis type="number" allowDecimals={false} {...AXIS_PROPS} tickFormatter={(v) => valueFormatter(Number(v))} />
            <YAxis type="category" dataKey="label" width={labelWidth} {...AXIS_PROPS} />
          </>
        ) : (
          <>
            <XAxis dataKey="label" {...AXIS_PROPS} interval={0} angle={data.length > 6 ? -20 : 0} textAnchor={data.length > 6 ? 'end' : 'middle'} height={data.length > 6 ? 48 : 26} />
            <YAxis width={56} {...AXIS_PROPS} tickFormatter={(v) => valueFormatter(Number(v))} />
          </>
        )}
        <Tooltip
          cursor={{ fill: CHART_THEME.cursor }}
          content={<ChartTooltip formatter={(value) => valueFormatter(Number(value))} />}
        />
        <Bar dataKey="value" name={valueName} radius={horizontal ? [0, 2, 2, 0] : [2, 2, 0, 0]} isAnimationActive={false} maxBarSize={26}>
          {multiColor
            ? data.map((entry, i) => <Cell key={entry.label} fill={CHART_COLORS[i % CHART_COLORS.length]} />)
            : <Cell fill={color} />}
        </Bar>
        {secondaryName && data.some((d) => d.secondary !== undefined) ? (
          <Bar
            dataKey="secondary"
            name={secondaryName}
            fill="#F28C28"
            radius={horizontal ? [0, 2, 2, 0] : [2, 2, 0, 0]}
            isAnimationActive={false}
            maxBarSize={26}
          />
        ) : null}
      </BarChart>
    </ResponsiveContainer>
  );
}
