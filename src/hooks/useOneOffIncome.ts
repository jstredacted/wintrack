import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { USER_ID } from '@/lib/env';
import type { OneOffIncome } from '@/types/finance';

interface UseOneOffIncomeResult {
  entries: OneOffIncome[];
  loading: boolean;
  error: string | null;
  addEntry: (amount: number, date: string, note: string) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  updateEntry: (id: string, fields: { amount?: number; date?: string; note?: string }) => Promise<void>;
  refetch: () => void;
}

export function useOneOffIncome(monthId: string | null): UseOneOffIncomeResult {
  const [entries, setEntries] = useState<OneOffIncome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  const refetch = useCallback(() => {
    setRefetchKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!monthId) {
      setEntries([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchEntries() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('oneoff_income')
          .select('*')
          .eq('month_id', monthId)
          .order('date', { ascending: false });

        if (fetchError) throw new Error(fetchError.message);
        if (cancelled) return;

        setEntries((data ?? []) as OneOffIncome[]);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load one-off income');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchEntries();
    return () => { cancelled = true; };
  }, [monthId, refetchKey]);

  const addEntry = useCallback(
    async (amount: number, date: string, note: string) => {
      const { error: rpcError } = await supabase.rpc('apply_oneoff_income', {
        p_user_id: USER_ID,
        p_month_id: monthId,
        p_amount: amount,
        p_date: date,
        p_note: note,
      });

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      refetch();
    },
    [monthId, refetch]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      const { error: rpcError } = await supabase.rpc('delete_oneoff_income', {
        p_oneoff_id: id,
      });

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      refetch();
    },
    [refetch]
  );

  const updateEntry = useCallback(
    async (id: string, fields: { amount?: number; date?: string; note?: string }) => {
      const { error: updateError } = await supabase
        .from('oneoff_income')
        .update(fields)
        .eq('id', id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      refetch();
    },
    [refetch]
  );

  return { entries, loading, error, addEntry, deleteEntry, updateEntry, refetch };
}
