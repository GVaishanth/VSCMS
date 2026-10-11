import type { StatusStyle } from '../../utils/status';

export interface StatusBadgeProps {
  status: StatusStyle;
  size?: 'sm' | 'md';
  withIcon?: boolean;
  withDot?: boolean;
  title?: string;
}

/**
 * Status pill: tinted background, matching border, 13px dot or 13px line icon.
 * Deliberately quiet — status is scannable, never decorative.
 */
export function StatusBadge({ status, size = 'md', withIcon = true, withDot = false, title }: StatusBadgeProps) {
  const Icon = status.icon;
  const padding = size === 'sm' ? 'px-1.5 py-[1px] text-2xs gap-1' : 'px-2 py-0.5 text-xs gap-1.5';
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-btn border font-medium ${padding} ${status.className}`}
      title={title ?? status.label}
    >
      {withDot ? (
        <span className={`size-1.5 shrink-0 rounded-full ${status.dotClassName}`} aria-hidden="true" />
      ) : null}
      {withIcon && !withDot ? <Icon size={size === 'sm' ? 11 : 12} strokeWidth={2.1} aria-hidden="true" /> : null}
      <span className="truncate">{status.label}</span>
    </span>
  );
}

export function Dot({ className, label }: { className: string; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-1.5 shrink-0 rounded-full ${className}`} aria-hidden="true" />
      {label ? <span className="text-xs text-ink-muted">{label}</span> : null}
    </span>
  );
}
