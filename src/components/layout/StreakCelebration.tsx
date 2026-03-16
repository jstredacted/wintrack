import { createPortal } from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import { Flame } from 'lucide-react';

interface StreakCelebrationProps {
  open: boolean;
  streak: number;
  onClose: () => void;
}

export default function StreakCelebration({ open, streak, onClose }: StreakCelebrationProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [displayCount, setDisplayCount] = useState(0);
  const rafRef = useRef<number | null>(null);

  // Mount/unmount state machine
  useEffect(() => {
    if (open) { setVisible(true); setExiting(false); }
    else if (visible) { setExiting(true); }
  }, [open]);

  // Animate number from 0 → streak over 2.5s ease-out cubic
  useEffect(() => {
    if (!open) return;
    const duration = 4000;
    const start = Date.now();

    function tick() {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayCount(Math.round(eased * streak));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [open, streak]);

  if (!visible) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Streak celebration"
      onClick={onClose}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background cursor-pointer ${
        exiting ? 'celebration-exit' : 'celebration-enter'
      }`}
      onAnimationEnd={(e) => {
        if (e.target !== e.currentTarget) return;
        if (exiting) { setDisplayCount(0); setVisible(false); }
      }}
    >
      {/* Fire */}
      <span className="leading-none mb-6" aria-hidden="true">
        <Flame size={96} strokeWidth={1} />
      </span>

      {/* Ramping number */}
      <span className="font-mono tabular-nums text-foreground"
        style={{ fontSize: 'clamp(5rem, 20vw, 10rem)', lineHeight: 1 }}>
        {displayCount}
      </span>

      {/* Label */}
      <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground mt-4">
        day streak
      </span>

      {/* Tagline */}
      <span className="font-mono text-sm uppercase tracking-[0.2em] text-muted-foreground mt-2">
        You're on a roll
      </span>

      {/* Dismiss hint */}
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/40 absolute bottom-12">
        tap to continue
      </span>
    </div>,
    document.body
  );
}
