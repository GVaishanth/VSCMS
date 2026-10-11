import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api';
import type { Lookups, MetaResponse } from '../types';

interface LookupsContextValue {
  lookups: Lookups | null;
  meta: MetaResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const LookupsContext = createContext<LookupsContextValue | null>(null);

const EMPTY_VOCAB: MetaResponse['vocabularies'] = {
  appointmentStatuses: ['BOOKED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
  bookingModes: ['ONLINE', 'PHONE', 'WALK_IN'],
  requestStatuses: ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
  paymentStatuses: ['PENDING', 'PARTIAL', 'PAID'],
  availabilityStatuses: ['AVAILABLE', 'BUSY', 'ON_LEAVE'],
  fuelTypes: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'],
  transmissions: ['Manual', 'Automatic'],
  serviceTypes: ['General Service', 'Oil Change', 'Brake Repair', 'AC Service'],
  partCategories: ['Lubricant', 'Filter', 'Brake', 'Electrical'],
};

/**
 * One shared load of the option lists used by every create/edit form, plus the
 * status vocabularies and options used by the browser-local workflows.
 */
export function LookupsProvider({ children }: { children: ReactNode }) {
  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lookupsResult, metaResult] = await Promise.all([api.lookups(), api.meta()]);
      setLookups(lookupsResult);
      setMeta(metaResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load reference data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ lookups, meta, loading, error, refresh }),
    [lookups, meta, loading, error, refresh],
  );

  return <LookupsContext.Provider value={value}>{children}</LookupsContext.Provider>;
}

export function useLookups(): LookupsContextValue {
  const ctx = useContext(LookupsContext);
  if (!ctx) throw new Error('useLookups must be used inside LookupsProvider');
  return ctx;
}

/** Vocabularies with a safe fallback so forms still render while loading. */
export function useVocabularies() {
  const { meta } = useLookups();
  return meta?.vocabularies ?? EMPTY_VOCAB;
}
