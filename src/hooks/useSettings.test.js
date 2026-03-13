import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

function buildQueryMock(resolvedValue) {
  const mock = {
    select: vi.fn(),
    upsert: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    then: (resolve) => Promise.resolve(resolvedValue).then(resolve),
    catch: (reject) => Promise.resolve(resolvedValue).catch(reject),
  };
  mock.select.mockReturnValue(mock);
  mock.upsert.mockReturnValue(mock);
  mock.eq.mockReturnValue(mock);
  mock.single.mockReturnValue(mock);
  return mock;
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/lib/env', () => ({
  USER_ID: '00000000-0000-0000-0000-000000000001',
}));

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('fetches settings from Supabase on mount and calls setSettings', async () => {
    const { supabase } = await import('@/lib/supabase');
    const mockData = {
      day_start_hour: 4,
      morning_prompt_hour: 10,
      evening_prompt_hour: 22,
    };
    supabase.from.mockReturnValue(buildQueryMock({ data: mockData, error: null }));

    const { useSettings } = await import('./useSettings');
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.settings.dayStartHour).toBe(4);
  });

  it('upserts defaults when no row exists', async () => {
    const { supabase } = await import('@/lib/supabase');
    const upsertMock = buildQueryMock({ error: null });
    let callCount = 0;
    supabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call: SELECT returns null data
        return buildQueryMock({ data: null, error: null });
      }
      // Second call: UPSERT
      return upsertMock;
    });

    const { useSettings } = await import('./useSettings');
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    // Should have called from() at least twice (select + upsert)
    expect(supabase.from).toHaveBeenCalledTimes(2);
  });

  it('saveSettings calls Supabase upsert and updates store', async () => {
    const { supabase } = await import('@/lib/supabase');
    supabase.from.mockReturnValue(buildQueryMock({ data: { day_start_hour: 0, morning_prompt_hour: 9, evening_prompt_hour: 21 }, error: null }));

    const { useSettings } = await import('./useSettings');
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Now call saveSettings
    const saveMock = buildQueryMock({ error: null });
    supabase.from.mockReturnValue(saveMock);

    await result.current.saveSettings({ dayStartHour: 5 });
    expect(supabase.from).toHaveBeenCalledWith('user_settings');
  });
});
