import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useYearOverview } from './useYearOverview';

// Mock supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

// Mock env
vi.mock('@/lib/env', () => ({
  USER_ID: 'test-user-id',
}));

import { supabase } from '@/lib/supabase';

const mockRpc = supabase.rpc as ReturnType<typeof vi.fn>;

const MOCK_MONTHS = [
  {
    month: '2025-01',
    ending_balance: '10000',
    starting_balance: '9000',
    total_income: '5000',
    total_expenses: '3000',
    total_oneoff: '500',
    journal_count: '4',
  },
  {
    month: '2025-02',
    ending_balance: '11000',
    starting_balance: '10000',
    total_income: '5000',
    total_expenses: '2500',
    total_oneoff: '0',
    journal_count: '0',
  },
];

describe('useYearOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns months with journal_count mapped from RPC result', async () => {
    mockRpc.mockResolvedValueOnce({ data: MOCK_MONTHS, error: null });

    const { result } = renderHook(() => useYearOverview(2025));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.months).toHaveLength(12);

    const jan = result.current.months.find((m) => m.month === '2025-01');
    expect(jan).toBeDefined();
    expect(jan!.journal_count).toBe(4);
  });

  it('defaults journal_count to 0 when missing from RPC response', async () => {
    const monthsWithoutJournalCount = MOCK_MONTHS.map(({ journal_count: _jc, ...rest }) => rest);
    mockRpc.mockResolvedValueOnce({ data: monthsWithoutJournalCount, error: null });

    const { result } = renderHook(() => useYearOverview(2025));

    await waitFor(() => expect(result.current.loading).toBe(false));

    const jan = result.current.months.find((m) => m.month === '2025-01');
    expect(jan!.journal_count).toBe(0);
  });

  it('defaults journal_count to 0 when journal_count is 0', async () => {
    mockRpc.mockResolvedValueOnce({ data: MOCK_MONTHS, error: null });

    const { result } = renderHook(() => useYearOverview(2025));

    await waitFor(() => expect(result.current.loading).toBe(false));

    const feb = result.current.months.find((m) => m.month === '2025-02');
    expect(feb!.journal_count).toBe(0);
  });

  it('fills missing months with journal_count of 0', async () => {
    // Only return 2 months — rest should be filled empty
    mockRpc.mockResolvedValueOnce({ data: MOCK_MONTHS, error: null });

    const { result } = renderHook(() => useYearOverview(2025));

    await waitFor(() => expect(result.current.loading).toBe(false));

    const march = result.current.months.find((m) => m.month === '2025-03');
    expect(march).toBeDefined();
    expect(march!.journal_count).toBe(0);
  });

  it('returns error state on RPC failure', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'RPC failed' } });

    const { result } = renderHook(() => useYearOverview(2025));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('RPC failed');
    expect(result.current.months).toHaveLength(0);
  });
});
