import { useState } from 'react';
import { Pencil, Trash2, Play, Pause, Square } from 'lucide-react';
import { useStopwatch, formatElapsed } from '@/hooks/useStopwatch';

/**
 * WinCard
 *
 * Props:
 *   win: { id, title, timer_elapsed_seconds, timer_started_at }
 *   onEdit(newTitle)         — called on Enter with non-empty trimmed value
 *   onDelete()               — called when Trash2 is clicked
 *   onStartTimer()           — called when Play is clicked
 *   onPauseTimer(seconds)    — called when Pause is clicked
 *   onStopTimer(seconds)     — called when Stop (Square) is clicked
 */
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
    if (trimmed) {
      onEdit?.(trimmed);
    }
    setIsEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  }

  return (
    <div className="border border-border rounded p-4 font-mono text-sm">
      {/* Title row */}
      <div className="flex items-center justify-between gap-2">
        {isEditing ? (
          <input
            className="flex-1 bg-transparent border-b border-border outline-none text-foreground"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <span className="flex-1 text-foreground">{win.title}</span>
        )}

        <button
          aria-label="edit"
          onClick={handleEditStart}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Pencil size={14} />
        </button>
      </div>

      {/* Action row */}
      <div className="flex items-center justify-between gap-2 mt-2">
        <span className="text-muted-foreground tabular-nums">
          {formatElapsed(displaySeconds)}
        </span>

        <div className="flex items-center gap-1">
          {isRunning ? (
            <>
              <button
                aria-label="pause"
                onClick={() => onPauseTimer?.(displaySeconds)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pause size={14} />
              </button>
              <button
                aria-label="stop"
                onClick={() => onStopTimer?.(displaySeconds)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Square size={14} />
              </button>
            </>
          ) : (
            <button
              aria-label="start"
              onClick={() => onStartTimer?.()}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Play size={14} />
            </button>
          )}

          <button
            aria-label="delete"
            onClick={() => onDelete?.()}
            className="text-muted-foreground hover:text-foreground transition-colors ml-1"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
