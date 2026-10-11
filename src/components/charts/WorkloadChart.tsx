import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS_PROPS, CHART_THEME, ChartTooltip } from './theme';
import { count } from '../../utils/format';
import type { Mechanic } from '../../types';

export interface WorkloadChartProps {
  data: Mechanic[];
  height?: number;
}

/**
 * Workshop workload: active jobs stacked against completed jobs per technician.
 * Horizontal orientation keeps names readable without rotation.
 */
export function WorkloadChart({ data, height = 260 }: WorkloadChartProps) {
  const rows = data.map((m) => ({
    name: (m.mechanic_name ?? `${m.first_name} ${m.last_name}`).split(' ')[0] ?? '—',
    full: m.mechanic_name ?? `${m.first_name} ${m.last_name}`,
    active: Number(m.active_jobs ?? 0),
    completed: Number(m.completed_jobs ?? 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }} barGap={2}>
        <CartesianGrid horizontal={false} stroke={CHART_THEME.grid} strokeDasharray="2 3" />
        <XAxis type="number" allowDecimals={false} {...AXIS_PROPS} />
        <YAxis
          type="category"
          dataKey="name"
          width={78}
          {...AXIS_PROPS}
          tick={{ fill: CHART_THEME.axisLabel, fontSize: 11 }}
        />
        <Tooltip
          cursor={{ fill: CHART_THEME.cursor }}
          content={<ChartTooltip formatter={(value) => count(Number(value))} />}
        />
        <Bar dataKey="active" name="Active" stackId="jobs" fill="#B7791F" radius={[0, 0, 0, 0]} isAnimationActive={false} maxBarSize={14} />
        <Bar dataKey="completed" name="Completed" stackId="jobs" fill="#16803C" radius={[0, 2, 2, 0]} isAnimationActive={false} maxBarSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}
