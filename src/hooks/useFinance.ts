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
  const [hasLoaded, setHasLoaded] = useState(false);

  const refetch = useCallback(() => {
    setRefetchKey((k) => k + 1);
  }, []);

  // Reset hasLoaded when month changes
  useEffect(() => {
    setHasLoaded(false);
  }, [selectedMonth]);

  // Load month data + incomes on mount / month change
  useEffect(() => {
    let cancelled = false;

    async function loadMonth() {
      // Only show loading spinner on initial load, not on refetch
      if (!hasLoaded) setLoading(true);
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

        // Normalize numeric fields from Supabase (returned as strings for numeric type)
        const normalized = monthRow as Month;
        normalized.current_balance = Number(normalized.current_balance);
        normalized.starting_balance = Number(normalized.starting_balance);
        normalized.budget_limit = Number(normalized.budget_limit);
        setMonthData(normalized);

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

        // Filter out incomes whose source has been deactivated
        const activeIncomes = (incomeData ?? []).filter(
          (i: MonthlyIncomeWithSource) => i.income_sources?.active !== false
        );
        setIncomes(activeIncomes as MonthlyIncomeWithSource[]);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load month data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setHasLoaded(true);
        }
      }
    }

    loadMonth();
    return () => {
      cancelled = true;
    };
  }, [selectedMonth, refetchKey, hasLoaded]);

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
        return;
      }

      // Refetch month data to sync local state with DB
      refetch();
    },
    [monthData, refetch]
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
      // Optimistic update
      const prevIncomes = incomes;
      setIncomes(prev => prev.map(i =>
        i.id === monthlyIncomeId
          ? {
              ...i,
              received,
              received_at: received ? new Date().toISOString() : null,
              net_php: received ? (netPhp ?? null) : null,
              exchange_rate: received ? (exchangeRate ?? null) : null,
              fee_amount: received ? (feeAmount ?? null) : null,
            }
          : i
      ));

      const { error: rpcError } = await supabase.rpc('apply_income_received', {
        p_monthly_income_id: monthlyIncomeId,
        p_received: received,
        p_net_php: netPhp ?? null,
        p_exchange_rate: exchangeRate ?? null,
        p_fee_amount: feeAmount ?? null,
      });

      if (rpcError) {
        // Revert
        setIncomes(prevIncomes);
        setError(rpcError.message);
        return;
      }

      // Refetch to get updated balance + income state
      refetch();
    },
    [incomes, refetch]
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
