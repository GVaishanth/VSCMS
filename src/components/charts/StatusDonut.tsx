import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CHART_THEME, ChartTooltip } from './theme';
import type { RequestStatus } from '../../types';
import { REQUEST_STATUS_COLOR, requestStatusStyle } from '../../utils/status';
import { count } from '../../utils/format';

export interface StatusDonutProps {
  data: { service_status: RequestStatus | string; total: number }[];
  height?: number;
  centerLabel?: string;
}

/**
 * Service request status distribution. The centre shows the real total, the
 * legend lists each status with its count — colours follow the status tokens.
 */
export function StatusDonut({ data, height = 200, centerLabel = 'Work orders' }: StatusDonutProps) {
  const rows = data.filter((d) => Number(d.total) > 0);
  const total = rows.reduce((acc, r) => acc + Number(r.total), 0);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative mx-auto shrink-0" style={{ width: 168, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={
                <ChartTooltip formatter={(value) => count(Number(value))} />
              }
            />
            <Pie
              data={rows}
              dataKey="total"
              nameKey="service_status"
              cx="50%"
              cy="50%"
              innerRadius={54}
              outerRadius={74}
              paddingAngle={rows.length > 1 ? 2 : 0}
              stroke="#FFFFFF"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {rows.map((row) => (
                <Cell
                  key={String(row.service_status)}
                  fill={REQUEST_STATUS_COLOR[String(row.service_status).toUpperCase()] ?? CHART_THEME.axis}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[24px] font-semibold leading-none tracking-[-0.02em] text-ink tnum">
            {count(total)}
          </span>
          <span className="mt-1 text-2xs uppercase tracking-[0.08em] text-ink-faint">{centerLabel}</span>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-1">
        {rows.length === 0 ? (
          <li className="text-xs text-ink-faint">No service requests recorded yet.</li>
        ) : (
          rows.map((row) => {
            const style = requestStatusStyle(row.service_status);
            const value = Number(row.total);
            const share = total ? (value / total) * 100 : 0;
            return (
              <li key={String(row.service_status)} className="flex items-center gap-2">
                <span
                  className="size-2 shrink-0 rounded-[2px]"
                  style={{ background: REQUEST_STATUS_COLOR[String(row.service_status).toUpperCase()] ?? CHART_THEME.axis }}
                  aria-hidden="true"
                />
                <span className="w-24 shrink-0 truncate text-xs text-ink">{style.label}</span>
                <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-line-soft">
                  <span
                    className="block h-full rounded-full transition-[width] duration-300"
                    style={{
                      width: `${share}%`,
                      background: REQUEST_STATUS_COLOR[String(row.service_status).toUpperCase()] ?? CHART_THEME.axis,
                    }}
                  />
                </span>
                <span className="w-8 shrink-0 text-right text-xs font-semibold text-ink tnum">{count(value)}</span>
                <span className="w-10 shrink-0 text-right text-2xs text-ink-faint tnum">{share.toFixed(0)}%</span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
