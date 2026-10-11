import type { ReactNode, SelectHTMLAttributes } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

export interface FilterSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  allLabel?: string;
  width?: string;
}

/** Compact labelled select used in table toolbars and forms. */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel = 'All',
  width = 'w-auto',
  id,
  className = '',
  ...rest
}: FilterSelectProps) {
  const selectId = id ?? `filter-${label?.replace(/\s+/g, '-').toLowerCase() ?? 'select'}`;
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${width}`}>
      {label ? (
        <label htmlFor={selectId} className="text-2xs font-medium uppercase tracking-[0.06em] text-ink-faint">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`select ${className}`}
        {...rest}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export interface ToolbarProps {
  children: ReactNode;
  activeFilters?: number;
  onClearFilters?: () => void;
  className?: string;
}

/** Filter row above a table, with an explicit "clear" affordance. */
export function Toolbar({ children, activeFilters = 0, onClearFilters, className = '' }: ToolbarProps) {
  return (
    <div className={`flex flex-wrap items-end gap-2 ${className}`}>
      <span className="flex items-center gap-1.5 pb-2 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-faint">
        <SlidersHorizontal size={12} aria-hidden="true" />
        Filters
      </span>
      {children}
      {activeFilters > 0 && onClearFilters ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="btn-ghost btn-sm mb-0.5 inline-flex items-center gap-1"
        >
          <X size={12} aria-hidden="true" />
          Clear {activeFilters > 1 ? `(${activeFilters})` : ''}
        </button>
      ) : null}
    </div>
  );
}

/** Small inline key/value meta strip used above tables and in detail headers. */
export function MetaStrip({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-baseline gap-1.5">
          <dt className="text-2xs uppercase tracking-[0.06em] text-ink-faint">{item.label}</dt>
          <dd className="text-xs font-medium text-ink tnum">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
