import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Mock env
vi.mock('@/lib/env', () => ({ USER_ID: 'test-user' }));

const mockEntries = [
  {
    id: 'oo-1',
    user_id: 'test-user',
    month_id: 'month-1',
    amount: 5000,
    date: '2026-03-10',
    note: 'Freelance gig',
    created_at: '2026-03-10T00:00:00Z',
    updated_at: '2026-03-10T00:00:00Z',
  },
];

let mockRpcFn: ReturnType<typeof vi.fn>;
let mockFromFn: ReturnType<typeof vi.fn>;

function createSupabaseMock() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.then = vi.fn((cb: (v: unknown) => unknown) =>
    Promise.resolve({ data: mockEntries, error: null }).then(cb)
  );

  mockFromFn = vi.fn().mockReturnValue(chain);
  mockRpcFn = vi.fn().mockResolvedValue({ data: mockEntries[0], error: null });

  return {
    supabase: {
      from: mockFromFn,
      rpc: mockRpcFn,
      _chain: chain,
    },
  };
}

const supabaseMock = createSupabaseMock();
vi.mock('@/lib/supabase', () => supabaseMock);

describe('useOneOffIncome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const chain = supabaseMock.supabase._chain;
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    chain.update.mockReturnValue(chain);
    chain.delete.mockReturnValue(chain);
    chain.then.mockImplementation((cb: (v: unknown) => unknown) =>
      Promise.resolve({ data: mockEntries, error: null }).then(cb)
    );
    mockFromFn.mockReturnValue(chain);
    mockRpcFn.mockResolvedValue({ data: mockEntries[0], error: null });
  });

  it('fetches one-off income entries', async () => {
    const { useOneOffIncome } = await import('@/hooks/useOneOffIncome');
    const { result } = renderHook(() => useOneOffIncome('month-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFromFn).toHaveBeenCalledWith('oneoff_income');
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].note).toBe('Freelance gig');
  });

  it('addEntry calls apply_oneoff_income RPC', async () => {
    const { useOneOffIncome } = await import('@/hooks/useOneOffIncome');
    const { result } = renderHook(() => useOneOffIncome('month-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addEntry(3000, '2026-03-15', 'Side project');
    });

    expect(mockRpcFn).toHaveBeenCalledWith('apply_oneoff_income', {
      p_user_id: 'test-user',
      p_month_id: 'month-1',
      p_amount: 3000,
      p_date: '2026-03-15',
      p_note: 'Side project',
    });
  });

  it('deleteEntry calls delete_oneoff_income RPC', async () => {
    const { useOneOffIncome } = await import('@/hooks/useOneOffIncome');
    const { result } = renderHook(() => useOneOffIncome('month-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteEntry('oo-1');
    });

    expect(mockRpcFn).toHaveBeenCalledWith('delete_oneoff_income', {
      p_oneoff_id: 'oo-1',
    });
  });
});
