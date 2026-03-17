import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { USER_ID } from '@/lib/env';
import type { MonthlyBill, RecurrenceType } from '@/types/finance';

interface UseBillsResult {
  bills: MonthlyBill[];
  loading: boolean;
  error: string | null;
  togglePaid: (monthlyBillId: string, paid: boolean) => Promise<void>;
  addBill: (template: {
    name: string;
    amount: number;
    due_day: number | null;
    recurrence_type: RecurrenceType;
    recurrence_count?: number;
    recurrence_end?: string;
    start_month: string;
  }) => Promise<void>;
  deleteBill: (templateId: string) => Promise<void>;
  refetch: () => void;
}

export function useBills(monthId: string | null): UseBillsResult {
  const [bills, setBills] = useState<MonthlyBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  const refetch = useCallback(() => {
    setRefetchKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!monthId) {
      setBills([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchBills() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('monthly_bills')
          .select('*, bill_templates(*)')
          .eq('month_id', monthId);

        if (fetchError) throw new Error(fetchError.message);
        if (cancelled) return;

        setBills((data ?? []) as MonthlyBill[]);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load bills');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBills();
    return () => { cancelled = true; };
  }, [monthId, refetchKey]);

  const togglePaid = useCallback(
    async (monthlyBillId: string, paid: boolean) => {
      const { error: rpcError } = await supabase.rpc('apply_bill_paid', {
        p_monthly_bill_id: monthlyBillId,
        p_paid: paid,
      });

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      refetch();
    },
    [refetch]
  );

  const addBill = useCallback(
    async (template: {
      name: string;
      amount: number;
      due_day: number | null;
      recurrence_type: RecurrenceType;
      recurrence_count?: number;
      recurrence_end?: string;
      start_month: string;
    }) => {
      const { error: insertError } = await supabase
        .from('bill_templates')
        .insert({
          user_id: USER_ID,
          name: template.name,
          amount: template.amount,
          due_day: template.due_day,
          recurrence_type: template.recurrence_type,
          recurrence_count: template.recurrence_count ?? null,
          recurrence_end: template.recurrence_end ?? null,
          start_month: template.start_month,
        });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      // Repopulate monthly bills for current month
      if (monthId) {
        await supabase.rpc('populate_monthly_bills', {
          p_user_id: USER_ID,
          p_month_id: monthId,
          p_year: new Date().getFullYear(),
          p_month: new Date().getMonth() + 1,
        });
      }

      refetch();
    },
    [monthId, refetch]
  );

  const deleteBill = useCallback(
    async (templateId: string) => {
      const { error: deleteError } = await supabase
        .from('bill_templates')
        .delete()
        .eq('id', templateId);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      refetch();
    },
    [refetch]
  );

  return { bills, loading, error, togglePaid, addBill, deleteBill, refetch };
}
