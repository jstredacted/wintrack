import { useState } from 'react';
import type { OneOffIncome } from '@/types/finance';
import OneOffIncomeRow from './OneOffIncomeRow';

interface OneOffIncomeSectionProps {
  entries: OneOffIncome[];
  onAdd: (amount: number, date: string, note: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, fields: Partial<{ amount: number; date: string; note: string }>) => Promise<void>;
  readOnly: boolean;
}

function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function OneOffIncomeSection({ entries, onAdd, onDelete, onUpdate, readOnly }: OneOffIncomeSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => getTodayString());
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setAmount('');
    setDate(getTodayString());
    setNote('');
    setShowForm(false);
  };

  const handleSubmit = async () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0 || !note.trim()) return;

    setSubmitting(true);
    try {
      await onAdd(parsed, date, note.trim());
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      resetForm();
    }
  };

  return (
    <div className="space-y-2">
      <h2 className="font-mono text-[0.778rem] uppercase tracking-widest text-muted-foreground">
        ONE-OFF INCOME
      </h2>

      {entries.length === 0 && !showForm && (
        <div className="text-center py-8">
          <p className="text-foreground font-mono">No bonus income</p>
          <p className="text-muted-foreground text-[0.778rem] mt-1">
            Record one-off income like freelance payments or debts collected.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {entries.map((entry) => (
          <OneOffIncomeRow
            key={entry.id}
            entry={entry}
            onDelete={onDelete}
            onUpdate={onUpdate}
            readOnly={readOnly}
          />
        ))}
      </div>

      {!readOnly && (
        <>
          {showForm ? (
            <div className={`bg-card rounded-lg p-4 flex items-center gap-3 ${submitting ? 'opacity-50' : ''}`}>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Amount"
                className="w-24 bg-transparent font-mono text-base outline-none border-b border-foreground tabular-nums"
                step="0.01"
                autoFocus
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-transparent font-mono text-[0.778rem] text-muted-foreground outline-none border-b border-foreground"
              />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Note"
                className="flex-1 bg-transparent font-mono text-base outline-none border-b border-foreground"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="text-[0.778rem] font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              Add Income
            </button>
          )}
        </>
      )}
    </div>
  );
}
