import { useState } from 'react';
import { Pencil, Trash2, Play, Pause, Square } from 'lucide-react';
import { useStopwatch, formatElapsed } from '@/hooks/useStopwatch';

export default function WinCard({
  win,
  onEdit,
  onDelete,
  onStartTimer,
  onPauseTimer,
  onStopTimer,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const { displaySeconds, isRunning } = useStopwatch({
    elapsedBase: win.timer_elapsed_seconds ?? 0,
    startedAt: win.timer_started_at ?? null,
  });

  function handleEditStart() {
    setEditValue(win.title);
    setIsEditing(true);
  }

  function handleEditSubmit() {
    const trimmed = editValue.trim();
    if (trimmed) onEdit?.(trimmed);
    setIsEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleEditSubmit();
    else if (e.key === 'Escape') setIsEditing(false);
  }

  return (
    <div className="py-6 border-b font-mono group">
      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
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
          <span className="flex-1 text-lg leading-snug text-foreground">{win.title}</span>
        )}
        <button
          aria-label="edit"
          onClick={handleEditStart}
          className="text-muted-foreground/30 hover:text-muted-foreground transition-colors mt-0.5 opacity-0 group-hover:opacity-100 active:opacity-70 transition-opacity duration-75"
        >
          <Pencil size={16} />
        </button>
      </div>

      {/* Timer + controls row */}
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
    </div>
  );
}
