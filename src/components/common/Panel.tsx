import type { ReactNode } from 'react';

export interface PanelProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Removes padding so a table or list can sit flush against the panel edges. */
  flush?: boolean;
  footer?: ReactNode;
  id?: string;
}

/**
 * The primary surface: 8px radius, 1px border, near-invisible shadow.
 * Borders carry the structure — not shadows.
 */
export function Panel({
  title,
  subtitle,
  actions,
  children,
  className = '',
  bodyClassName = '',
  flush = false,
  footer,
  id,
}: PanelProps) {
  return (
    <section className={`surface flex min-w-0 flex-col ${className}`} id={id}>
      {(title || actions) && (
        <header className="panel-header">
          <div className="min-w-0">
            {title ? <h2 className="panel-title truncate">{title}</h2> : null}
            {subtitle ? <p className="panel-subtitle mt-0.5 truncate">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      )}
      <div className={flush ? `min-w-0 flex-1 ${bodyClassName}` : `min-w-0 flex-1 p-4 ${bodyClassName}`}>{children}</div>
      {footer ? <footer className="border-t border-line px-4 py-2.5">{footer}</footer> : null}
    </section>
  );
}

export interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/** Page-level heading block used at the top of every screen. */
export function SectionHeading({ eyebrow, title, description, actions, className = '' }: SectionHeadingProps) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow mb-1.5">{eyebrow}</p> : null}
        <h1 className="page-title">{title}</h1>
        {description ? <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export interface DefinitionItem {
  label: string;
  value: ReactNode;
  mono?: boolean;
  span?: 1 | 2;
}

/** Compact label/value grid used across every detail screen. */
export function DefinitionGrid({
  items,
  columns = 2,
  className = '',
}: {
  items: DefinitionItem[];
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const gridClass =
    columns === 1
      ? 'grid-cols-1'
      : columns === 3
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        : columns === 4
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          : 'grid-cols-1 sm:grid-cols-2';

  return (
    <dl className={`grid gap-x-6 gap-y-3 ${gridClass} ${className}`}>
      {items.map((item) => (
        <div key={item.label} className={item.span === 2 ? 'sm:col-span-2' : undefined}>
          <dt className="card-label">{item.label}</dt>
          <dd className={`mt-1 text-[13px] text-ink ${item.mono ? 'font-mono text-xs' : ''}`}>
            {item.value === null || item.value === undefined || item.value === '' ? (
              <span className="text-ink-faint">—</span>
            ) : (
              item.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Small inline statistic used inside panels. */
export function InlineStat({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'brand';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-success'
      : tone === 'warning'
        ? 'text-warning'
        : tone === 'danger'
          ? 'text-danger'
          : tone === 'brand'
            ? 'text-brand'
            : 'text-ink';
  return (
    <div className="min-w-0">
      <p className="card-label truncate">{label}</p>
      <p className={`mt-1 text-[20px] font-semibold leading-none tracking-[-0.01em] tnum ${toneClass}`}>{value}</p>
      {hint ? <p className="mt-1 truncate text-2xs text-ink-faint">{hint}</p> : null}
    </div>
  );
}
