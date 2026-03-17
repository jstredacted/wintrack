import { useState, useEffect, useCallback } from 'react';
import type { ExchangeRateResult } from '@/types/finance';

const CACHE_KEY = 'wintrack_exchange_rate';

interface CachedRate {
  rate: number;
  timestamp: number;
}

export interface ExchangeRateResultWithCache extends ExchangeRateResult {
  cached?: boolean;
  /** Fetch a fresh rate from the API, bypassing cache. Returns the rate or null on failure. */
  fetchFreshRate: () => Promise<number | null>;
}

export function useExchangeRate(
  base: string = 'USD',
  target: string = 'PHP'
): ExchangeRateResultWithCache {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [cached, setCached] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchRate() {
      setLoading(true);
      setError(null);
      setCached(false);

      try {
        const res = await fetch(
          `https://api.frankfurter.dev/v1/latest?base=${base}&symbols=${target}`
        );
        if (!res.ok) throw new Error(`Rate API error: ${res.status}`);
        const data = await res.json();

        if (!cancelled) {
          const fetchedRate = data.rates[target];
          setRate(fetchedRate);
          setFetchedAt(new Date());

          // Cache in localStorage
          try {
            localStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ rate: fetchedRate, timestamp: Date.now() })
            );
          } catch {
            // localStorage may be unavailable
          }
        }
      } catch (err) {
        if (!cancelled) {
          // Try cached rate
          try {
            const cachedStr = localStorage.getItem(CACHE_KEY);
            if (cachedStr) {
              const cachedData: CachedRate = JSON.parse(cachedStr);
              setRate(cachedData.rate);
              setFetchedAt(new Date(cachedData.timestamp));
              setCached(true);
              setError(null);
              setLoading(false);
              return;
            }
          } catch {
            // Cache read failed
          }

          setError(err instanceof Error ? err.message : 'Failed to fetch rate');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRate();
    return () => {
      cancelled = true;
    };
  }, [base, target]);

  const fetchFreshRate = useCallback(async (): Promise<number | null> => {
    try {
      const res = await fetch(
        `https://api.frankfurter.dev/v1/latest?base=${base}&symbols=${target}`
      );
      if (!res.ok) throw new Error(`Rate API error: ${res.status}`);
      const data = await res.json();
      const freshRate = data.rates?.[target];
      if (freshRate) {
        // Update cache + local state
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ rate: freshRate, timestamp: Date.now() })
          );
        } catch {
          // localStorage may be unavailable
        }
        setRate(freshRate);
        setFetchedAt(new Date());
        setCached(false);
      }
      return freshRate ?? null;
    } catch {
      return rate; // fallback to cached/current rate
    }
  }, [base, target, rate]);

  return { rate, loading, error, fetchedAt, cached, fetchFreshRate };
}
