import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Mock env
vi.mock('@/lib/env', () => ({ USER_ID: 'test-user' }));

// Build a chainable supabase mock with rpc support
const mockMonthRow = {
  id: 'month-1',
  user_id: 'test-user',
  year: 2026,
  month: 3,
  starting_balance: 50000,
  current_balance: 45000,
  budget_limit: 30000,
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
};

const mockIncomes = [
  {
    id: 'mi-1',
    user_id: 'test-user',
    month_id: 'month-1',
    income_source_id: 'is-1',
    expected_amount: 1500,
    currency: 'USD',
    conversion_method: 'wise',
    exchange_rate: null,
    fee_amount: null,
    net_php: null,
    received: false,
    received_at: null,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    income_sources: { id: 'is-1', name: 'Toptal', amount: 1500, currency: 'USD', conversion_method: 'wise', payday_day: 15, active: true },
  },
];

let mockRpcFn: ReturnType<typeof vi.fn>;
let mockFromFn: ReturnType<typeof vi.fn>;
let mockUpdateResolve: { data: unknown; error: unknown };
let mockSelectAfterUpdate: { data: unknown; error: unknown };

function createSupabaseMock() {
  mockUpdateResolve = { data: null, error: null };
  mockSelectAfterUpdate = { data: [mockMonthRow], error: null };

  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.delete = vi.fn().mockReturnValue(chain);
  // Make chain thenable to resolve as a query result
  chain.then = vi.fn((cb: (v: unknown) => unknown) =>
    Promise.resolve({ data: mockIncomes, error: null }).then(cb)
  );

  mockFromFn = vi.fn().mockReturnValue(chain);
  mockRpcFn = vi.fn().mockImplementation((fnName: string) => {
    if (fnName === 'ensure_month_exists') {
      return Promise.resolve({ data: mockMonthRow, error: null });
    }
    if (fnName === 'populate_monthly_income') {
      return Promise.resolve({ data: 0, error: null });
    }
    if (fnName === 'apply_income_received') {
      return Promise.resolve({ data: mockIncomes[0], error: null });
    }
    return Promise.resolve({ data: null, error: null });
  });

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

function resetMocks() {
  mockRpcFn.mockImplementation((fnName: string) => {
    if (fnName === 'ensure_month_exists') {
      return Promise.resolve({ data: mockMonthRow, error: null });
    }
    if (fnName === 'populate_monthly_income') {
      return Promise.resolve({ data: 0, error: null });
    }
    if (fnName === 'apply_income_received') {
      return Promise.resolve({ data: mockIncomes[0], error: null });
    }
    return Promise.resolve({ data: null, error: null });
  });

  // Re-setup the from() chain so .select().eq() resolves with incomes
  const chain = supabaseMock.supabase._chain;
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.insert.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.delete.mockReturnValue(chain);
  chain.single.mockResolvedValue({ data: null, error: null });
  chain.then.mockImplementation((cb: (v: unknown) => unknown) =>
    Promise.resolve({ data: mockIncomes, error: null }).then(cb)
  );
  mockFromFn.mockReturnValue(chain);
}

describe('useFinance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMocks();
  });

  it('returns month data with current_balance after ensure_month_exists RPC', async () => {
    const { useFinance } = await import('@/hooks/useFinance');
    const { result } = renderHook(() => useFinance('2026-03'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockRpcFn).toHaveBeenCalledWith('ensure_month_exists', {
      p_user_id: 'test-user',
      p_year: 2026,
      p_month: 3,
    });
    expect(result.current.monthData).toBeTruthy();
    expect(result.current.monthData?.current_balance).toBe(45000);
  });

  it('updateBalance calls apply_balance_override RPC', async () => {
    const { useFinance } = await import('@/hooks/useFinance');
    const { result } = renderHook(() => useFinance('2026-03'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateBalance(50000);
    });

    expect(mockRpcFn).toHaveBeenCalledWith('apply_balance_override', {
      p_month_id: 'month-1',
      p_new_balance: 50000,
      p_note: null,
    });
  });

  it('toggleIncomeReceived calls apply_income_received RPC with net PHP', async () => {
    const { useFinance } = await import('@/hooks/useFinance');
    const { result } = renderHook(() => useFinance('2026-03'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.toggleIncomeReceived('mi-1', true, 84000, 56.5, 9.57);
    });

    expect(mockRpcFn).toHaveBeenCalledWith('apply_income_received', {
      p_monthly_income_id: 'mi-1',
      p_received: true,
      p_net_php: 84000,
      p_exchange_rate: 56.5,
      p_fee_amount: 9.57,
    });
  });

  it('toggleIncomeReceived undo subtracts from balance', async () => {
    const { useFinance } = await import('@/hooks/useFinance');
    const { result } = renderHook(() => useFinance('2026-03'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.toggleIncomeReceived('mi-1', false);
    });

    expect(mockRpcFn).toHaveBeenCalledWith('apply_income_received', expect.objectContaining({
      p_monthly_income_id: 'mi-1',
      p_received: false,
    }));
  });

  it('updateBudgetLimit persists to months table', async () => {
    const { useFinance } = await import('@/hooks/useFinance');
    const { result } = renderHook(() => useFinance('2026-03'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    const updateChain: Record<string, ReturnType<typeof vi.fn>> = {};
    updateChain.eq = vi.fn().mockReturnValue(updateChain);
    updateChain.update = vi.fn().mockReturnValue(updateChain);
    updateChain.then = vi.fn((cb: (v: unknown) => unknown) =>
      Promise.resolve({ data: null, error: null }).then(cb)
    );
    mockFromFn.mockReturnValue(updateChain);

    await act(async () => {
      await result.current.updateBudgetLimit(30000);
    });

    expect(mockFromFn).toHaveBeenCalledWith('months');
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ budget_limit: 30000 })
    );
  });

  it('loads monthly_income joined with income sources', async () => {
    const { useFinance } = await import('@/hooks/useFinance');
    const { result } = renderHook(() => useFinance('2026-03'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.incomes).toHaveLength(1);
    expect(result.current.incomes[0].income_source_id).toBe('is-1');
  });
});
