import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { X, Plus, Square, Pause, Play } from 'lucide-react';
import { formatElapsed, useStopwatch } from '@/hooks/useStopwatch';

// Font size scales down gracefully for more timers
function timerFontSize(count) {
  if (count === 1) return 'clamp(5rem, 12vw, 10rem)';
  if (count === 2) return 'clamp(4rem, 8vw, 7rem)';
  return 'clamp(2.75rem, 5.5vw, 5rem)';
}

function TimerStation({ win, fontSize, onPause, onStop }) {
  const { displaySeconds } = useStopwatch({
    elapsedBase: win.timer_elapsed_seconds ?? 0,
    startedAt: win.timer_started_at ?? null,
  });

  const isRunning = !!win.timer_started_at;

  return (
    <div className="flex flex-col items-center gap-5 select-none">
      {/* Win title */}
      <span
        className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/50 text-center"
        style={{ maxWidth: '24ch' }}
        title={win.title}
      >
        {win.title.length > 28 ? win.title.slice(0, 28) + '…' : win.title}
      </span>

      {/* Timer number — the hero */}
      <span
        className="font-mono tabular-nums text-foreground font-light"
        style={{ fontSize, lineHeight: 1, letterSpacing: '-0.02em' }}
      >
        {formatElapsed(displaySeconds)}
      </span>

      {/* Per-win controls */}
      <div className="flex items-center gap-6">
        <button
          aria-label={isRunning ? 'Pause timer' : 'Resume timer'}
          onClick={() => onPause(win.id, displaySeconds)}
          className="text-muted-foreground/40 hover:text-foreground transition-colors"
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          aria-label="Stop timer"
          onClick={() => onStop(win.id, displaySeconds)}
          className="text-muted-foreground/40 hover:text-foreground transition-colors"
        >
          <Square size={16} />
        </button>
      </div>
    </div>
  );
}

function AddSlot({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Add a win"
      className="flex flex-col items-center gap-5 opacity-20 hover:opacity-60 transition-opacity cursor-pointer"
    >
      <span className="font-mono text-xs uppercase tracking-[0.2em]">New win</span>
      {/* Spacer to align with timer number row */}
      <span className="flex items-center justify-center" style={{ height: '1lh' }}>
        <Plus size={28} />
      </span>
      <span style={{ height: 18 }} />
    </button>
  );
}

export default function TimerFocusOverlay({
  open,
  wins = [],
  onClose,
  onStopAll,
  onAddWin,
  onPauseWin,
  onStopWin,
}) {
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
  const showAddSlot = displayWins.length < 3;
  const totalSlots = displayWins.length + (showAddSlot ? 1 : 0);
  const fontSize = timerFontSize(displayWins.length);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Focus timer"
      className={`fixed inset-0 z-50 flex flex-col bg-background ${exiting ? 'overlay-exit' : 'overlay-enter'}`}
      onAnimationEnd={() => { if (exiting) setVisible(false); }}
    >
      {/* Minimal header bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border/40">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground/40">
          Focus
        </span>
        <div className="flex items-center gap-6">
          {/* Stop all + close overlay */}
          <button
            aria-label="Stop all timers"
            onClick={onStopAll}
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground/40 hover:text-foreground transition-colors"
          >
            <Square size={14} />
            Stop all
          </button>
          {/* Dismiss only — timer keeps running */}
          <button
            aria-label="Close focus view"
            onClick={onClose}
            className="text-muted-foreground/40 hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Timer stations — horizontally centered, vertically centered */}
      <div className="flex-1 flex items-center justify-center px-12">
        {displayWins.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center gap-6 opacity-40">
            <span className="font-mono text-xs uppercase tracking-[0.2em]">No active wins</span>
            <button
              onClick={onAddWin}
              className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest hover:opacity-80 transition-opacity"
            >
              <Plus size={18} />
              Log a win
            </button>
          </div>
        ) : (
          <div
            className="flex items-center justify-center"
            style={{
              gap: totalSlots <= 2 ? 'clamp(4rem, 10vw, 8rem)' : 'clamp(3rem, 6vw, 5rem)',
            }}
          >
            {displayWins.map((win) => (
              <TimerStation
                key={win.id}
                win={win}
                fontSize={fontSize}
                onPause={onPauseWin}
                onStop={onStopWin}
              />
            ))}
            {showAddSlot && <AddSlot onClick={onAddWin} />}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
