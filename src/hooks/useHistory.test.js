import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useHistory } from './useHistory';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    then: vi.fn((resolve) => resolve({ data: [], error: null })),
    catch: vi.fn().mockReturnThis(),
  },
}));

// HISTORY-01: fetchWinsForDate returns wins with completion status
// HISTORY-02: completionMap builds { 'YYYY-MM-DD': boolean } from wins.completed
// Wave 0 stub — all tests fail with module-not-found until Wave 1 creates useHistory.js

/**
 * buildHistoryMock(resolvedValue)
 *
 * Creates a chainable Supabase query mock that supports:
 *   supabase.from('wins').select('win_date, completed').eq('user_id', USER_ID)
 *   supabase.from('wins').select('id, title, category, completed').eq(...).eq('win_date', date)
 *
 * The mock object is thenable so it can be awaited at any point in the chain.
 */
function buildHistoryMock(resolvedValue) {
  const mock = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    then: (resolve) => Promise.resolve(resolvedValue).then(resolve),
    catch: (reject) => Promise.resolve(resolvedValue).catch(reject),
  };
  mock.select.mockReturnValue(mock);
  mock.eq.mockReturnValue(mock);
  mock.order.mockReturnValue(mock);
  return mock;
}

describe('useHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('completionMap', () => {
    it('starts with loading=true then loading=false after fetch', async () => {
      const { supabase } = await import('@/lib/supabase');
      supabase.from.mockReturnValue(buildHistoryMock({ data: [], error: null }));

      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.completionMap).toEqual({});
    });

    it('completionMap["2026-03-09"] === true when win.completed is true', async () => {
      const { supabase } = await import('@/lib/supabase');
      supabase.from.mockReturnValue(
        buildHistoryMock({
          data: [{ win_date: '2026-03-09', completed: true }],
          error: null,
        })
      );

      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.completionMap['2026-03-09']).toBe(true);
    });

    it('completionMap["2026-03-08"] === false when win.completed is false', async () => {
      const { supabase } = await import('@/lib/supabase');
      supabase.from.mockReturnValue(
        buildHistoryMock({
          data: [{ win_date: '2026-03-08', completed: false }],
          error: null,
        })
      );

      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.completionMap['2026-03-08']).toBe(false);
    });

    it('completionMap is true for date when at least one win is completed', async () => {
      const { supabase } = await import('@/lib/supabase');
      supabase.from.mockReturnValue(
        buildHistoryMock({
          data: [
            { win_date: '2026-03-07', completed: true },
            { win_date: '2026-03-07', completed: false },
          ],
          error: null,
        })
      );

      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.completionMap['2026-03-07']).toBe(true);
    });

    it('completionMap contains both true and false entries for multiple wins on different dates', async () => {
      const { supabase } = await import('@/lib/supabase');
      supabase.from.mockReturnValue(
        buildHistoryMock({
          data: [
            { win_date: '2026-03-09', completed: true },
            { win_date: '2026-03-08', completed: false },
          ],
          error: null,
        })
      );

      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.completionMap['2026-03-09']).toBe(true);
      expect(result.current.completionMap['2026-03-08']).toBe(false);
    });

    it('completionMap is {} when data array is empty', async () => {
      const { supabase } = await import('@/lib/supabase');
      supabase.from.mockReturnValue(buildHistoryMock({ data: [], error: null }));

      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.completionMap).toEqual({});
    });

    it('completionMap is {} when fetch returns error', async () => {
      const { supabase } = await import('@/lib/supabase');
      supabase.from.mockReturnValue(buildHistoryMock({ data: null, error: { message: 'DB error' } }));

      const { result } = renderHook(() => useHistory());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.completionMap).toEqual({});
    });
  });

  describe('fetchWinsForDate', () => {
    it('calls supabase.from("wins").select(...).eq("win_date", date) and returns data array', async () => {
      const { supabase } = await import('@/lib/supabase');
      const mapMock = buildHistoryMock({ data: [], error: null });
      const dateMock = buildHistoryMock({
        data: [
          { id: 'win-1', title: 'Ship the feature', completed: true },
        ],
        error: null,
      });
      supabase.from.mockReturnValueOnce(mapMock).mockReturnValueOnce(dateMock);

      const { result } = renderHook(() => useHistory());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let wins;
      await act(async () => {
        wins = await result.current.fetchWinsForDate('2026-03-09');
      });

      expect(dateMock.eq).toHaveBeenCalledWith('win_date', '2026-03-09');
      expect(wins).toHaveLength(1);
      expect(wins[0].title).toBe('Ship the feature');
    });

    it('returns empty array when no wins found for date', async () => {
      const { supabase } = await import('@/lib/supabase');
      const mapMock = buildHistoryMock({ data: [], error: null });
      const dateMock = buildHistoryMock({ data: [], error: null });
      supabase.from.mockReturnValueOnce(mapMock).mockReturnValueOnce(dateMock);

      const { result } = renderHook(() => useHistory());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let wins;
      await act(async () => {
        wins = await result.current.fetchWinsForDate('2026-01-01');
      });

      expect(wins).toEqual([]);
    });
  });
});
