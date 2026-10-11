import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Database, Download, Info, Menu, RefreshCw, Upload, X } from 'lucide-react';
import { useDbStatus } from '../../hooks/useDbStatus';
import { useLookups } from '../../hooks/useLookups';
import { exportSnapshot, importSnapshot } from '../../services/localDb';
import { routeMeta } from '../../navigation';
import { IconButton } from '../common/Button';

/** Compact browser-local persistence indicator. */
export function DbStatusIndicator() {
  const { status, unreachable, loading } = useDbStatus();
  const connected = Boolean(status?.connected) && !unreachable;

  const dotClass = loading && !status ? 'bg-ink-faint' : connected ? 'bg-success' : 'bg-danger';
  const label = loading && !status ? 'Checking database' : connected ? 'Database is ready' : 'Database unavailable';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-btn border px-2 py-1 text-xs font-medium transition-colors ${
        connected ? 'border-success/25 bg-success-soft text-success' : 'border-danger/25 bg-danger-soft text-danger'
      }`}
      title={
        connected
          ? 'The VSCMS database is ready in this browser profile.'
          : status?.error ?? 'The VSCMS database is unavailable in this browser.'
      }
      role="status"
      aria-live="polite"
    >
      <span className="relative flex size-1.5" aria-hidden="true">
        <span className={`absolute inline-flex size-full rounded-full ${dotClass} ${connected ? 'opacity-70' : 'animate-pulse'}`} />
        <span className={`relative inline-flex size-1.5 rounded-full ${dotClass}`} />
      </span>
      {label}
    </span>
  );
}

/** Local IndexedDB status and browser-backup controls. */
function SystemInfoPopover({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { status, refresh: refreshStatus } = useDbStatus();
  const { meta, refresh: refreshLookups } = useLookups();
  const ref = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [coords, setCoords] = useState({ top: 0, right: 8 });
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  const downloadBackup = async () => {
    setBackupBusy(true);
    setBackupMessage(null);
    try {
      const backup = await exportSnapshot();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vscms-local-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setBackupMessage('Backup downloaded. Keep it somewhere safe.');
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : 'Could not export the local backup.');
    } finally {
      setBackupBusy(false);
    }
  };

  const restoreBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!window.confirm('Restore this backup? It will replace all VSCMS records stored in this browser.')) return;
    setBackupBusy(true);
    setBackupMessage(null);
    try {
      await importSnapshot(JSON.parse(await file.text()));
      await Promise.all([refreshStatus(), refreshLookups()]);
      setBackupMessage('Backup restored. Reloading the current records…');
      window.setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      setBackupMessage(error instanceof Error ? error.message : 'Could not restore this backup.');
    } finally {
      setBackupBusy(false);
    }
  };

  useEffect(() => {
    if (open) void refreshStatus();
  }, [open, refreshStatus]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    const trigger = document.getElementById('system-info-trigger');
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      setCoords({ top: rect.bottom + 6, right: Math.max(8, window.innerWidth - rect.right) });
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const schema = meta?.schema;

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label="Database and backup information"
      className="fixed z-[80] w-[320px] animate-slide-up rounded-card border border-line bg-surface p-3.5 shadow-pop"
      style={{ top: coords.top, right: coords.right }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-btn border border-line bg-canvas text-ink-muted">
            <Database size={14} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[13px] font-semibold leading-tight text-ink">VSCMS database</p>
            <p className="text-2xs text-ink-muted">Browser-local records · this device only</p>
          </div>
        </div>
        <IconButton label="Close" size="sm" icon={<X size={13} aria-hidden="true" />} onClick={onClose} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-3">
        {[
          ['Collections', schema?.tables],
          ['Work orders', status?.requestCount?.toLocaleString('en-IN')],
          ['Open work orders', status?.openRequestCount?.toLocaleString('en-IN')],
          ['Stored rows', status?.recordCount?.toLocaleString('en-IN')],
          ['Shared database', 'No'],
          ['API server', 'Not required'],
          ['Hosting', 'GitHub Pages'],
          ['Persistence', status?.connected ? 'Ready' : 'Unavailable'],
          ['Backup', 'Manual JSON'],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex items-baseline justify-between gap-2">
            <dt className="text-2xs text-ink-muted">{label}</dt>
            <dd className="text-xs font-semibold text-ink tnum">{value ?? '—'}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 border-t border-line pt-3">
        <p className="text-2xs leading-relaxed text-ink-muted">Records are stored in this browser profile and are not shared or automatically backed up. Export a JSON backup before changing devices or clearing browser data.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => void downloadBackup()} disabled={backupBusy} className="btn-secondary btn-sm inline-flex items-center justify-center gap-1.5">
            <Download size={13} aria-hidden="true" /> Export JSON
          </button>
          <button type="button" onClick={() => fileInput.current?.click()} disabled={backupBusy} className="btn-secondary btn-sm inline-flex items-center justify-center gap-1.5">
            <Upload size={13} aria-hidden="true" /> Import JSON
          </button>
          <input ref={fileInput} type="file" accept="application/json,.json" className="sr-only" onChange={restoreBackup} />
        </div>
        {backupMessage ? <p className="mt-2 text-2xs text-ink-muted" role="status">{backupMessage}</p> : null}
      </div>
    </div>,
    document.body,
  );
}

export interface TopBarProps {
  onOpenMobileNav: () => void;
  onRefresh: () => void;
  refreshing?: boolean;
}

/**
 * Clean top bar: current page title on the left, database readiness,
 * refresh and backup controls on the right.
 */
export function TopBar({ onOpenMobileNav, onRefresh, refreshing = false }: TopBarProps) {
  const { pathname } = useLocation();
  const meta = routeMeta(pathname);
  const [infoOpen, setInfoOpen] = useState(false);
  const { status, unreachable } = useDbStatus();
  const connected = Boolean(status?.connected) && !unreachable;

  return (
    <header className="app-topbar sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur-[2px]">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-5">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          className="inline-flex size-8 items-center justify-center rounded-btn border border-line text-ink-muted transition-colors hover:bg-canvas hover:text-ink xl:hidden"
        >
          <Menu size={16} aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {meta.group ? (
              <span className="hidden text-2xs font-semibold uppercase tracking-[0.12em] text-ink-faint sm:inline">
                {meta.group}
                <span className="mx-1.5 text-line-strong">/</span>
              </span>
            ) : null}
            <h1 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">{meta.title}</h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <DbStatusIndicator />
          <IconButton
            label="Refresh data"
            icon={<RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />}
            onClick={onRefresh}
            className="border-line bg-surface"
          />
          <button
            id="system-info-trigger"
            type="button"
            onClick={() => setInfoOpen((v) => !v)}
            aria-expanded={infoOpen}
            aria-label="Database and backup information"
            title="Local storage and backup information"
            className={`inline-flex size-7 items-center justify-center rounded-btn border transition-colors duration-100 ${
              infoOpen
                ? 'border-line-strong bg-canvas text-ink'
                : connected
                  ? 'border-line bg-surface text-ink-muted hover:bg-canvas hover:text-ink'
                  : 'border-danger/30 bg-danger-soft text-danger hover:brightness-95'
            }`}
          >
            <Info size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      <SystemInfoPopover open={infoOpen} onClose={() => setInfoOpen(false)} />
    </header>
  );
}
