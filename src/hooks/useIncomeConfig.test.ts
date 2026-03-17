import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// Mock env
vi.mock('@/lib/env', () => ({ USER_ID: 'test-user' }));

const mockSources = [
  {
    id: 'is-1',
    user_id: 'test-user',
    name: 'Freelance',
    amount: 1500,
    currency: 'USD',
    conversion_method: 'wise',
    payday_day: 15,
    active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'is-2',
    user_id: 'test-user',
    name: 'Toptal',
    amount: 2000,
    currency: 'USD',
    conversion_method: 'paypal',
    payday_day: 1,
    active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

let mockFromFn: ReturnType<typeof vi.fn>;

function createSupabaseMock() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue({ data: mockSources[0], error: null });
  // Default: select query returns sorted sources
  chain.then = vi.fn((cb: (v: unknown) => unknown) =>
    Promise.resolve({ data: [...mockSources].sort((a, b) => a.name.localeCompare(b.name)), error: null }).then(cb)
  );

  mockFromFn = vi.fn().mockReturnValue(chain);

  return {
    supabase: {
      from: mockFromFn,
      _chain: chain,
    },
  };
}

const supabaseMock = createSupabaseMock();
vi.mock('@/lib/supabase', () => supabaseMock);

function resetChain() {
  const chain = supabaseMock.supabase._chain;
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.insert.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.delete.mockReturnValue(chain);
  chain.single.mockResolvedValue({ data: mockSources[0], error: null });
  chain.then.mockImplementation((cb: (v: unknown) => unknown) =>
    Promise.resolve({ data: [...mockSources].sort((a, b) => a.name.localeCompare(b.name)), error: null }).then(cb)
  );
  mockFromFn.mockReturnValue(chain);
}

describe('useIncomeConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it('fetches active income sources on mount', async () => {
    const { useIncomeConfig } = await import('@/hooks/useIncomeConfig');
    const { result } = renderHook(() => useIncomeConfig());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFromFn).toHaveBeenCalledWith('income_sources');
    expect(result.current.sources).toHaveLength(2);
  });

  it('addSource inserts new income source', async () => {
    const chain = supabaseMock.supabase._chain;
    const newSource = {
      id: 'is-3',
      user_id: 'test-user',
      name: 'Toptal',
      amount: 1500,
      currency: 'USD',
      conversion_method: 'wise',
      payday_day: 15,
      active: true,
      created_at: '2026-03-01T00:00:00Z',
      updated_at: '2026-03-01T00:00:00Z',
    };

    const { useIncomeConfig } = await import('@/hooks/useIncomeConfig');
    const { result } = renderHook(() => useIncomeConfig());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Setup insert chain to return new source via select().single()
    const insertChain: Record<string, ReturnType<typeof vi.fn>> = {};
    insertChain.select = vi.fn().mockReturnValue(insertChain);
    insertChain.single = vi.fn().mockResolvedValue({ data: newSource, error: null });
    insertChain.insert = vi.fn().mockReturnValue(insertChain);
    insertChain.eq = vi.fn().mockReturnValue(insertChain);
    mockFromFn.mockReturnValue(insertChain);

    await act(async () => {
      await result.current.addSource({
        name: 'Toptal',
        amount: 1500,
        currency: 'USD',
        conversion_method: 'wise',
        payday_day: 15,
      });
    });

    expect(mockFromFn).toHaveBeenCalledWith('income_sources');
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Toptal',
        amount: 1500,
        currency: 'USD',
        conversion_method: 'wise',
        payday_day: 15,
        user_id: 'test-user',
        active: true,
      })
    );
  });

  it('updateSource updates existing source', async () => {
    const { useIncomeConfig } = await import('@/hooks/useIncomeConfig');
    const { result } = renderHook(() => useIncomeConfig());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const updateChain: Record<string, ReturnType<typeof vi.fn>> = {};
    updateChain.eq = vi.fn().mockReturnValue(updateChain);
    updateChain.update = vi.fn().mockReturnValue(updateChain);
    updateChain.then = vi.fn((cb: (v: unknown) => unknown) =>
      Promise.resolve({ data: null, error: null }).then(cb)
    );
    mockFromFn.mockReturnValue(updateChain);

    await act(async () => {
      await result.current.updateSource('is-1', { amount: 2000 });
    });

    expect(mockFromFn).toHaveBeenCalledWith('income_sources');
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 2000 })
    );
  });

  it('removeSource soft-deletes (sets active=false)', async () => {
    const { useIncomeConfig } = await import('@/hooks/useIncomeConfig');
    const { result } = renderHook(() => useIncomeConfig());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const updateChain: Record<string, ReturnType<typeof vi.fn>> = {};
    updateChain.eq = vi.fn().mockReturnValue(updateChain);
    updateChain.update = vi.fn().mockReturnValue(updateChain);
    updateChain.then = vi.fn((cb: (v: unknown) => unknown) =>
      Promise.resolve({ data: null, error: null }).then(cb)
    );
    mockFromFn.mockReturnValue(updateChain);

    await act(async () => {
      await result.current.removeSource('is-1');
    });

    expect(updateChain.update).toHaveBeenCalledWith({ active: false });
    // Optimistic removal: source should be gone from local state
    expect(result.current.sources.find(s => s.id === 'is-1')).toBeUndefined();
  });

  it('returns sources sorted by name', async () => {
    const { useIncomeConfig } = await import('@/hooks/useIncomeConfig');
    const { result } = renderHook(() => useIncomeConfig());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // mockSources: Freelance, Toptal — sorted alphabetically: Freelance < Toptal
    expect(result.current.sources[0].name).toBe('Freelance');
    expect(result.current.sources[1].name).toBe('Toptal');
  });
});
