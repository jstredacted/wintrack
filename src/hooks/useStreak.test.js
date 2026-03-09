import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStreak } from './useStreak';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// STREAK-01: Streak counter — consecutive days with at least one completed win
// Must use getLocalDateString() throughout (not .toISOString().slice(0,10))
// Wave 0 stub — all tests fail with module-not-found until Wave 1 creates useStreak.js

/**
 * buildStreakMock(resolvedValue)
 *
 * Creates a chainable Supabase query mock that supports:
 *   supabase.from('check_ins').select(...).eq(...).eq(...)
 *
 * The mock object is thenable so it can be awaited at any point in the chain.
 * Each chained method returns the same mock object.
 */
function buildStreakMock(resolvedValue) {
  const mock = {
    select: vi.fn(),
    eq: vi.fn(),
    // Make it awaitable at any chain position
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

  it('returns 0 and loading=false when there are no completed check_in rows', async () => {
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
      data: [{ wins: { win_date: today } }],
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
        { wins: { win_date: dateFor(0) } },
        { wins: { win_date: dateFor(1) } },
        { wins: { win_date: dateFor(2) } },
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
        { wins: { win_date: dateFor(0) } },
        // day 1 is missing — gap
        { wins: { win_date: dateFor(2) } },
        { wins: { win_date: dateFor(3) } },
      ],
      error: null,
    }));

    const { result } = renderHook(() => useStreak());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.streak).toBe(1);
  });

  it('does not corrupt streak across timezone boundaries — uses Intl.DateTimeFormat en-CA', async () => {
    // Verify the hook uses getLocalDateString (en-CA locale) by:
    // 1. Providing check_in data with today's date formatted by en-CA
    // 2. Asserting the hook correctly identifies it as today (streak = 1)
    // This indirectly verifies the hook uses the same locale — if it used UTC,
    // the date comparison could fail near midnight in non-UTC timezones.
    const todayViaDtf = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());

    const { supabase } = await import('@/lib/supabase');
    supabase.from.mockReturnValue(buildStreakMock({
      data: [{ wins: { win_date: todayViaDtf } }],
      error: null,
    }));

    const { result } = renderHook(() => useStreak());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Hook must recognize the en-CA formatted date as today — streak = 1
    expect(result.current.streak).toBe(1);
  });
});

describe('useStreak — journalStreak', () => {
  it('returns journalStreak: 0 when there are no journal entries', async () => {
    const { supabase } = await import('@/lib/supabase');
    // First call: check_ins query (wins streak), second call: journal_entries query
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
    // Two entries on same day = streak of 1, not 2
    expect(result.current.journalStreak).toBe(1);
  });
});
