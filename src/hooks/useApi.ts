import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiClientError } from '../services/api';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: ApiClientError | null;
  offline: boolean;
  refetch: () => void;
  setData: (updater: T | ((prev: T | null) => T | null)) => void;
  reloadKey: number;
}

/**
 * Minimal data-fetching hook: loading / error / offline states, stale-response
 * protection and manual refetch. No external data library needed.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options: { enabled?: boolean; keepPrevious?: boolean } = {},
): AsyncState<T> {
  const { enabled = true, keepPrevious = false } = options;
  const [data, setDataState] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<ApiClientError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const requestId = useRef(0);
  const mounted = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const id = ++requestId.current;
    if (!keepPrevious) setDataState(null);
    setLoading(true);
    setError(null);

    fetcherRef
      .current()
      .then((result) => {
        if (!mounted.current || id !== requestId.current) return;
        setDataState(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!mounted.current || id !== requestId.current) return;
        const message = err instanceof Error ? err.message : 'Unexpected error.';
        const storageFailure =
          (typeof DOMException !== 'undefined' && err instanceof DOMException && ['AbortError', 'InvalidStateError', 'QuotaExceededError', 'SecurityError'].includes(err.name)) ||
          /IndexedDB|local data store|local data transaction|local data request/i.test(message);
        setError(err instanceof ApiClientError ? err : new ApiClientError({
          message: storageFailure ? 'VSCMS could not access this browser’s local store. Enable site storage for this page, then retry.' : message,
          code: storageFailure ? 'LOCAL_STORE_UNAVAILABLE' : 'LOCAL_OPERATION_FAILED',
          status: storageFailure ? 503 : 0,
        }));
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey, enabled, keepPrevious]);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  const setData = useCallback((updater: T | ((prev: T | null) => T | null)) => {
    setDataState((prev) => (typeof updater === 'function' ? (updater as (p: T | null) => T | null)(prev) : updater));
  }, []);

  return {
    data,
    loading,
    error,
    offline: Boolean(error?.isOffline),
    refetch,
    setData,
    reloadKey,
  };
}
