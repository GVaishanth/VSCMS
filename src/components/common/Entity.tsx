import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { initials } from '../../utils/format';

/** Inline record link inside a table cell. */
export function EntityLink({
  to,
  children,
  className = '',
  title,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <Link
      to={to}
      title={title}
      data-no-row-click="true"
      className={`font-medium text-ink underline-offset-2 transition-colors duration-75 hover:text-brand hover:underline ${className}`}
    >
      {children}
    </Link>
  );
}

/** Monospaced identifier — registration numbers, chassis, invoice numbers. */
export function MonoValue({ value, className = '' }: { value: ReactNode; className?: string }) {
  return <span className={`font-mono text-xs tracking-tight text-ink ${className}`}>{value}</span>;
}

export function MutedValue({ value, className = '' }: { value: ReactNode; className?: string }) {
  return <span className={`text-xs text-ink-muted ${className}`}>{value ?? '—'}</span>;
}

export interface AvatarProps {
  first?: string | null;
  last?: string | null;
  name?: string | null;
  size?: 'sm' | 'md';
  tone?: 'navy' | 'neutral';
}

/** Two-letter monogram. No photographs, no illustrations. */
export function Avatar({ first, last, name, size = 'md', tone = 'neutral' }: AvatarProps) {
  const [a, b] = (name ?? '').split(' ');
  const text = initials(first ?? a, last ?? b);
  const sizeClass = size === 'sm' ? 'size-6 text-2xs' : 'size-8 text-xs';
  const toneClass =
    tone === 'navy' ? 'border-navy-line bg-navy-soft text-white' : 'border-line bg-canvas text-ink-muted';
  return (
    <span
      className={`inline-flex ${sizeClass} shrink-0 items-center justify-center rounded-btn border font-semibold tracking-wide ${toneClass}`}
      aria-hidden="true"
    >
      {text}
    </span>
  );
}

/** Person cell: monogram + name + secondary line. */
export function PersonCell({
  name,
  secondary,
  to,
  size = 'md',
}: {
  name: string;
  secondary?: ReactNode;
  to?: string;
  size?: 'sm' | 'md';
}) {
  const [first, ...rest] = name.split(' ');
  const content = (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar first={first} last={rest.join(' ')} size={size} />
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium text-ink">{name}</span>
        {secondary ? <span className="block truncate text-2xs text-ink-muted">{secondary}</span> : null}
      </span>
    </span>
  );
  if (!to) return content;
  return (
    <Link
      to={to}
      data-no-row-click="true"
      className="group block rounded-btn transition-opacity hover:opacity-90"
    >
      {content}
    </Link>
  );
}

/** Numeric cell with tabular figures, right aligned by convention. */
export function NumericCell({
  value,
  className = '',
  muted = false,
}: {
  value: ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return <span className={`tnum ${muted ? 'text-ink-muted' : 'text-ink'} ${className}`}>{value}</span>;
}
