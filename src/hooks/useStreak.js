import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/utils/date';
import { USER_ID } from '@/lib/env';

/**
 * useStreak(refreshKey?)
 *
 * Computes win streak, journal streak, and combined streak (both required per day).
 * Pass refreshKey from uiStore to force a refetch after relevant user actions.
 *
 * @returns {{ streak, journalStreak, combinedStreak, loading }}
 */
export function useStreak(refreshKey = 0) {
  const [streak, setStreak] = useState(0);
  const [journalStreak, setJournalStreak] = useState(0);
  const [combinedStreak, setCombinedStreak] = useState(0);
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

      let completedDates = new Set();
      if (!error && data) {
        completedDates = new Set(
          data
            .map((row) => row.wins?.win_date)
            .filter(Boolean)
        );

        let count = 0;
        let cursor = new Date();
        while (completedDates.has(getLocalDateString(cursor))) {
          count++;
          cursor = new Date(cursor.getTime() - 86400000);
        }
        setStreak(count);
      } else {
        setStreak(0);
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

      // Combined streak: consecutive days where BOTH conditions are met
      const combinedDates = new Set(
        [...completedDates].filter(d => journalDates.has(d))
      );
      let cCount = 0;
      let cCursor = new Date();
      while (combinedDates.has(getLocalDateString(cCursor))) {
        cCount++;
        cCursor = new Date(cCursor.getTime() - 86400000);
      }
      setCombinedStreak(cCount);

      setLoading(false);
    }

    fetchStreak();
    return () => { cancelled = true; };
  }, [refreshKey]);

  return { streak, journalStreak, combinedStreak, loading };
}
