import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/utils/date';
import { USER_ID } from '@/lib/env';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * useStreak(refreshKey?)
 *
 * Computes win streak, journal streak, and combined streak (both required per day).
 * Pass refreshKey from uiStore to force a refetch after relevant user actions.
 *
 * @returns {{ streak, journalStreak, combinedStreak, loading }}
 */
export function useStreak(refreshKey = 0) {
  const dayStartHour = useSettingsStore(s => s.settings.dayStartHour);
  const [streak, setStreak] = useState(0);
  const [journalStreak, setJournalStreak] = useState(0);
  const [combinedStreak, setCombinedStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchStreak() {
      setLoading(true);

      const { data, error } = await supabase
        .from('wins')
        .select('win_date')
        .eq('user_id', USER_ID)
        .eq('completed', true);

      if (cancelled) return;

      let completedDates = new Set<string>();
      if (!error && data) {
        completedDates = new Set(
          data
            .map((row) => row.win_date)
            .filter(Boolean)
        );

        let count = 0;
        let cursor = new Date();
        while (completedDates.has(getLocalDateString(cursor, dayStartHour))) {
          count++;
          cursor = new Date(cursor);
          cursor.setDate(cursor.getDate() - 1);
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
            return isNaN(d.getTime()) ? null : getLocalDateString(d, dayStartHour);
          })
          .filter(Boolean)
      );

      let jCount = 0;
      let jCursor = new Date();
      while (journalDates.has(getLocalDateString(jCursor, dayStartHour))) {
        jCount++;
        jCursor = new Date(jCursor);
        jCursor.setDate(jCursor.getDate() - 1);
      }
      setJournalStreak(jCount);

      // Combined streak: consecutive days where BOTH conditions are met
      const combinedDates = new Set(
        [...completedDates].filter(d => journalDates.has(d))
      );
      let cCount = 0;
      let cCursor = new Date();
      while (combinedDates.has(getLocalDateString(cCursor, dayStartHour))) {
        cCount++;
        cCursor = new Date(cCursor);
        cCursor.setDate(cCursor.getDate() - 1);
      }
      setCombinedStreak(cCount);

      setLoading(false);
    }

    fetchStreak();
    return () => { cancelled = true; };
  }, [refreshKey, dayStartHour]);

  return { streak, journalStreak, combinedStreak, loading };
}
