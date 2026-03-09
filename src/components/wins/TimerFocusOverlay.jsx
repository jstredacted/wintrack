import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { X, Plus, Square } from 'lucide-react';
import { formatElapsed, useStopwatch } from '@/hooks/useStopwatch';

function BentoCell({ win }) {
  const { displaySeconds } = useStopwatch({
    elapsedBase: win.timer_elapsed_seconds ?? 0,
    startedAt: win.timer_started_at ?? null,
  });

  return (
    <div className="flex flex-col justify-between p-6 border border-border rounded-lg font-mono h-full min-h-[160px]">
      <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground line-clamp-2">
        {win.title}
      </span>
      <span className="text-5xl tabular-nums text-foreground mt-4">
        {formatElapsed(displaySeconds)}
      </span>
    </div>
  );
}

export default function TimerFocusOverlay({ open, wins = [], onClose, onStopAll, onAddWin }) {
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

  const displayWins = wins.slice(0, 3);

  // Grid layout: 1 win = full, 2 wins = side-by-side, 3 = 3-col
  const gridCols = displayWins.length === 1
    ? 'grid-cols-1'
    : displayWins.length === 2
    ? 'grid-cols-2'
    : 'grid-cols-3';

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
        <div className="flex items-center gap-4">
          {/* Add win */}
          <button
            aria-label="Add a win"
            onClick={onAddWin}
            className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus size={18} />
            Add win
          </button>
          {/* Stop all timers */}
          <button
            aria-label="Stop timer"
            onClick={onStopAll}
            className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            <Square size={18} />
            Stop
          </button>
          {/* Dismiss overlay only */}
          <button
            aria-label="close"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Bento grid — fills all remaining space */}
      <div className="flex-1 p-6">
        {displayWins.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              No active wins
            </p>
            <button
              onClick={onAddWin}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            >
              <Plus size={18} />
              Log a win
            </button>
          </div>
        ) : (
          <div className={`grid ${gridCols} gap-4 h-full`}>
            {displayWins.map((win) => (
              <BentoCell key={win.id} win={win} />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
