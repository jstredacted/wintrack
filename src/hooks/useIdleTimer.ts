import { useEffect, useCallback } from 'react';

export const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const THROTTLE_MS = 1000;
const CHECK_INTERVAL_MS = 10_000;
const EVENTS = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'pointerdown'] as const;

export function useIdleTimer(onIdle: () => void, enabled: boolean = true) {
  const stableOnIdle = useCallback(onIdle, [onIdle]);

  useEffect(() => {
    if (!enabled) return;

    let lastActivity = Date.now();
    let throttleTimer: ReturnType<typeof setTimeout> | null = null;

    const resetActivity = () => {
      if (throttleTimer) return;
      lastActivity = Date.now();
      throttleTimer = setTimeout(() => { throttleTimer = null; }, THROTTLE_MS);
    };

    const checkIdle = setInterval(() => {
      if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
        stableOnIdle();
      }
    }, CHECK_INTERVAL_MS);

    EVENTS.forEach(e => document.addEventListener(e, resetActivity, { passive: true }));

    return () => {
      clearInterval(checkIdle);
      EVENTS.forEach(e => document.removeEventListener(e, resetActivity));
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [stableOnIdle, enabled]);
}
