import { useEffect, useRef, useState } from 'react';
// useState kept for usePrefersReducedMotion

interface PinDotsProps {
  digits: string;
  error: boolean;
  onShakeEnd: () => void;
}

const DOT_COUNT = 4;
// Digit reveal removed per user preference — dots go straight from empty to filled

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

export function PinDots({ digits, error, onShakeEnd }: PinDotsProps) {
  const reducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Native animationend listener (React synthetic onAnimationEnd unreliable in jsdom)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !error) return;
    const handler = () => onShakeEnd();
    el.addEventListener('animationend', handler);
    return () => el.removeEventListener('animationend', handler);
  }, [error, onShakeEnd]);

  const shakeStyle =
    error && !reducedMotion
      ? { animation: 'pin-shake 0.4s ease-in-out' }
      : undefined;

  return (
    <div className="flex flex-col items-center">
      <div
        ref={containerRef}
        role="status"
        className="flex items-center justify-center gap-4"
        style={shakeStyle}
      >
        {Array.from({ length: DOT_COUNT }, (_, i) => {
          const filled = i < digits.length;
          const dotColor = error
            ? 'bg-destructive'
            : filled
              ? 'bg-foreground'
              : 'border-2 border-muted-foreground bg-transparent';

          const fillStyle =
            filled && !error && !reducedMotion
              ? { animation: 'pin-dot-fill 0.15s ease-out both' }
              : undefined;

          return (
            <div
              key={i}
              className={`h-4 w-4 rounded-full ${dotColor}`}
              style={fillStyle}
            />
          );
        })}
      </div>
      {/* Accessible live region — announces digit count without revealing digits */}
      <span className="sr-only" aria-live="polite">
        {digits.length > 0 ? `Digit ${digits.length} entered` : ''}
      </span>
    </div>
  );
}
