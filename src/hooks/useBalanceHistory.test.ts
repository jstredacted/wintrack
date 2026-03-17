import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Mock env
vi.mock('@/lib/env', () => ({ USER_ID: 'test-user' }));

const mockChanges = [
  {
    id: 'bc-1',
    user_id: 'test-user',
    month_id: 'month-1',
    old_balance: 50000,
    new_balance: 45000,
    delta: -5000,
    note: 'Adjusted for expense',
    created_at: '2026-03-15T10:00:00Z',
  },
];

let mockRpcFn: ReturnType<typeof vi.fn>;
let mockFromFn: ReturnType<typeof vi.fn>;

function createSupabaseMock() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.then = vi.fn((cb: (v: unknown) => unknown) =>
    Promise.resolve({ data: mockChanges, error: null }).then(cb)
  );

  mockFromFn = vi.fn().mockReturnValue(chain);
  mockRpcFn = vi.fn().mockResolvedValue({ data: { id: 'month-1', current_balance: 50000 }, error: null });

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

describe('useBalanceHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const chain = supabaseMock.supabase._chain;
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    chain.then.mockImplementation((cb: (v: unknown) => unknown) =>
      Promise.resolve({ data: mockChanges, error: null }).then(cb)
    );
    mockFromFn.mockReturnValue(chain);
    mockRpcFn.mockResolvedValue({ data: { id: 'month-1', current_balance: 50000 }, error: null });
  });

  it('fetches balance changes ordered by created_at desc', async () => {
    const { useBalanceHistory } = await import('@/hooks/useBalanceHistory');
    const { result } = renderHook(() => useBalanceHistory('month-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFromFn).toHaveBeenCalledWith('balance_changes');
    expect(result.current.changes).toHaveLength(1);
    expect(result.current.lastChange?.delta).toBe(-5000);
  });

  it('revertChange calls revert_balance_change RPC', async () => {
    const { useBalanceHistory } = await import('@/hooks/useBalanceHistory');
    const { result } = renderHook(() => useBalanceHistory('month-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.revertChange('bc-1');
    });

    expect(mockRpcFn).toHaveBeenCalledWith('revert_balance_change', {
      p_change_id: 'bc-1',
    });
  });
});
