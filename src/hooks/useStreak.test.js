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

describe('useStreak', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 0 and loading=false when there are no completed check_in rows', async () => {
    const { supabase } = await import('@/lib/supabase');
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    const { result } = renderHook(() => useStreak());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.streak).toBe(0);
  });

  it('returns 1 when today has at least one completed win', async () => {
    const today = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());

    const { supabase } = await import('@/lib/supabase');
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{ wins: { win_date: today } }],
        error: null,
      }),
    });

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
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [
          { wins: { win_date: dateFor(0) } },
          { wins: { win_date: dateFor(1) } },
          { wins: { win_date: dateFor(2) } },
        ],
        error: null,
      }),
    });

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
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [
          { wins: { win_date: dateFor(0) } },
          // day 1 is missing — gap
          { wins: { win_date: dateFor(2) } },
          { wins: { win_date: dateFor(3) } },
        ],
        error: null,
      }),
    });

    const { result } = renderHook(() => useStreak());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.streak).toBe(1);
  });

  it('does not corrupt streak across timezone boundaries — uses Intl.DateTimeFormat en-CA', async () => {
    // Verify the hook uses getLocalDateString (en-CA) not UTC.
    // This test mocks Intl.DateTimeFormat to control "today" as seen by the hook.
    const fakeToday = '2026-03-09';
    const fakeYesterday = '2026-03-08';

    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => ({
      format: () => fakeToday,
    }));

    const { supabase } = await import('@/lib/supabase');
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [
          { wins: { win_date: fakeToday } },
          { wins: { win_date: fakeYesterday } },
        ],
        error: null,
      }),
    });

    const { result } = renderHook(() => useStreak());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Should count fakeToday correctly — no UTC corruption
    expect(result.current.streak).toBeGreaterThanOrEqual(1);

    vi.restoreAllMocks();
  });
});
