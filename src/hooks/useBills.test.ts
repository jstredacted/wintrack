import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Mock env
vi.mock('@/lib/env', () => ({ USER_ID: 'test-user' }));

const mockBills = [
  {
    id: 'mb-1',
    user_id: 'test-user',
    month_id: 'month-1',
    bill_template_id: 'bt-1',
    name: 'Rent',
    amount: 15000,
    due_day: 5,
    paid: false,
    paid_at: null,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    bill_templates: {
      id: 'bt-1',
      user_id: 'test-user',
      name: 'Rent',
      amount: 15000,
      due_day: 5,
      recurrence_type: 'ongoing',
      recurrence_count: null,
      recurrence_end: null,
      start_month: '2026-01',
      active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  },
];

let mockRpcFn: ReturnType<typeof vi.fn>;
let mockFromFn: ReturnType<typeof vi.fn>;

function createSupabaseMock() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
  chain.then = vi.fn((cb: (v: unknown) => unknown) =>
    Promise.resolve({ data: mockBills, error: null }).then(cb)
  );

  mockFromFn = vi.fn().mockReturnValue(chain);
  mockRpcFn = vi.fn().mockResolvedValue({ data: mockBills[0], error: null });

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

describe('useBills', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const chain = supabaseMock.supabase._chain;
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    chain.then.mockImplementation((cb: (v: unknown) => unknown) =>
      Promise.resolve({ data: mockBills, error: null }).then(cb)
    );
    mockFromFn.mockReturnValue(chain);
    mockRpcFn.mockResolvedValue({ data: mockBills[0], error: null });
  });

  it('fetches monthly_bills joined with bill_templates', async () => {
    const { useBills } = await import('@/hooks/useBills');
    const { result } = renderHook(() => useBills('month-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFromFn).toHaveBeenCalledWith('monthly_bills');
    expect(result.current.bills).toHaveLength(1);
    expect(result.current.bills[0].name).toBe('Rent');
  });

  it('returns empty when monthId is null', async () => {
    const { useBills } = await import('@/hooks/useBills');
    const { result } = renderHook(() => useBills(null));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.bills).toHaveLength(0);
    expect(mockFromFn).not.toHaveBeenCalled();
  });

  it('togglePaid calls apply_bill_paid RPC', async () => {
    const { useBills } = await import('@/hooks/useBills');
    const { result } = renderHook(() => useBills('month-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.togglePaid('mb-1', true);
    });

    expect(mockRpcFn).toHaveBeenCalledWith('apply_bill_paid', {
      p_monthly_bill_id: 'mb-1',
      p_paid: true,
    });
  });
});
