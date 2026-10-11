import { DatabaseZap, RefreshCw, ServerCrash, TriangleAlert } from 'lucide-react';
import type { ApiClientError } from '../../services/api';
import { Button } from './Button';

export interface ErrorStateProps {
  error: ApiClientError | null;
  onRetry?: () => void;
  compact?: boolean;
  title?: string;
}

/**
 * Errors are translated into operational language. Raw browser/driver internals
 * and stack traces are never shown.
 */
export function ErrorState({ error, onRetry, compact = false, title }: ErrorStateProps) {
  if (!error) return null;

  const offline = error.isOffline || error.code === 'NETWORK_ERROR';
  const Icon = offline ? DatabaseZap : error.status >= 500 ? ServerCrash : TriangleAlert;

  const heading = title ?? (offline ? 'Database unavailable' : 'Could not load this data');
  const body = offline
    ? 'This browser could not open the VSCMS database. Enable site data for this page, then retry. A VSCMS JSON backup can restore records.'
    : error.message;

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center text-center ${compact ? 'px-4 py-8' : 'px-6 py-12'}`}
    >
      <span className="flex size-9 items-center justify-center rounded-card border border-danger/25 bg-danger-soft text-danger">
        <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
      </span>
      <p className="mt-3 text-[13px] font-semibold text-ink">{heading}</p>
      <p className="mt-1 max-w-lg text-xs leading-relaxed text-ink-muted">{body}</p>
      {!offline && error.code !== 'NETWORK_ERROR' ? (
        <p className="mt-2 font-mono text-2xs text-ink-faint">
          {error.code}
          {error.status ? ` · HTTP ${error.status}` : ''}
        </p>
      ) : null}
      {onRetry ? (
        <div className="mt-3.5">
          <Button variant="secondary" size="sm" icon={<RefreshCw size={13} aria-hidden="true" />} onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}
    </div>
  );
}
