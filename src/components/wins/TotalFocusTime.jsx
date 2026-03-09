import { useState, useEffect } from 'react';
import { formatElapsed } from '@/hooks/useStopwatch';

/**
 * TotalFocusTime
 *
 * Displays the summed focus time across all of today's wins.
 * Includes the live running delta for any win where timer_started_at is not null.
 * Re-renders every second when any timer is running.
 * Returns null (renders nothing) when total is 0.
 *
 * Props:
 *   wins: Win[] — today's wins
 */
export default function TotalFocusTime({ wins = [] }) {
  // Tick state — only used to trigger re-renders; does NOT accumulate time
  const [, setTick] = useState(0);

  const anyRunning = wins.some((w) => w.timer_started_at != null);

  useEffect(() => {
    if (!anyRunning) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [anyRunning]);

  // Compute total including live delta for running timers
  const totalSeconds = wins.reduce((sum, w) => {
    const live = w.timer_started_at
      ? Math.floor((Date.now() - new Date(w.timer_started_at).getTime()) / 1000)
      : 0;
    return sum + (w.timer_elapsed_seconds ?? 0) + live;
  }, 0);

  if (totalSeconds === 0) return null;

  return (
    <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
      Focus today: {formatElapsed(totalSeconds)}
    </p>
  );
}
