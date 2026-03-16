import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/utils/date';
import { USER_ID } from '@/lib/env';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Database } from '@/lib/database.types';

type Win = Database['public']['Tables']['wins']['Row'];
type YesterdayWin = Pick<Win, 'id' | 'title' | 'category'>;

/**
 * useWins()
 *
 * Primary data hook: fetches today's wins, provides CRUD actions,
 * and roll-forward from yesterday's wins.
 *
 * STOPWATCH REMOVED — startTimer, pauseTimer, stopTimer commented out
 */
export function useWins() {
  const dayStartHour = useSettingsStore(s => s.settings.dayStartHour);
  const [wins, setWins] = useState<Win[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yesterdayWins, setYesterdayWins] = useState<YesterdayWin[]>([]);

  // Fetch today's and yesterday's wins on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchWins() {
      setLoading(true);
      setError(null);

      const today = getLocalDateString(new Date(), dayStartHour);
      const yd = new Date();
      yd.setDate(yd.getDate() - 1);
      const yesterday = getLocalDateString(yd, dayStartHour);

      const [todayResult, yesterdayResult] = await Promise.all([
        supabase
          .from('wins')
          .select('*')
          .eq('win_date', today)
          .eq('user_id', USER_ID)
          .order('created_at', { ascending: true }),
        supabase
          .from('wins')
          .select('title, id, category')
          .eq('win_date', yesterday)
          .eq('user_id', USER_ID),
      ]);

      if (cancelled) return;

      if (todayResult.error) {
        setError(todayResult.error.message);
      } else {
        setWins(todayResult.data ?? []);
      }

      if (!yesterdayResult.error) {
        setYesterdayWins(yesterdayResult.data ?? []);
      }

      setLoading(false);
    }

    fetchWins();
    return () => { cancelled = true; };
  }, [dayStartHour]);

  /**
   * addWin(title, category) — insert a new win for today, append optimistically
   */
  const addWin = useCallback(async (title: string, category: string = 'work') => {
    const today = getLocalDateString(new Date(), dayStartHour);
    const optimistic = {
      id: `optimistic-${Date.now()}`,
      user_id: USER_ID,
      title,
      category,
      win_date: today,
      status: 'pending',
      completed: false,
      // STOPWATCH REMOVED — timer_elapsed_seconds: 0, timer_started_at: null,
      created_at: new Date().toISOString(),
    };

    setWins((prev) => [...prev, optimistic]);

    const { data, error: insertError } = await supabase
      .from('wins')
      .insert({ user_id: USER_ID, title, category, win_date: today /* STOPWATCH REMOVED — timer_elapsed_seconds: 0, timer_started_at: null */ })
      .eq('user_id', USER_ID)
      .select()
      .single();

    if (insertError) {
      // Rollback optimistic insert
      setWins((prev) => prev.filter((w) => w.id !== optimistic.id));
      setError(insertError.message);
      return;
    }

    setWins((prev) => prev.map((w) => (w.id === optimistic.id ? data : w)));
    return data;
  }, [dayStartHour]);

  /**
   * editWin(id, newTitle) — update the title
   */
  const editWin = useCallback(async (id: string, newTitle: string) => {
    setWins((prev) => prev.map((w) => (w.id === id ? { ...w, title: newTitle } : w)));

    const { error: updateError } = await supabase
      .from('wins')
      .update({ title: newTitle })
      .eq('id', id)
      .eq('user_id', USER_ID);

    if (updateError) {
      setError(updateError.message);
    }
  }, []);

  /**
   * deleteWin(id) — remove a win
   */
  const deleteWin = useCallback(async (id: string) => {
    setWins((prev) => prev.filter((w) => w.id !== id));

    const { error: deleteError } = await supabase
      .from('wins')
      .delete()
      .eq('id', id)
      .eq('user_id', USER_ID);

    if (deleteError) {
      setError(deleteError.message);
    }
  }, []);

  /**
   * toggleWinCompleted(id) — flip the completed state of a win optimistically
   */
  const toggleWinCompleted = useCallback(async (id: string) => {
    const win = wins.find((w) => w.id === id);
    if (!win) return;

    const newValue = !win.completed;

    // Optimistic update
    setWins((prev) => prev.map((w) => (w.id === id ? { ...w, completed: newValue } : w)));

    const { error: updateError } = await supabase
      .from('wins')
      .update({ completed: newValue })
      .eq('id', id)
      .eq('user_id', USER_ID);

    if (updateError) {
      // Rollback
      setWins((prev) => prev.map((w) => (w.id === id ? { ...w, completed: !newValue } : w)));
      setError(updateError.message);
    }
  }, [wins]);

  /**
   * rollForward() — copy yesterday's wins to today
   */
  const rollForward = useCallback(async () => {
    if (yesterdayWins.length === 0) return;

    const today = getLocalDateString(new Date(), dayStartHour);
    const toInsert = yesterdayWins.map(({ title, category }) => ({
      user_id: USER_ID,
      title,
      category: category ?? 'work',
      win_date: today,
      // STOPWATCH REMOVED — timer_elapsed_seconds: 0, timer_started_at: null,
    }));

    const { data, error: insertError } = await supabase
      .from('wins')
      .insert(toInsert)
      .eq('user_id', USER_ID)
      .select();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setWins((prev) => [...prev, ...(data ?? [])]);
  }, [yesterdayWins, dayStartHour]);

  /* STOPWATCH REMOVED — startTimer, pauseTimer, stopTimer kept for potential re-enable
  const startTimer = useCallback(async (winId) => {
    const startedAt = new Date().toISOString();
    setWins((prev) =>
      prev.map((w) => (w.id === winId ? { ...w, timer_started_at: startedAt } : w))
    );

    const { error: updateError } = await supabase
      .from('wins')
      .update({ timer_started_at: startedAt })
      .eq('id', winId)
      .eq('user_id', USER_ID);

    if (updateError) {
      setError(updateError.message);
    }
  }, []);

  const pauseTimer = useCallback(async (winId, displaySeconds) => {
    setWins((prev) =>
      prev.map((w) =>
        w.id === winId
          ? { ...w, timer_elapsed_seconds: displaySeconds, timer_started_at: null }
          : w
      )
    );

    const { error: updateError } = await supabase
      .from('wins')
      .update({ timer_elapsed_seconds: displaySeconds, timer_started_at: null })
      .eq('id', winId)
      .eq('user_id', USER_ID);

    if (updateError) {
      setError(updateError.message);
    }
  }, []);

  const stopTimer = useCallback(async (winId, displaySeconds) => {
    return pauseTimer(winId, displaySeconds);
  }, [pauseTimer]);
  */ // END STOPWATCH REMOVED

  return {
    wins,
    loading,
    error,
    yesterdayWins,
    addWin,
    editWin,
    deleteWin,
    rollForward,
    toggleWinCompleted,
    // STOPWATCH REMOVED — startTimer, pauseTimer, stopTimer,
  };
}
