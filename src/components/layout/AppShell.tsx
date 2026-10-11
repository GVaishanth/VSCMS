import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { DatabaseZap, RefreshCw } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useDbStatus } from '../../hooks/useDbStatus';
import { useLookups } from '../../hooks/useLookups';
import { Button } from '../common/Button';

const STORAGE_KEY = 'vscms.sidebar.collapsed';

export interface AppShellProps {
  /** Bumped to force every mounted screen to refetch. */
  onRefreshAll: () => void;
  refreshKey: number;
  children: ReactNode;
}

/** Dark navigation + light operational workspace. */
export function AppShell({ onRefreshAll, refreshKey, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const { pathname } = useLocation();
  const { status, unreachable, loading: checkingStorage, refresh: refreshDb } = useDbStatus();
  const { refresh: refreshLookups, meta } = useLookups();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  }, [pathname]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
    } catch {
      /* storage unavailable — the preference simply is not remembered */
    }
  }, [collapsed]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([refreshDb(), refreshLookups()]);
    onRefreshAll();
    window.setTimeout(() => setRefreshing(false), 450);
  }, [onRefreshAll, refreshDb, refreshLookups]);

  const connected = Boolean(status?.connected) && !unreachable;

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onOpenMobileNav={() => setMobileOpen(true)}
          onRefresh={() => void handleRefresh()}
          refreshing={refreshing}
        />

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-5 lg:px-6" key={refreshKey}>
          {!connected && !checkingStorage ? (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-card border border-danger/25 bg-danger-soft px-3.5 py-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-btn border border-danger/25 bg-surface text-danger">
                <DatabaseZap size={14} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-danger">Database unavailable</p>
                <p className="mt-0.5 text-xs leading-snug text-danger/85">
                  {status?.error ?? 'This browser could not open the VSCMS database. Enable site data for this page, then retry.'}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw size={13} aria-hidden="true" />}
                onClick={() => void handleRefresh()}
                loading={refreshing}
              >
Retry storage
              </Button>
            </div>
          ) : null}

          {children}
        </main>

        <footer className="border-t border-line px-4 py-3 sm:px-5 lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-2xs text-ink-faint">
            <p>
              VSCMS · Vehicle Service Center Management System · browser-local records
            </p>
            <p className="tnum">
              {meta?.schema ? `${meta.schema.tables} local object stores · saved on this browser` : 'Local store starting'}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
