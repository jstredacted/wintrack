import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
vi.stubGlobal('localStorage', localStorageMock);

describe('useExchangeRate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches rate from Frankfurter API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rates: { PHP: 56.5 } }),
    });

    const { useExchangeRate } = await import('@/hooks/useExchangeRate');
    const { result } = renderHook(() => useExchangeRate());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rate).toBe(56.5);
    expect(result.current.error).toBeNull();
    expect(result.current.fetchedAt).toBeInstanceOf(Date);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.frankfurter.dev/v1/latest?base=USD&symbols=PHP'
    );
  });

  it('sets error on API failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    // No cache available
    localStorageMock.getItem.mockReturnValue(null);

    const { useExchangeRate } = await import('@/hooks/useExchangeRate');
    const { result } = renderHook(() => useExchangeRate());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rate).toBeNull();
    expect(result.current.error).toBe('Network error');
  });

  it('sets loading during fetch', async () => {
    let resolveFetch: (value: unknown) => void;
    mockFetch.mockReturnValueOnce(
      new Promise((resolve) => { resolveFetch = resolve; })
    );

    const { useExchangeRate } = await import('@/hooks/useExchangeRate');
    const { result } = renderHook(() => useExchangeRate());

    // Should be loading initially
    expect(result.current.loading).toBe(true);
    expect(result.current.rate).toBeNull();

    // Resolve the fetch
    resolveFetch!({
      ok: true,
      json: async () => ({ rates: { PHP: 56.5 } }),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rate).toBe(56.5);
  });

  it('caches rate in localStorage after successful fetch', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rates: { PHP: 57.0 } }),
    });

    const { useExchangeRate } = await import('@/hooks/useExchangeRate');
    const { result } = renderHook(() => useExchangeRate());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'wintrack_exchange_rate',
      expect.stringContaining('"rate":57')
    );
  });

  it('falls back to cached rate on API failure', async () => {
    const cachedData = JSON.stringify({ rate: 55.0, timestamp: Date.now() });
    localStorageMock.getItem.mockReturnValue(cachedData);
    mockFetch.mockRejectedValueOnce(new Error('API down'));

    const { useExchangeRate } = await import('@/hooks/useExchangeRate');
    const { result } = renderHook(() => useExchangeRate());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rate).toBe(55.0);
    expect(result.current.error).toBeNull();
    expect(result.current.cached).toBe(true);
  });
});
