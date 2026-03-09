import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { formatElapsed, useStopwatch } from '@/hooks/useStopwatch';

function BentoCell({ win }) {
  const { displaySeconds } = useStopwatch({
    elapsedBase: win.timer_elapsed_seconds ?? 0,
    startedAt: win.timer_started_at ?? null,
  });

  return (
    <div className="flex flex-col gap-2 p-4 border border-border rounded font-mono">
      <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground truncate">
        {win.title}
      </span>
      <span className="text-2xl tabular-nums text-foreground">
        {formatElapsed(displaySeconds)}
      </span>
    </div>
  );
}

export default function TimerFocusOverlay({ open, wins = [], onClose }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (open) { setVisible(true); setExiting(false); }
    else if (visible) { setExiting(true); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!visible) return null;

  // Max 3 wins in bento grid (locked decision)
  const displayWins = wins.slice(0, 3);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Focus timer"
      className={`fixed inset-0 z-50 flex flex-col bg-background ${exiting ? 'overlay-exit' : 'overlay-enter'}`}
      onAnimationEnd={() => { if (exiting) setVisible(false); }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
          Focus
        </span>
        <button
          aria-label="close"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Bento grid */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div
          className="w-full max-w-[600px] grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}
        >
          {displayWins.map((win) => (
            <BentoCell key={win.id} win={win} />
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
