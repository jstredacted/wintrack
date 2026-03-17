import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { BalanceChange } from '@/types/finance';

interface UseBalanceHistoryResult {
  changes: BalanceChange[];
  lastChange: BalanceChange | null;
  loading: boolean;
  error: string | null;
  revertChange: (changeId: string) => Promise<void>;
  refetch: () => void;
}

export function useBalanceHistory(monthId: string | null): UseBalanceHistoryResult {
  const [changes, setChanges] = useState<BalanceChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  const refetch = useCallback(() => {
    setRefetchKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!monthId) {
      setChanges([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchChanges() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('balance_changes')
          .select('*')
          .eq('month_id', monthId)
          .order('created_at', { ascending: false });

        if (fetchError) throw new Error(fetchError.message);
        if (cancelled) return;

        setChanges((data ?? []) as BalanceChange[]);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load balance history');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchChanges();
    return () => { cancelled = true; };
  }, [monthId, refetchKey]);

  const lastChange = changes.length > 0 ? changes[0] : null;

  const revertChange = useCallback(
    async (changeId: string) => {
      const { error: rpcError } = await supabase.rpc('revert_balance_change', {
        p_change_id: changeId,
      });

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      refetch();
    },
    [refetch]
  );

  return { changes, lastChange, loading, error, revertChange, refetch };
}
