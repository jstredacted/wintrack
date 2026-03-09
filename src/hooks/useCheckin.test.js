import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCheckin } from './useCheckin';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      then: vi.fn(),
    })),
  },
}));

// CHECKIN-01: submitCheckin() inserts check_in rows into Supabase
// CHECKIN-03: hasCheckedInToday() checks if any today win has a check_in row
// Wave 0 stub — all tests fail with module-not-found until Wave 1 creates useCheckin.js

describe('useCheckin', () => {
  describe('submitCheckin', () => {
    it('calls supabase.from("check_ins").insert with one row per answer', async () => {
      const { supabase } = await import('@/lib/supabase');
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({
        insert: insertMock,
        eq: vi.fn().mockReturnThis(),
      });

      const { result } = renderHook(() => useCheckin());
      const answers = [
        { winId: 'win-1', completed: true, note: null },
        { winId: 'win-2', completed: false, note: 'Got distracted' },
      ];

      await act(async () => {
        await result.current.submitCheckin(answers);
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ win_id: 'win-1', completed: true }),
          expect.objectContaining({ win_id: 'win-2', completed: false, note: 'Got distracted' }),
        ])
      );
    });

    it('returns { error: null } on success', async () => {
      const { supabase } = await import('@/lib/supabase');
      supabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
        eq: vi.fn().mockReturnThis(),
      });

      const { result } = renderHook(() => useCheckin());
      let returnValue;
      await act(async () => {
        returnValue = await result.current.submitCheckin([
          { winId: 'win-1', completed: true, note: null },
        ]);
      });

      expect(returnValue).toEqual({ error: null });
    });
  });

  describe('hasCheckedInToday', () => {
    it('returns false when no today win IDs are provided', async () => {
      const { result } = renderHook(() => useCheckin());
      let hasCheckedIn;
      await act(async () => {
        hasCheckedIn = await result.current.hasCheckedInToday([]);
      });
      expect(hasCheckedIn).toBe(false);
    });

    it('returns true when any today win has a matching check_in row', async () => {
      const { supabase } = await import('@/lib/supabase');
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [{ id: 'ci-1' }], error: null }),
      });

      const { result } = renderHook(() => useCheckin());
      let hasCheckedIn;
      await act(async () => {
        hasCheckedIn = await result.current.hasCheckedInToday(['win-1', 'win-2']);
      });
      expect(hasCheckedIn).toBe(true);
    });
  });
});
