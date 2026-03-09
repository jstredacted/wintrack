import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/utils/date';

const USER_ID = import.meta.env.VITE_USER_ID;

/**
 * useStreak()
 *
 * Computes the current streak: consecutive days (back from today) where
 * at least one win has a check_in row with completed=true.
 * Also computes journalStreak: consecutive days with at least one journal entry.
 *
 * Uses check_ins joined to wins for win_date — check_ins has no win_date column.
 * Uses getLocalDateString() throughout — never toISOString().slice(0,10).
 *
 * @returns {{ streak: number, journalStreak: number, loading: boolean }}
 */
export function useStreak() {
  const [streak, setStreak] = useState(0);
  const [journalStreak, setJournalStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchStreak() {
      setLoading(true);

      const { data, error } = await supabase
        .from('check_ins')
        .select('win_id, wins(win_date)')
        .eq('user_id', USER_ID)
        .eq('completed', true);

      if (cancelled) return;

      if (error || !data) {
        setStreak(0);
      } else {
        // Build a Set of distinct dates that have at least one completed win
        const completedDates = new Set(
          data
            .map((row) => row.wins?.win_date)
            .filter(Boolean)
        );

        // Count consecutive days backward from today
        let count = 0;
        let cursor = new Date();

        while (completedDates.has(getLocalDateString(cursor))) {
          count++;
          cursor = new Date(cursor.getTime() - 86400000);
        }

        setStreak(count);
      }

      const { data: journalData } = await supabase
        .from('journal_entries')
        .select('created_at')
        .eq('user_id', USER_ID);

      if (cancelled) return;

      const journalDates = new Set(
        (journalData ?? [])
          .filter(row => row.created_at)
          .map(row => {
            const d = new Date(row.created_at);
            return isNaN(d.getTime()) ? null : getLocalDateString(d);
          })
          .filter(Boolean)
      );

      let jCount = 0;
      let jCursor = new Date();
      while (journalDates.has(getLocalDateString(jCursor))) {
        jCount++;
        jCursor = new Date(jCursor.getTime() - 86400000);
      }
      setJournalStreak(jCount);

      setLoading(false);
    }

    fetchStreak();
    return () => { cancelled = true; };
  }, []);

  return { streak, journalStreak, loading };
}
