import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { USER_ID } from '@/lib/env';
import { getMonthYear } from '@/lib/utils/month';
import type { Month, MonthlyIncome } from '@/types/finance';

interface MonthlyIncomeWithSource extends MonthlyIncome {
  income_sources?: {
    id: string;
    name: string;
    amount: number;
    currency: string;
    conversion_method: string;
    payday_day: number | null;
    active: boolean;
  };
}

interface UseFinanceResult {
  monthData: Month | null;
  incomes: MonthlyIncomeWithSource[];
  loading: boolean;
  error: string | null;
  updateBalance: (newBalance: number) => Promise<void>;
  updateBudgetLimit: (newLimit: number) => Promise<void>;
  toggleIncomeReceived: (
    monthlyIncomeId: string,
    received: boolean,
    netPhp?: number,
    exchangeRate?: number,
    feeAmount?: number
  ) => Promise<void>;
  refetch: () => void;
}

export function useFinance(selectedMonth: string): UseFinanceResult {
  const [monthData, setMonthData] = useState<Month | null>(null);
  const [incomes, setIncomes] = useState<MonthlyIncomeWithSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  const refetch = useCallback(() => {
    setRefetchKey((k) => k + 1);
  }, []);

  // Load month data + incomes on mount / month change
  useEffect(() => {
    let cancelled = false;

    async function loadMonth() {
      setLoading(true);
      setError(null);

      try {
        const { year, month } = getMonthYear(selectedMonth);

        // 1. Ensure month row exists (creates with carry-forward if needed)
        const { data: monthRow, error: rpcError } = await supabase.rpc(
          'ensure_month_exists',
          { p_user_id: USER_ID, p_year: year, p_month: month }
        );

        if (rpcError) throw new Error(rpcError.message);
        if (cancelled) return;

        setMonthData(monthRow as Month);

        // 2. Populate monthly_income from active sources (no-op if already exists)
        await supabase.rpc('populate_monthly_income', {
          p_user_id: USER_ID,
          p_month_id: (monthRow as Month).id,
        });

        if (cancelled) return;

        // 2b. Populate monthly_bills from active templates (no-op if already exists)
        await supabase.rpc('populate_monthly_bills', {
          p_user_id: USER_ID,
          p_month_id: (monthRow as Month).id,
          p_year: year,
          p_month: month,
        });

        if (cancelled) return;

        // 3. Fetch monthly_income joined with income_sources
        const { data: incomeData, error: incomeError } = await supabase
          .from('monthly_income')
          .select('*, income_sources(*)')
          .eq('month_id', (monthRow as Month).id);

        if (incomeError) throw new Error(incomeError.message);
        if (cancelled) return;

        setIncomes((incomeData ?? []) as MonthlyIncomeWithSource[]);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load month data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMonth();
    return () => {
      cancelled = true;
    };
  }, [selectedMonth, refetchKey]);

  const updateBalance = useCallback(
    async (newBalance: number) => {
      if (!monthData) return;

      // Optimistic update
      const prev = monthData.current_balance;
      setMonthData((m) => (m ? { ...m, current_balance: newBalance } : m));

      const { error: rpcError } = await supabase.rpc('apply_balance_override', {
        p_month_id: monthData.id,
        p_new_balance: newBalance,
        p_note: null,
      });

      if (rpcError) {
        // Rollback
        setMonthData((m) => (m ? { ...m, current_balance: prev } : m));
        setError(rpcError.message);
      }
    },
    [monthData]
  );

  const updateBudgetLimit = useCallback(
    async (newLimit: number) => {
      if (!monthData) return;

      const prev = monthData.budget_limit;
      setMonthData((m) => (m ? { ...m, budget_limit: newLimit } : m));

      const { error: updateError } = await supabase
        .from('months')
        .update({ budget_limit: newLimit })
        .eq('id', monthData.id)
        .eq('user_id', USER_ID);

      if (updateError) {
        setMonthData((m) => (m ? { ...m, budget_limit: prev } : m));
        setError(updateError.message);
      }
    },
    [monthData]
  );

  const toggleIncomeReceived = useCallback(
    async (
      monthlyIncomeId: string,
      received: boolean,
      netPhp?: number,
      exchangeRate?: number,
      feeAmount?: number
    ) => {
      const { error: rpcError } = await supabase.rpc('apply_income_received', {
        p_monthly_income_id: monthlyIncomeId,
        p_received: received,
        p_net_php: netPhp ?? null,
        p_exchange_rate: exchangeRate ?? null,
        p_fee_amount: feeAmount ?? null,
      });

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      // Refetch to get updated balance + income state
      refetch();
    },
    [refetch]
  );

  return {
    monthData,
    incomes,
    loading,
    error,
    updateBalance,
    updateBudgetLimit,
    toggleIncomeReceived,
    refetch,
  };
}
