import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { formatPHP } from '@/lib/utils/currency';
import type { OneOffIncome } from '@/types/finance';

interface OneOffCardProps {
  entries: OneOffIncome[];
  onAdd: (amount: number, date: string, note: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, fields: Partial<{ amount: number; date: string; note: string }>) => Promise<void>;
  readOnly: boolean;
}

export default function OneOffCard({ entries, onAdd, onDelete, onUpdate, readOnly }: OneOffCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const amountRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setAmount('');
    setDate(new Date().toISOString().slice(0, 10));
    setNote('');
  };

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    setSaving(true);
    try {
      await onAdd(parsedAmount, date, note.trim() || 'One-off');
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDone = () => {
    resetForm();
    setShowForm(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
    if (e.key === 'Escape') { e.preventDefault(); handleDone(); }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      await onDelete(id);
    } finally {
      setSaving(false);
      setConfirmDeleteId(null);
    }
  };

  const startEdit = (entry: OneOffIncome) => {
    setEditingId(entry.id);
    setEditNote(entry.note);
    setEditAmount(String(entry.amount));
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const parsed = parseFloat(editAmount);
    if (isNaN(parsed) || parsed <= 0) { setEditingId(null); return; }
    setSaving(true);
    try {
      await onUpdate(editingId, { amount: parsed, note: editNote });
    } finally {
      setSaving(false);
      setEditingId(null);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
    if (e.key === 'Escape') { e.preventDefault(); setEditingId(null); }
  };

  const inputBase =
    'bg-transparent border-b border-foreground/20 font-mono text-[0.778rem] py-1 focus:outline-none focus:border-foreground/50 placeholder:text-muted-foreground w-full';

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono text-[0.778rem] uppercase tracking-widest text-muted-foreground">
          One-Off
        </h3>
        {!readOnly && entries.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setTimeout(() => amountRef.current?.focus(), 0);
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Add one-off income"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Inline add form */}
      {showForm && (
        <div className="space-y-2 mb-4 pb-4 border-b border-foreground/10" onKeyDown={handleKeyDown}>
          <div className="flex gap-3">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note"
              disabled={saving}
              className={`${inputBase} flex-1`}
            />
            <input
              ref={amountRef}
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '' || /^\d*\.?\d*$/.test(v)) setAmount(v);
              }}
              placeholder="Amount"
              disabled={saving}
              className={`${inputBase} w-24 text-right`}
            />
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={saving}
            className={`${inputBase} text-[0.667rem]`}
          />
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="text-[0.667rem] font-mono text-foreground hover:underline disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              onClick={handleDone}
              className="text-[0.667rem] font-mono text-muted-foreground hover:underline"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Entry rows */}
      <div className="space-y-3">
        {entries.length === 0 && !showForm ? (
          <div className="flex items-center justify-center py-8">
            {!readOnly ? (
              <button
                type="button"
                onClick={() => {
                  setShowForm(true);
                  setTimeout(() => amountRef.current?.focus(), 0);
                }}
                className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                <Plus size={32} strokeWidth={1} />
              </button>
            ) : (
              <span className="text-[0.778rem] font-mono text-muted-foreground">No entries</span>
            )}
          </div>
        ) : (
          entries.map((entry) => {
            if (confirmDeleteId === entry.id) {
              return (
                <div key={entry.id} className="space-y-1">
                  <p className="text-[0.667rem] font-mono text-muted-foreground">
                    Remove {formatPHP(entry.amount)}?
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      disabled={saving}
                      className="text-[0.667rem] font-mono text-destructive hover:underline"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-[0.667rem] font-mono text-muted-foreground hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            }

            if (editingId === entry.id) {
              return (
                <div key={entry.id} className="space-y-1" onKeyDown={handleEditKeyDown}>
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    className={inputBase}
                    autoFocus
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className={`${inputBase} text-right`}
                  />
                </div>
              );
            }

            return (
              <div key={entry.id} className="flex items-start gap-3 group">
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-[0.833rem] block truncate">
                    {entry.note}
                  </span>
                  <span className="text-[0.667rem] text-muted-foreground font-mono">
                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <span className="font-mono text-[0.833rem] tabular-nums shrink-0 pt-0.5">
                  {formatPHP(entry.amount)}
                </span>
                {!readOnly && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0 pt-0.5">
                    <button
                      type="button"
                      onClick={() => startEdit(entry)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Edit"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(entry.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add link at bottom */}
      {!readOnly && entries.length > 0 && !showForm && (
        <button
          type="button"
          onClick={() => {
            setShowForm(true);
            setTimeout(() => amountRef.current?.focus(), 0);
          }}
          className="flex items-center gap-1 text-[0.667rem] font-mono text-muted-foreground hover:text-foreground transition-colors mt-4"
        >
          <Plus size={12} />
          <span>Add Payment</span>
        </button>
      )}
    </div>
  );
}
