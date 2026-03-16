import { useState } from 'react';
import { Pencil, Trash2, Circle, CheckCircle } from 'lucide-react';
import type { Database } from '@/lib/database.types';
// STOPWATCH REMOVED — Play, Pause, Square imports kept for potential re-enable
// import { Play, Pause, Square } from 'lucide-react';
// STOPWATCH REMOVED — useStopwatch import kept for potential re-enable
// import { useStopwatch, formatElapsed } from '@/hooks/useStopwatch';

type Win = Database['public']['Tables']['wins']['Row'];

interface WinCardProps {
  win: Win;
  onEdit?: (newTitle: string) => void;
  onDelete?: () => void;
  onToggle?: () => void;
}

export default function WinCard({
  win,
  onEdit,
  onDelete,
  onToggle,
  // STOPWATCH REMOVED — onStartTimer, onPauseTimer, onStopTimer props
  // onStartTimer,
  // onPauseTimer,
  // onStopTimer,
}: WinCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  // STOPWATCH REMOVED — useStopwatch hook
  // const { displaySeconds, isRunning } = useStopwatch({
  //   elapsedBase: win.timer_elapsed_seconds ?? 0,
  //   startedAt: win.timer_started_at ?? null,
  // });

  function handleEditStart() {
    setEditValue(win.title);
    setIsEditing(true);
  }

  function handleEditSubmit() {
    const trimmed = editValue.trim();
    if (trimmed) onEdit?.(trimmed);
    setIsEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleEditSubmit();
    else if (e.key === 'Escape') setIsEditing(false);
  }

  return (
    <div className="py-6 border-b font-mono group">
      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <button
          aria-label={win.completed ? 'Mark incomplete' : 'Mark complete'}
          onClick={() => onToggle?.()}
          className="shrink-0 mt-1 text-muted-foreground/40 hover:text-foreground transition-colors"
        >
          {win.completed ? <CheckCircle size={16} /> : <Circle size={16} />}
        </button>
        {isEditing ? (
          <input
            className="flex-1 bg-transparent border-b border-border outline-none text-lg text-foreground pb-1"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleEditSubmit}
            autoFocus
          />
        ) : (
          <span className={`flex-1 text-lg leading-snug ${win.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {win.title}
          </span>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          <button
            aria-label="edit"
            onClick={handleEditStart}
            className="text-muted-foreground/30 hover:text-muted-foreground transition-colors opacity-0 group-hover:opacity-100 active:opacity-70 transition-opacity duration-75"
          >
            <Pencil size={16} />
          </button>
          <button
            aria-label="delete"
            onClick={() => onDelete?.()}
            className="text-muted-foreground/30 hover:text-muted-foreground transition-colors opacity-0 group-hover:opacity-100 active:opacity-70 transition-opacity duration-75"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Category badge — suppressed for default 'work' category */}
      {win.category && win.category !== 'work' && (
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground border border-border px-1.5 py-0.5 ml-7 mt-1 inline-block">
          {win.category}
        </span>
      )}

      {/* STOPWATCH REMOVED — Timer + controls row
      <div className="flex items-center justify-between mt-3">
        <span className="text-3xl tabular-nums text-muted-foreground/50 font-light tracking-tight">
          {formatElapsed(displaySeconds)}
        </span>

        <div className="flex items-center gap-3">
          {isRunning ? (
            <>
              <button
                aria-label="pause"
                onClick={() => onPauseTimer?.(displaySeconds)}
                className="text-muted-foreground hover:text-foreground transition-colors active:opacity-70 transition-opacity duration-75"
              >
                <Pause size={18} />
              </button>
              <button
                aria-label="stop"
                onClick={() => onStopTimer?.(displaySeconds)}
                className="text-muted-foreground hover:text-foreground transition-colors active:opacity-70 transition-opacity duration-75"
              >
                <Square size={18} />
              </button>
            </>
          ) : (
            <button
              aria-label="start"
              onClick={() => onStartTimer?.()}
              className="text-muted-foreground hover:text-foreground transition-colors active:opacity-70 transition-opacity duration-75"
            >
              <Play size={18} />
            </button>
          )}
          <button
            aria-label="delete"
            onClick={() => onDelete?.()}
            className="text-muted-foreground/30 hover:text-muted-foreground transition-colors opacity-0 group-hover:opacity-100 ml-1 active:opacity-70 transition-opacity duration-75"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      */}
    </div>
  );
}
