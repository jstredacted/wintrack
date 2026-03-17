import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

interface OneOffIncomeModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (amount: number, date: string, note: string) => Promise<void>;
}

function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function OneOffIncomeModal({ open, onClose, onAdd }: OneOffIncomeModalProps) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => getTodayString());
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setAmount('');
    setDate(getTodayString());
    setNote('');
    setJustAdded(false);
  };

  useEffect(() => {
    if (open) {
      resetForm();
      setTimeout(() => amountRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleSubmit = async () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0 || !note.trim()) return;

    setSubmitting(true);
    try {
      await onAdd(parsed, date, note.trim());
      setJustAdded(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    resetForm();
    setTimeout(() => amountRef.current?.focus(), 50);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!open) return null;

  const inputBase =
    'w-full bg-transparent border-b border-foreground/20 font-mono text-base py-2 focus:outline-none focus:border-foreground/50 placeholder:text-muted-foreground';

  return createPortal(
    <div
      className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center modal-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-background border border-border rounded-lg p-8 w-full max-w-md mx-4 space-y-6">
        <h2 className="font-mono text-[1.333rem] font-light">Add Income</h2>

        {justAdded ? (
          <div className="space-y-6">
            <p className="font-mono text-muted-foreground text-[0.778rem]">
              Income recorded successfully.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-foreground/20 rounded font-mono text-[0.778rem] hover:bg-foreground/5 transition-colors"
              >
                Done
              </button>
              <button
                type="button"
                onClick={handleAddAnother}
                className="flex-1 py-3 bg-foreground text-background rounded font-mono text-[0.778rem] hover:opacity-80 transition-opacity"
              >
                + Add Another
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4" onKeyDown={handleKeyDown}>
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
              disabled={submitting}
              className={`${inputBase} tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={submitting}
              className={`${inputBase} text-[0.778rem] text-muted-foreground`}
            />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (required)"
              disabled={submitting}
              className={inputBase}
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className={[
                'w-full py-3 bg-foreground text-background rounded font-mono text-[0.778rem] hover:opacity-80 transition-opacity',
                submitting ? 'opacity-50' : '',
              ].join(' ')}
            >
              {submitting ? 'Adding...' : 'Add Income'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
