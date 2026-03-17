import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { USER_ID } from '@/lib/env';
import type { IncomeSource } from '@/types/finance';

type NewSource = Pick<IncomeSource, 'name' | 'amount' | 'currency' | 'conversion_method'> & {
  payday_day?: number | null;
};
type SourceUpdates = Partial<Pick<IncomeSource, 'name' | 'amount' | 'currency' | 'conversion_method' | 'payday_day'>>;

interface UseIncomeConfigResult {
  sources: IncomeSource[];
  loading: boolean;
  error: string | null;
  addSource: (source: NewSource) => Promise<void>;
  updateSource: (id: string, updates: SourceUpdates) => Promise<void>;
  removeSource: (id: string) => Promise<void>;
}

export function useIncomeConfig(): UseIncomeConfigResult {
  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSources() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('income_sources')
        .select('*')
        .eq('user_id', USER_ID)
        .eq('active', true)
        .order('name', { ascending: true });

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setSources((data ?? []) as IncomeSource[]);
      }

      setLoading(false);
    }

    fetchSources();
    return () => {
      cancelled = true;
    };
  }, []);

  const addSource = useCallback(async (source: NewSource) => {
    const toInsert = {
      user_id: USER_ID,
      active: true,
      name: source.name,
      amount: source.amount,
      currency: source.currency,
      conversion_method: source.conversion_method,
      payday_day: source.payday_day ?? null,
    };

    // Optimistic append with temp id
    const optimistic = {
      ...toInsert,
      id: `optimistic-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as IncomeSource;

    setSources((prev) => [...prev, optimistic].sort((a, b) => a.name.localeCompare(b.name)));

    const { data, error: insertError } = await supabase
      .from('income_sources')
      .insert(toInsert)
      .eq('user_id', USER_ID)
      .select()
      .single();

    if (insertError) {
      // Rollback
      setSources((prev) => prev.filter((s) => s.id !== optimistic.id));
      setError(insertError.message);
      return;
    }

    // Replace optimistic with real
    setSources((prev) =>
      prev.map((s) => (s.id === optimistic.id ? (data as IncomeSource) : s))
    );
  }, []);

  const updateSource = useCallback(async (id: string, updates: SourceUpdates) => {
    // Optimistic update
    const prev = sources;
    setSources((curr) =>
      curr.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );

    const { error: updateError } = await supabase
      .from('income_sources')
      .update(updates)
      .eq('id', id)
      .eq('user_id', USER_ID);

    if (updateError) {
      setSources(prev);
      setError(updateError.message);
    }
  }, [sources]);

  const removeSource = useCallback(async (id: string) => {
    // Optimistic remove
    const prev = sources;
    setSources((curr) => curr.filter((s) => s.id !== id));

    const { error: updateError } = await supabase
      .from('income_sources')
      .update({ active: false })
      .eq('id', id)
      .eq('user_id', USER_ID);

    if (updateError) {
      setSources(prev);
      setError(updateError.message);
    }
  }, [sources]);

  return { sources, loading, error, addSource, updateSource, removeSource };
}
