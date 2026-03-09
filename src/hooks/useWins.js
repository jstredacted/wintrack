import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/lib/utils/date';

const USER_ID = import.meta.env.VITE_USER_ID;

/**
 * useWins()
 *
 * Primary data hook: fetches today's wins, provides CRUD actions,
 * timer controls, and roll-forward from yesterday's wins.
 *
 * @returns {{
 *   wins: Array,
 *   loading: boolean,
 *   error: string|null,
 *   yesterdayWins: Array,
 *   addWin: (title: string) => Promise<void>,
 *   editWin: (id: string, newTitle: string) => Promise<void>,
 *   deleteWin: (id: string) => Promise<void>,
 *   rollForward: () => Promise<void>,
 *   startTimer: (winId: string) => Promise<void>,
 *   pauseTimer: (winId: string, displaySeconds: number) => Promise<void>,
 *   stopTimer: (winId: string, displaySeconds: number) => Promise<void>,
 * }}
 */
export function useWins() {
  const [wins, setWins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [yesterdayWins, setYesterdayWins] = useState([]);

  // Fetch today's and yesterday's wins on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchWins() {
      setLoading(true);
      setError(null);

      const today = getLocalDateString();
      const yesterday = getLocalDateString(new Date(Date.now() - 86400000));

      const [todayResult, yesterdayResult] = await Promise.all([
        supabase
          .from('wins')
          .select('*')
          .eq('win_date', today)
          .eq('user_id', USER_ID)
          .order('created_at', { ascending: true }),
        supabase
          .from('wins')
          .select('title, id')
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
  }, []);

  /**
   * addWin(title) — insert a new win for today, append optimistically
   */
  const addWin = useCallback(async (title) => {
    const today = getLocalDateString();
    const optimistic = {
      id: `optimistic-${Date.now()}`,
      user_id: USER_ID,
      title,
      win_date: today,
      status: 'pending',
      timer_elapsed_seconds: 0,
      timer_started_at: null,
      created_at: new Date().toISOString(),
    };

    setWins((prev) => [...prev, optimistic]);

    const { data, error: insertError } = await supabase
      .from('wins')
      .insert({ user_id: USER_ID, title, win_date: today, timer_elapsed_seconds: 0, timer_started_at: null })
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
  }, []);

  /**
   * editWin(id, newTitle) — update the title
   */
  const editWin = useCallback(async (id, newTitle) => {
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
  const deleteWin = useCallback(async (id) => {
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
   * rollForward() — copy yesterday's wins to today with zeroed timer fields
   */
  const rollForward = useCallback(async () => {
    if (yesterdayWins.length === 0) return;

    const today = getLocalDateString();
    const toInsert = yesterdayWins.map(({ title }) => ({
      user_id: USER_ID,
      title,
      win_date: today,
      timer_elapsed_seconds: 0,
      timer_started_at: null,
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
  }, [yesterdayWins]);

  /**
   * startTimer(winId) — set timer_started_at to now
   */
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

  /**
   * pauseTimer(winId, displaySeconds) — snapshot elapsed, clear startedAt
   * Snapshot elapsed BEFORE clearing startedAt (critical ordering).
   */
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

  /**
   * stopTimer(winId, displaySeconds) — identical to pauseTimer for Phase 2
   */
  const stopTimer = useCallback(async (winId, displaySeconds) => {
    return pauseTimer(winId, displaySeconds);
  }, [pauseTimer]);

  return {
    wins,
    loading,
    error,
    yesterdayWins,
    addWin,
    editWin,
    deleteWin,
    rollForward,
    startTimer,
    pauseTimer,
    stopTimer,
  };
}
