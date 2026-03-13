import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { getLocalDateString } from '@/lib/utils/date';

// Mock settingsStore
const mockSettings = { dayStartHour: 0, morningPromptHour: 9, eveningPromptHour: 21 };
vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: (selector) => selector({ settings: mockSettings }),
}));

// Mock supabase
vi.mock('@/lib/supabase', () => {
  const chain = () => {
    const obj = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: (cb) => Promise.resolve({ data: [], error: null }).then(cb),
    };
    Object.assign(obj, { from: vi.fn().mockReturnValue(obj) });
    return obj;
  };
  return { supabase: chain() };
});

vi.mock('@/lib/env', () => ({ USER_ID: 'test-user' }));

describe('useWins — night-owl offset', () => {
  afterEach(() => {
    vi.useRealTimers();
    mockSettings.dayStartHour = 0;
  });

  it('with dayStartHour=0, today resolves to current calendar date', () => {
    mockSettings.dayStartHour = 0;
    const now = new Date('2026-06-15T14:00:00');
    const today = getLocalDateString(now, 0);
    expect(today).toBe('2026-06-15');
  });

  it('with dayStartHour=4 at 2am, today resolves to previous calendar date', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T02:00:00')); // 2am
    mockSettings.dayStartHour = 4;

    const { getLocalDateString } = await import('@/lib/utils/date');
    const today = getLocalDateString(new Date(), 4);
    // At 2am with dayStartHour=4, should be previous day
    expect(today).toBe('2026-06-14');
  });

  it('yesterday uses DST-safe date walking (setDate, not 86400000)', async () => {
    // Read the source and verify no 86400000 in fetchWins date logic
    const src = (await import('@/hooks/useWins?raw')).default;
    // After our changes, the yesterday calculation should use setDate
    // This is a source-level check
    expect(src).not.toMatch(/yesterday.*86400000|86400000.*yesterday/s);
  });
});
