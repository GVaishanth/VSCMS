import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}

/** Neutral empty state — a line icon and one sentence, never an illustration. */
export function EmptyState({ icon: Icon = Inbox, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'px-4 py-8' : 'px-6 py-14'}`}>
      <span className="flex size-9 items-center justify-center rounded-card border border-line bg-canvas text-ink-faint">
        <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
      </span>
      <p className="mt-3 text-[13px] font-semibold text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-3.5">{action}</div> : null}
    </div>
  );
}
