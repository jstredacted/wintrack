import { useState, useRef, type KeyboardEvent } from 'react';
import { getCurrentMonth } from '@/lib/utils/month';
import type { RecurrenceType } from '@/types/finance';

interface BillAddInlineProps {
  onAddBill: (template: {
    name: string;
    amount: number;
    due_day: number | null;
    recurrence_type: RecurrenceType;
    start_month: string;
  }) => Promise<void>;
}

export default function BillAddInline({ onAddBill }: BillAddInlineProps) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('one_time');
  const nameRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName('');
    setAmount('');
    setDueDay('');
    setRecurrenceType('one_time');
    setExpanded(false);
  };

  const isOneTime = recurrenceType === 'one_time';

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const parsedAmount = parseFloat(amount);
    const parsedDay = parseInt(dueDay, 10);

    if (!trimmedName || isNaN(parsedAmount) || parsedAmount <= 0) return;

    // Due day is required for recurring bills, optional for one-time
    if (!isOneTime && (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31)) return;
    if (dueDay !== '' && !isOneTime && (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31)) return;

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
      reset();
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      reset();
    }
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => {
          setExpanded(true);
          setTimeout(() => nameRef.current?.focus(), 0);
        }}
        className="text-[0.778rem] text-muted-foreground hover:text-foreground cursor-pointer py-2 transition-colors"
      >
        + Add Bill
      </button>
    );
  }

  const inputBase =
    'bg-transparent border-b border-foreground/20 font-mono text-base py-1 focus:outline-none focus:border-foreground/50 placeholder:text-muted-foreground';

  return (
    <div
      className="flex gap-2 items-center py-2"
      onKeyDown={handleKeyDown}
    >
      <input
        ref={nameRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Bill name"
        disabled={saving}
        className={`flex-1 ${inputBase}`}
      />
      <input
        type="text"
        inputMode="decimal"
        value={amount}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '' || /^\d*\.?\d*$/.test(v)) setAmount(v);
        }}
        placeholder="0.00"
        disabled={saving}
        className={`w-24 text-right tabular-nums ${inputBase} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
      />
      {!isOneTime && (
        <input
          type="text"
          inputMode="numeric"
          value={dueDay}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '' || /^\d{1,2}$/.test(v)) setDueDay(v);
          }}
          placeholder="Day"
          disabled={saving}
          className={`w-16 text-center ${inputBase} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        />
      )}
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
    </div>
  );
}
