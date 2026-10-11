import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api';
import type { DbStatus } from '../types';

interface DbStatusContextValue {
  status: DbStatus | null;
  loading: boolean;
  unreachable: boolean;
  lastChecked: string | null;
  refresh: () => Promise<void>;
}

const DbStatusContext = createContext<DbStatusContextValue | null>(null);

const POLL_MS = 30000;

/**
 * Shared database availability state. The top bar renders the compact indicator
 * from this context and every page can trigger a refresh after a mutation.
 */
export function DbStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<DbStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreachable, setUnreachable] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const health = await api.health();
      setStatus(health.database);
      setUnreachable(false);
    } catch {
      setStatus(null);
      setUnreachable(true);
    } finally {
      setLastChecked(new Date().toISOString());
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const value = useMemo(
    () => ({ status, loading, unreachable, lastChecked, refresh }),
    [status, loading, unreachable, lastChecked, refresh],
  );

  return <DbStatusContext.Provider value={value}>{children}</DbStatusContext.Provider>;
}

export function useDbStatus(): DbStatusContextValue {
  const ctx = useContext(DbStatusContext);
  if (!ctx) throw new Error('useDbStatus must be used inside DbStatusProvider');
  return ctx;
}
