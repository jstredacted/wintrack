import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { formatPHP } from '@/lib/utils/currency';
import type { OneOffIncome } from '@/types/finance';

interface OneOffIncomeRowProps {
  entry: OneOffIncome;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, fields: Partial<{ amount: number; date: string; note: string }>) => Promise<void>;
  readOnly: boolean;
}

export default function OneOffIncomeRow({ entry, onDelete, onUpdate, readOnly }: OneOffIncomeRowProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editNote, setEditNote] = useState(entry.note);
  const [editAmount, setEditAmount] = useState(String(entry.amount));
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(entry.id);
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  const startEdit = () => {
    setEditNote(entry.note);
    setEditAmount(String(entry.amount));
    setEditing(true);
  };

  const saveEdit = async () => {
    const parsed = parseFloat(editAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onUpdate(entry.id, { amount: parsed, note: editNote });
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  if (confirmingDelete) {
    return (
      <div className="bg-card rounded-lg p-4 space-y-3">
        <p className="text-[0.778rem] text-muted-foreground font-mono">
          This will remove {formatPHP(entry.amount)} from your current balance.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className={`text-[0.778rem] font-mono text-destructive hover:underline ${
              deleting ? 'opacity-50' : ''
            }`}
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            disabled={deleting}
            className="text-[0.778rem] font-mono text-muted-foreground hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className={`bg-card rounded-lg p-4 flex items-center gap-3 ${saving ? 'opacity-50' : ''}`}>
        <input
          type="text"
          value={editNote}
          onChange={(e) => setEditNote(e.target.value)}
          onKeyDown={handleEditKeyDown}
          className="flex-1 bg-transparent font-mono text-base outline-none border-b border-foreground"
          autoFocus
        />
        <input
          type="number"
          value={editAmount}
          onChange={(e) => setEditAmount(e.target.value)}
          onKeyDown={handleEditKeyDown}
          className="w-24 bg-transparent font-mono text-[1.333rem] tabular-nums outline-none border-b border-foreground text-right"
          step="0.01"
        />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-4 flex items-center gap-3 group">
      <span className="text-base font-mono flex-1 min-w-0 truncate">{entry.note}</span>
      <span className="text-[0.778rem] text-muted-foreground font-mono shrink-0">
        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </span>
      <span className="text-[1.333rem] font-mono tabular-nums shrink-0">
        {formatPHP(entry.amount)}
      </span>
      {!readOnly && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0">
          <button
            type="button"
            onClick={startEdit}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Edit entry"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Delete entry"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
