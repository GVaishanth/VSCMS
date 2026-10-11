import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ListQuery } from '../services/api';

export interface TableStateOptions {
  defaultSort: string;
  defaultOrder?: 'ASC' | 'DESC';
  defaultLimit?: number;
  filterKeys?: string[];
}

export interface TableState {
  search: string;
  page: number;
  limit: number;
  sort: string;
  order: 'ASC' | 'DESC';
  filters: Record<string, string>;
  query: ListQuery;
  setSearch: (value: string) => void;
  setPage: (page: number) => void;
  setFilter: (key: string, value: string | null) => void;
  clearFilters: () => void;
  toggleSort: (column: string) => void;
  reset: () => void;
  activeFilterCount: number;
}

/**
 * Table state (search, page, sort, filters) kept in the URL so list screens are
 * linkable, shareable and survive a refresh.
 */
export function useTableState(options: TableStateOptions): TableState {
  const { defaultSort, defaultOrder = 'ASC', defaultLimit = 25, filterKeys = [] } = options;
  const [params, setParams] = useSearchParams();

  const search = params.get('search') ?? '';
  const page = Math.max(1, Number(params.get('page') ?? 1) || 1);
  const limit = Number(params.get('limit') ?? defaultLimit) || defaultLimit;
  const sort = params.get('sort') ?? defaultSort;
  const order = (params.get('order') ?? defaultOrder).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  const filters = useMemo(() => {
    const out: Record<string, string> = {};
    for (const key of filterKeys) {
      const value = params.get(key);
      if (value) out[key] = value;
    }
    return out;
  }, [params, filterKeys]);

  const update = useCallback(
    (changes: Record<string, string | null>, resetPage = true) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === '') next.delete(key);
            else next.set(key, value);
          }
          if (resetPage && !('page' in changes)) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const setSearch = useCallback((value: string) => update({ search: value || null }), [update]);
  const setPage = useCallback((value: number) => update({ page: value > 1 ? String(value) : null }, false), [update]);
  const setFilter = useCallback(
    (key: string, value: string | null) => update({ [key]: value }),
    [update],
  );
  const clearFilters = useCallback(() => {
    const changes: Record<string, null> = {};
    for (const key of filterKeys) changes[key] = null;
    update(changes);
  }, [update, filterKeys]);

  const toggleSort = useCallback(
    (column: string) => {
      if (column === sort) {
        update({ order: order === 'ASC' ? 'DESC' : 'ASC' }, false);
      } else {
        update({ sort: column, order: 'ASC' }, false);
      }
    },
    [sort, order, update],
  );

  const reset = useCallback(() => {
    setParams(new URLSearchParams(), { replace: true });
  }, [setParams]);

  const query = useMemo<ListQuery>(
    () => ({ search: search || undefined, page, limit, sort, order, ...filters }),
    [search, page, limit, sort, order, filters],
  );

  const activeFilterCount = Object.keys(filters).length + (search ? 1 : 0);

  return {
    search,
    page,
    limit,
    sort,
    order,
    filters,
    query,
    setSearch,
    setPage,
    setFilter,
    clearFilters,
    toggleSort,
    reset,
    activeFilterCount,
  };
}
