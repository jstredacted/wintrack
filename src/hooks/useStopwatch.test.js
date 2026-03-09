import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStopwatch } from './useStopwatch';

// TIMER-01: Wall-clock arithmetic, isRunning state
// TIMER-02: Page refresh recovery via startedAt timestamp
// Wave 0 stub — all tests fail with module-not-found until Wave 2 creates useStopwatch.js

describe('useStopwatch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('isRunning', () => {
    it('is false when startedAt is null', () => {
      const { result } = renderHook(() =>
        useStopwatch({ startedAt: null, elapsedBase: 0 })
      );
      expect(result.current.isRunning).toBe(false);
    });

    it('is true when startedAt is an ISO string', () => {
      const now = new Date('2026-03-09T10:00:00.000Z');
      vi.setSystemTime(now);
      const { result } = renderHook(() =>
        useStopwatch({ startedAt: now.toISOString(), elapsedBase: 0 })
      );
      expect(result.current.isRunning).toBe(true);
    });
  });

  describe('displaySeconds', () => {
    it('equals elapsedBase when not running (startedAt is null)', () => {
      const { result } = renderHook(() =>
        useStopwatch({ startedAt: null, elapsedBase: 42 })
      );
      expect(result.current.displaySeconds).toBe(42);
    });

    it('equals elapsedBase + floor((Date.now() - startedAt) / 1000) when running', () => {
      const startedAt = new Date('2026-03-09T10:00:00.000Z');
      vi.setSystemTime(startedAt);
      // Advance time by 35 seconds
      vi.advanceTimersByTime(35000);
      const { result } = renderHook(() =>
        useStopwatch({ startedAt: startedAt.toISOString(), elapsedBase: 10 })
      );
      expect(result.current.displaySeconds).toBe(10 + 35);
    });

    it('is correct after simulated page refresh (same startedAt, later Date.now())', () => {
      const startedAt = new Date('2026-03-09T10:00:00.000Z');
      const laterTime = new Date('2026-03-09T10:01:30.000Z'); // 90 seconds later
      vi.setSystemTime(laterTime);
      const { result } = renderHook(() =>
        useStopwatch({ startedAt: startedAt.toISOString(), elapsedBase: 0 })
      );
      // After refresh, elapsed = 0 + floor(90000ms / 1000) = 90 seconds
      expect(result.current.displaySeconds).toBe(90);
    });
  });
});
