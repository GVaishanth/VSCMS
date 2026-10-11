import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Link2 } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { Panel } from './Panel';

export interface RelatedRecordLink {
  to: string;
  label: ReactNode;
  detail?: ReactNode;
  trailing?: ReactNode;
}

interface RelatedRecordsPanelProps {
  title: string;
  subtitle?: string;
  records: RelatedRecordLink[];
  emptyTitle: string;
  emptyDescription: string;
}

/** Connected records are either navigable or explicitly explained as absent. */
export function RelatedRecordsPanel({
  title,
  subtitle,
  records,
  emptyTitle,
  emptyDescription,
}: RelatedRecordsPanelProps) {
  return (
    <Panel flush title={title} subtitle={subtitle}>
      {records.length ? (
        <ul className="divide-y divide-line-soft">
          {records.map((record, index) => (
            <li key={`${record.to}-${index}`}>
              <Link to={record.to} className="flex min-w-0 items-center gap-3 px-4 py-3 transition-colors hover:bg-canvas/70">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-btn border border-line bg-canvas text-ink-muted" aria-hidden="true">
                  <Link2 size={14} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink">{record.label}</span>
                  {record.detail ? <span className="mt-0.5 block truncate text-2xs text-ink-muted">{record.detail}</span> : null}
                </span>
                {record.trailing ? <span className="shrink-0">{record.trailing}</span> : null}
                <ChevronRight size={15} className="shrink-0 text-ink-faint" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={emptyTitle} description={emptyDescription} compact />
      )}
    </Panel>
  );
}
