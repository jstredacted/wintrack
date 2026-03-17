import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { getCurrentMonth } from '@/lib/utils/month';
import type { RecurrenceType } from '@/types/finance';

interface BillAddModalProps {
  open: boolean;
  onClose: () => void;
  onAddBill: (template: {
    name: string;
    amount: number;
    due_day: number | null;
    recurrence_type: RecurrenceType;
    start_month: string;
  }) => Promise<void>;
}

export default function BillAddModal({ open, onClose, onAddBill }: BillAddModalProps) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('one_time');
  const [justAdded, setJustAdded] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const isOneTime = recurrenceType === 'one_time';

  const resetForm = () => {
    setName('');
    setAmount('');
    setDueDay('');
    setRecurrenceType('one_time');
    setJustAdded(false);
  };

  useEffect(() => {
    if (open) {
      resetForm();
      setTimeout(() => nameRef.current?.focus(), 50);
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
    const trimmedName = name.trim();
    const parsedAmount = parseFloat(amount);
    const parsedDay = parseInt(dueDay, 10);

    if (!trimmedName || isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (!isOneTime && (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31)) return;

    const finalDueDay = dueDay === '' || isNaN(parsedDay) ? null : parsedDay;

    setSaving(true);
    try {
      await onAddBill({
        name: trimmedName,
        amount: parsedAmount,
        due_day: finalDueDay,
        recurrence_type: recurrenceType,
        start_month: getCurrentMonth(),
      });
      setJustAdded(true);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAnother = () => {
    resetForm();
    setTimeout(() => nameRef.current?.focus(), 50);
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
        <h2 className="font-mono text-[1.333rem] font-light">Add Bill</h2>

        {justAdded ? (
          <div className="space-y-6">
            <p className="font-mono text-muted-foreground text-[0.778rem]">
              Bill added successfully.
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
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bill name"
              disabled={saving}
              className={inputBase}
            />
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '' || /^\d*\.?\d*$/.test(v)) setAmount(v);
              }}
              placeholder="Amount"
              disabled={saving}
              className={`${inputBase} tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
            />
            <select
              value={recurrenceType}
              onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
              disabled={saving}
              className={`${inputBase} text-[0.778rem]`}
            >
              <option value="one_time">One-time</option>
              <option value="ongoing">Ongoing</option>
              <option value="recurring_n">Recurring</option>
            </select>
            {!isOneTime && (
              <input
                type="text"
                inputMode="numeric"
                value={dueDay}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '' || /^\d{1,2}$/.test(v)) setDueDay(v);
                }}
                placeholder="Due day (1-31)"
                disabled={saving}
                className={`${inputBase} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
              />
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className={[
                'w-full py-3 bg-foreground text-background rounded font-mono text-[0.778rem] hover:opacity-80 transition-opacity',
                saving ? 'opacity-50' : '',
              ].join(' ')}
            >
              {saving ? 'Adding...' : 'Add Bill'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
