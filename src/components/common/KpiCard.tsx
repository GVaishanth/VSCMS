import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';

export type KpiTone = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'accent';

const TONE_BAR: Record<KpiTone, string> = {
  default: 'bg-line-strong',
  brand: 'bg-brand',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent',
};

const TONE_VALUE: Record<KpiTone, string> = {
  default: 'text-ink',
  brand: 'text-brand-deep',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  accent: 'text-accent-deep',
};

export interface KpiCardProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  tone?: KpiTone;
  hint?: ReactNode;
  delta?: { value: number; suffix?: string; invert?: boolean };
  to?: string;
  loading?: boolean;
  onClick?: () => void;
}

/**
 * Compact KPI tile: label (12px uppercase), value (26px), one line of context.
 * A 2px tone bar on the left is the only colour — no gradient, no large icon art.
 */
export function KpiCard({ label, value, icon: Icon, tone = 'default', hint, delta, loading = false, onClick }: KpiCardProps) {
  const interactive = Boolean(onClick);
  const deltaPositive = delta ? (delta.invert ? delta.value < 0 : delta.value > 0) : false;

  return (
    <div
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`surface relative overflow-hidden pl-4 ${interactive ? 'cursor-pointer transition-colors duration-100 hover:border-line-strong hover:bg-canvas/40' : ''}`}
    >
      <span className={`absolute inset-y-0 left-0 w-[3px] ${TONE_BAR[tone]}`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-3 py-3 pr-3.5">
        <div className="min-w-0 flex-1">
          <p className="card-label truncate">{label}</p>
          {loading ? (
            <div className="skeleton mt-2 h-6 w-20" />
          ) : (
            <p className={`metric-value mt-1.5 truncate ${TONE_VALUE[tone]}`}>{value}</p>
          )}
          {hint && !loading ? <p className="mt-1.5 truncate text-2xs text-ink-faint">{hint}</p> : null}
          {delta && !loading ? (
            <p
              className={`mt-1.5 inline-flex items-center gap-1 text-2xs font-medium ${
                deltaPositive ? 'text-success' : 'text-danger'
              }`}
            >
              {deltaPositive ? <TrendingUp size={12} aria-hidden="true" /> : <TrendingDown size={12} aria-hidden="true" />}
              {delta.value > 0 ? '+' : ''}
              {delta.value}
              {delta.suffix ?? ''}
            </p>
          ) : null}
        </div>
        {Icon ? (
          <span
            className={`flex size-7 shrink-0 items-center justify-center rounded-btn border border-line bg-canvas ${
              tone === 'default' ? 'text-ink-muted' : TONE_VALUE[tone]
            }`}
            aria-hidden="true"
          >
            <Icon size={15} strokeWidth={1.8} />
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function KpiSkeleton({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface relative overflow-hidden pl-4">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-line" aria-hidden="true" />
          <div className="py-3 pr-3.5">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton mt-2.5 h-6 w-16" />
            <div className="skeleton mt-2 h-2.5 w-20" />
          </div>
        </div>
      ))}
    </>
  );
}
