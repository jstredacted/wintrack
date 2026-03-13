// STOPWATCH REMOVED — file kept for potential re-enable
import { useState, useEffect } from 'react';

/**
 * useStopwatch({ elapsedBase, startedAt })
 *
 * Wall-clock pattern — elapsed time is computed from timestamps, NOT accumulated via setInterval.
 * setInterval only triggers re-renders via a tick counter.
 *
 * @param {number} elapsedBase - Previously saved seconds (from timer_elapsed_seconds)
 * @param {string|null} startedAt - ISO timestamp when timer was started (from timer_started_at)
 * @returns {{ isRunning: boolean, displaySeconds: number }}
 */
export function useStopwatch({ elapsedBase = 0, startedAt = null } = {}) {
  const isRunning = startedAt !== null && startedAt !== undefined;

  // Tick counter — only used to trigger re-renders; does NOT accumulate elapsed time
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, startedAt]);

  const liveElapsed = isRunning
    ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
    : 0;

  const displaySeconds = (elapsedBase ?? 0) + liveElapsed;

  return { isRunning, displaySeconds };
}

/**
 * formatElapsed(totalSeconds) → "MM:SS" or "HH:MM:SS"
 *
 * formatElapsed(0)    → "00:00"
 * formatElapsed(65)   → "01:05"
 * formatElapsed(3661) → "01:01:01"
 */
export function formatElapsed(totalSeconds) {
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);

  const pad = (n) => String(n).padStart(2, '0');

  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
}
