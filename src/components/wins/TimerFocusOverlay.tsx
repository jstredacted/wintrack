// STOPWATCH REMOVED — entire file kept for potential re-enable
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { X, Plus, Square, Pause, Play } from 'lucide-react';
import { formatElapsed, useStopwatch } from '@/hooks/useStopwatch';

interface TimerWin {
  id: string;
  title: string;
  timer_elapsed_seconds?: number;
  timer_started_at?: string | null;
  _onPause?: (id: string, seconds: number) => void;
  _onStart?: (id: string) => void;
  _onStop?: (id: string, seconds: number) => void;
}

function timerFontSize(count: number): string {
  if (count === 1) return 'clamp(5rem, 12vw, 10rem)';
  if (count === 2) return 'clamp(4rem, 8vw, 7rem)';
  if (count === 3) return 'clamp(2.75rem, 5.5vw, 5rem)';
  return 'clamp(2rem, 4vw, 3.5rem)';
}

function TimerStation({ win, fontSize }: { win: TimerWin; fontSize: string }) {
  const { displaySeconds } = useStopwatch({
    elapsedBase: win.timer_elapsed_seconds ?? 0,
    startedAt: win.timer_started_at ?? null,
  });

  const isRunning = !!win.timer_started_at;
  const hasElapsed = (win.timer_elapsed_seconds ?? 0) > 0;

  const playLabel = isRunning ? 'Pause timer' : hasElapsed ? 'Resume timer' : 'Start timer';

  return (
    <div className="flex flex-col items-center gap-6 select-none" data-win-id={win.id} data-display-seconds={displaySeconds}>
      <span
        className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground text-center"
        style={{ maxWidth: '22ch' }}
      >
        {win.title.length > 30 ? win.title.slice(0, 30) + '…' : win.title}
      </span>

      <span
        className="font-mono tabular-nums text-foreground font-light"
        style={{ fontSize, lineHeight: 1, letterSpacing: '-0.02em' }}
      >
        {formatElapsed(displaySeconds)}
      </span>

      <div className="flex items-center gap-6">
        <button
          aria-label={playLabel}
          onClick={() => {
            if (isRunning) {
              win._onPause?.(win.id, displaySeconds);
            } else {
              win._onStart?.(win.id);
            }
          }}
          className="text-muted-foreground hover:text-foreground transition-colors active:opacity-70 transition-opacity duration-75"
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          aria-label="Stop timer"
          onClick={() => win._onStop?.(win.id, displaySeconds)}
          className="text-muted-foreground hover:text-foreground transition-colors active:opacity-70 transition-opacity duration-75"
        >
          <Square size={16} />
        </button>
      </div>
    </div>
  );
}

function AddSlot({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Add a win"
      className="flex flex-col items-center justify-center gap-6 opacity-30 hover:opacity-70 active:opacity-50 transition-opacity cursor-pointer px-10 py-8"
    >
      <span className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
        New win
      </span>
      <div className="w-16 h-16 rounded-full border border-muted-foreground/50 flex items-center justify-center">
        <Plus size={24} strokeWidth={1.5} />
      </div>
    </button>
  );
}

interface TimerFocusOverlayProps {
  open: boolean;
  wins?: TimerWin[];
  onClose: () => void;
  onStopAll: () => void;
  onAddWin: () => void;
  onPauseWin: (id: string, seconds: number) => void;
  onStartWin: (id: string) => void;
  onStopWin: (id: string, seconds: number) => void;
}

export default function TimerFocusOverlay({
  open,
  wins = [],
  onClose,
  onStopAll,
  onAddWin,
  onPauseWin,
  onStartWin,
  onStopWin,
}: TimerFocusOverlayProps) {
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

  const displayWins = wins.map(w => ({
    ...w,
    _onPause: onPauseWin,
    _onStart: onStartWin,
    _onStop: onStopWin,
  }));
  const showAddSlot = true; // always show Add slot — no cap on win count
  const totalItems = displayWins.length + (showAddSlot ? 1 : 0);
  const fontSize = timerFontSize(displayWins.length);
  const useGrid = totalItems >= 3;
  const gapStyle = totalItems <= 2 ? 'clamp(4rem, 10vw, 8rem)' : 'clamp(3rem, 6vw, 5rem)';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Focus timer"
      className={`fixed inset-0 z-50 flex flex-col bg-background ${exiting ? 'overlay-exit' : 'overlay-enter'}`}
      onAnimationEnd={() => { if (exiting) setVisible(false); }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border/40">
        <span className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground/60">
          Focus
        </span>
        <div className="flex items-center gap-8">
          <button
            aria-label="Stop all timers"
            onClick={onStopAll}
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors active:scale-[0.96] transition-transform duration-75"
          >
            <Square size={14} />
            Stop all
          </button>
          <button
            aria-label="Close focus view"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors active:opacity-70 transition-opacity duration-75"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Timers */}
      <div className="flex-1 flex items-center justify-center px-12">
        {displayWins.length === 0 ? (
          <div className="flex flex-col items-center gap-6 text-muted-foreground/40">
            <span className="font-mono text-sm uppercase tracking-[0.2em]">No active wins</span>
            <button
              onClick={onAddWin}
              className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest hover:text-muted-foreground transition-colors active:opacity-70 transition-opacity duration-75"
            >
              <Plus size={18} />
              Log a win
            </button>
          </div>
        ) : useGrid ? (
          <div className="grid grid-cols-2 gap-x-20 gap-y-16 items-center justify-items-center">
            {displayWins.map((win) => (
              <TimerStation key={win.id} win={win} fontSize={fontSize} />
            ))}
            {showAddSlot && <AddSlot onClick={onAddWin} />}
          </div>
        ) : (
          <div className="flex items-center justify-center" style={{ gap: gapStyle }}>
            {displayWins.map((win) => (
              <TimerStation key={win.id} win={win} fontSize={fontSize} />
            ))}
            {showAddSlot && <AddSlot onClick={onAddWin} />}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
