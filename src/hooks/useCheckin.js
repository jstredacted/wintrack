import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const USER_ID = import.meta.env.VITE_USER_ID;

/**
 * useCheckin()
 *
 * Provides check-in submission and today-status utilities.
 *
 * @returns {{
 *   submitCheckin: (answers: Array<{winId: string, completed: boolean, note: string|null}>) => Promise<{error: object|null}>,
 *   hasCheckedInToday: (winIds: string[]) => Promise<boolean>,
 * }}
 */
export function useCheckin() {
  /**
   * submitCheckin(answers) — inserts one check_in row per answer.
   * answers: [{ winId, completed, note }]
   * Returns { error } — null on success.
   */
  const submitCheckin = useCallback(async (answers) => {
    if (!answers || answers.length === 0) return { error: null };

    const rows = answers.map(({ winId, completed, note }) => ({
      user_id: USER_ID,
      win_id: winId,
      completed,
      note: note || null,
    }));

    const { error } = await supabase
      .from('check_ins')
      .insert(rows);

    return { error: error ?? null };
  }, []);

  /**
   * hasCheckedInToday(winIds) — true if any of today's win IDs appear in check_ins.
   * winIds: string[] — typically the IDs from today's wins array.
   * Returns boolean.
   */
  const hasCheckedInToday = useCallback(async (winIds) => {
    if (!winIds || winIds.length === 0) return false;

    const { data, error } = await supabase
      .from('check_ins')
      .select('id')
      .eq('user_id', USER_ID)
      .in('win_id', winIds);

    if (error || !data) return false;
    return data.length > 0;
  }, []);

  return { submitCheckin, hasCheckedInToday };
}
