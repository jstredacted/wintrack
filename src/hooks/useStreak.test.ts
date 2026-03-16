import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStreak } from './useStreak';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// STREAK-01: Streak counter — consecutive days with at least one completed win
// Now queries wins.completed directly instead of check_ins table

/**
 * buildStreakMock(resolvedValue)
 *
 * Creates a chainable Supabase query mock that supports:
 *   supabase.from('wins').select('win_date').eq('user_id', ...).eq('completed', true)
 */
function buildStreakMock(resolvedValue) {
  const mock = {
    select: vi.fn(),
    eq: vi.fn(),
    then: (resolve) => Promise.resolve(resolvedValue).then(resolve),
    catch: (reject) => Promise.resolve(resolvedValue).catch(reject),
  };
  mock.select.mockReturnValue(mock);
  mock.eq.mockReturnValue(mock);
  return mock;
}

describe('useStreak', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 0 and loading=false when there are no completed wins', async () => {
    const { supabase } = await import('@/lib/supabase');
    supabase.from.mockReturnValue(buildStreakMock({ data: [], error: null }));

    const { result } = renderHook(() => useStreak());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.streak).toBe(0);
  });

  it('returns 1 when today has at least one completed win', async () => {
    const today = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());

    const { supabase } = await import('@/lib/supabase');
    supabase.from.mockReturnValue(buildStreakMock({
      data: [{ win_date: today }],
      error: null,
    }));

    const { result } = renderHook(() => useStreak());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.streak).toBe(1);
  });

  it('returns N for N consecutive completed days counting back from today', async () => {
    const today = new Date();
    const dateFor = (daysAgo) => new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date(today.getTime() - daysAgo * 86400000));

    const { supabase } = await import('@/lib/supabase');
    supabase.from.mockReturnValue(buildStreakMock({
      data: [
        { win_date: dateFor(0) },
        { win_date: dateFor(1) },
        { win_date: dateFor(2) },
      ],
      error: null,
    }));

    const { result } = renderHook(() => useStreak());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.streak).toBe(3);
  });

  it('breaks the streak on a gap day — returns count only up to the gap', async () => {
    const today = new Date();
    const dateFor = (daysAgo) => new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date(today.getTime() - daysAgo * 86400000));

    const { supabase } = await import('@/lib/supabase');
    supabase.from.mockReturnValue(buildStreakMock({
      data: [
        { win_date: dateFor(0) },
        // day 1 is missing — gap
        { win_date: dateFor(2) },
        { win_date: dateFor(3) },
      ],
      error: null,
    }));

    const { result } = renderHook(() => useStreak());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.streak).toBe(1);
  });

  it('does not corrupt streak across timezone boundaries — uses Intl.DateTimeFormat en-CA', async () => {
    const todayViaDtf = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());

    const { supabase } = await import('@/lib/supabase');
    supabase.from.mockReturnValue(buildStreakMock({
      data: [{ win_date: todayViaDtf }],
      error: null,
    }));

    const { result } = renderHook(() => useStreak());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.streak).toBe(1);
  });
});

describe('useStreak — journalStreak', () => {
  it('returns journalStreak: 0 when there are no journal entries', async () => {
    const { supabase } = await import('@/lib/supabase');
    // First call: wins query (win streak), second call: journal_entries query
    supabase.from
      .mockReturnValueOnce(buildStreakMock({ data: [], error: null }))
      .mockReturnValueOnce(buildStreakMock({ data: [], error: null }));

    const { result } = renderHook(() => useStreak());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.journalStreak).toBe(0);
  });

  it('returns journalStreak: 1 when today has at least one journal entry', async () => {
    const { supabase } = await import('@/lib/supabase');
    supabase.from
      .mockReturnValueOnce(buildStreakMock({ data: [], error: null }))
      .mockReturnValueOnce(buildStreakMock({
        data: [{ created_at: new Date().toISOString() }],
        error: null,
      }));

    const { result } = renderHook(() => useStreak());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.journalStreak).toBe(1);
  });

  it('does not double-count multiple entries on the same day', async () => {
    const todayIso = new Date().toISOString();
    const { supabase } = await import('@/lib/supabase');
    supabase.from
      .mockReturnValueOnce(buildStreakMock({ data: [], error: null }))
      .mockReturnValueOnce(buildStreakMock({
        data: [{ created_at: todayIso }, { created_at: todayIso }],
        error: null,
      }));

    const { result } = renderHook(() => useStreak());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.journalStreak).toBe(1);
  });
});
