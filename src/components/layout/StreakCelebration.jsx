import { createPortal } from 'react-dom';
import { useState, useEffect, useRef } from 'react';

export default function StreakCelebration({ open, streak, onClose }) {
  const [visible, setVisible] = useState(false);
  const [displayCount, setDisplayCount] = useState(0);
  const rafRef = useRef(null);

  // Mount/unmount
  useEffect(() => {
    if (open) setVisible(true);
  }, [open]);

  // Animate number from 0 → streak over 1.5s ease-out cubic
  useEffect(() => {
    if (!open) { setDisplayCount(0); return; }
    const duration = 1500;
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
    return () => cancelAnimationFrame(rafRef.current);
  }, [open, streak]);

  // Auto-close after 4s
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!visible) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Streak celebration"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background cursor-pointer"
      style={{ animation: open ? 'overlay-enter 0.3s ease forwards' : undefined }}
      onAnimationEnd={() => { if (!open) setVisible(false); }}
    >
      {/* Fire */}
      <span className="text-[6rem] leading-none mb-6" aria-hidden="true">🔥</span>

      {/* Ramping number */}
      <span className="font-mono tabular-nums text-foreground"
        style={{ fontSize: 'clamp(5rem, 20vw, 10rem)', lineHeight: 1 }}>
        {displayCount}
      </span>

      {/* Label */}
      <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground mt-4">
        day streak
      </span>

      {/* Dismiss hint */}
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/40 absolute bottom-12">
        tap to continue
      </span>
    </div>,
    document.body
  );
}
