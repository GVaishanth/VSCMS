import type { ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
  ariaLabel?: string;
}

/** Underline tabs — compact, keyboard accessible, no pill shapes. */
export function Tabs({ items, active, onChange, className = '', ariaLabel = 'Sections' }: TabsProps) {
  return (
    <div className={`border-b border-line ${className}`} role="tablist" aria-label={ariaLabel}>
      <div className="flex gap-0.5 overflow-x-auto scrollbar-thin">
        {items.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => onChange(item.id)}
              onKeyDown={(e) => {
                if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
                const enabled = items.filter((i) => !i.disabled);
                const index = enabled.findIndex((i) => i.id === item.id);
                const next =
                  e.key === 'ArrowRight'
                    ? enabled[(index + 1) % enabled.length]
                    : enabled[(index - 1 + enabled.length) % enabled.length];
                if (next) onChange(next.id);
              }}
              className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-2 text-[13px] font-medium transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-40 ${
                selected ? 'text-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {item.icon}
              {item.label}
              {typeof item.count === 'number' ? (
                <span
                  className={`rounded-btn px-1.5 py-px text-2xs font-semibold tnum ${
                    selected ? 'bg-brand-soft text-brand-deep' : 'bg-canvas text-ink-faint'
                  }`}
                >
                  {item.count}
                </span>
              ) : null}
              <span
                aria-hidden="true"
                className={`absolute inset-x-1.5 -bottom-px h-[2px] rounded-t-sm transition-colors duration-100 ${
                  selected ? 'bg-brand' : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TabPanel({
  id,
  active,
  children,
  className = '',
}: {
  id: string;
  active: string;
  children: ReactNode;
  className?: string;
}) {
  if (id !== active) return null;
  return (
    <div id={`panel-${id}`} role="tabpanel" aria-labelledby={`tab-${id}`} className={className}>
      {children}
    </div>
  );
}
