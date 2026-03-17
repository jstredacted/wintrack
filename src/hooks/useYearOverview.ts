import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { USER_ID } from '@/lib/env';
import type { MonthSummary } from '@/types/finance';

interface UseYearOverviewResult {
  months: MonthSummary[];
  loading: boolean;
  error: string | null;
}

const MONTH_NAMES = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

function emptyMonth(year: number, monthNum: string): MonthSummary {
  return {
    month: `${year}-${monthNum}`,
    ending_balance: 0,
    starting_balance: 0,
    total_income: 0,
    total_expenses: 0,
    total_oneoff: 0,
  };
}

export function useYearOverview(year: number): UseYearOverviewResult {
  const [months, setMonths] = useState<MonthSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchOverview() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: rpcError } = await supabase.rpc('get_year_overview', {
          p_user_id: USER_ID,
          p_year: year,
        });

        if (rpcError) throw new Error(rpcError.message);
        if (cancelled) return;

        const dataArr = (data ?? []) as MonthSummary[];

        // Build lookup from returned data
        const lookup = new Map<string, MonthSummary>();
        for (const m of dataArr) {
          lookup.set(m.month, m);
        }

        // Fill in all 12 months
        const filled = MONTH_NAMES.map((num) => {
          const key = `${year}-${num}`;
          return lookup.get(key) ?? emptyMonth(year, num);
        });

        setMonths(filled);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load year overview');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchOverview();
    return () => {
      cancelled = true;
    };
  }, [year]);

  return { months, loading, error };
}
