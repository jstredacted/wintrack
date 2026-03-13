// STOPWATCH REMOVED — entire component kept for potential re-enable
import { useState, useEffect, useRef } from 'react';
import { formatElapsed } from '@/hooks/useStopwatch';

/**
 * useCountUp(target, duration)
 *
 * Animates a numeric display value from its previous value to the new target
 * using requestAnimationFrame. On initial render (or when target equals prev),
 * returns target immediately with no animation.
 *
 * @param {number} target - The value to animate toward
 * @param {number} duration - Animation duration in ms (default 600)
 * @returns {number} - Current display value
 */
function useCountUp(target, duration = 600) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);

  useEffect(() => {
    if (prev.current === target) return;
    const start = prev.current;
    const delta = target - start;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(Math.round(start + delta * progress));
      if (progress < 1) requestAnimationFrame(tick);
      else prev.current = target;
    }
    requestAnimationFrame(tick);
  }, [target, duration]);

  return display;
}

/**
 * TotalFocusTime
 *
 * Displays the summed focus time across all of today's wins.
 * Includes the live running delta for any win where timer_started_at is not null.
 * Re-renders every second when any timer is running.
 * Returns null (renders nothing) when total is 0.
 * Animates from previous value to new value when total changes (e.g. on overlay close).
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

  // Animate display from previous value to current (count-up on overlay close)
  const animatedSeconds = useCountUp(totalSeconds);

  // Use totalSeconds (not animatedSeconds) for null check — hides when truly 0
  if (totalSeconds === 0) return null;

  return (
    <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
      Focus today: {formatElapsed(animatedSeconds)}
    </p>
  );
}
