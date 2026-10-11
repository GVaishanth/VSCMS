import type { ReactNode } from 'react';
import { CHART_COLORS } from '../../utils/status';

export { CHART_COLORS };

/** Shared chart theme: hairline grid, muted axes, no gradient fills. */
export const CHART_THEME = {
  grid: '#E8EDF2',
  axis: '#94A3B8',
  axisLabel: '#64748B',
  fontSize: 11,
  cursor: 'rgba(37, 99, 235, 0.06)',
} as const;

export const AXIS_PROPS = {
  stroke: CHART_THEME.axis,
  tick: { fill: CHART_THEME.axisLabel, fontSize: CHART_THEME.fontSize },
  tickLine: false as const,
  axisLine: { stroke: CHART_THEME.grid },
};

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: {
  active?: boolean;
  payload?: { name?: string | number; value?: number | string; color?: string; dataKey?: string | number }[];
  label?: string | number;
  formatter?: (value: number | string, name: string) => ReactNode;
  labelFormatter?: (label: string | number) => ReactNode;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-card border border-line bg-surface px-2.5 py-2 shadow-pop">
      {label !== undefined && label !== null && label !== '' ? (
        <p className="mb-1 text-2xs font-semibold uppercase tracking-[0.06em] text-ink-muted">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      ) : null}
      <ul className="space-y-0.5">
        {payload.map((entry, i) => (
          <li key={`${entry.dataKey ?? entry.name ?? i}`} className="flex items-center gap-2 text-xs">
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ background: entry.color ?? CHART_THEME.axis }}
              aria-hidden="true"
            />
            <span className="text-ink-muted">{entry.name}</span>
            <span className="ml-auto font-semibold text-ink tnum">
              {formatter ? formatter(entry.value ?? 0, String(entry.name ?? '')) : entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Container that keeps charts from collapsing inside flex/grid panels. */
export function ChartFrame({ height = 220, children }: { height?: number; children: ReactNode }) {
  return (
    <div style={{ width: '100%', height }} className="min-w-0">
      {children}
    </div>
  );
}
