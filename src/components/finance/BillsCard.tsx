import { useState, useMemo, useRef } from 'react';
import { Plus, CheckCircle2, Circle } from 'lucide-react';
import { getDueUrgency } from '@/lib/utils/finance';
import { formatPHP } from '@/lib/utils/currency';
import { getCurrentMonth } from '@/lib/utils/month';
import type { MonthlyBill, RecurrenceType } from '@/types/finance';

interface BillsCardProps {
  bills: MonthlyBill[];
  onTogglePaid: (id: string, paid: boolean) => void;
  onAddBill: (template: {
    name: string;
    amount: number;
    due_day: number | null;
    recurrence_type: RecurrenceType;
    start_month: string;
  }) => Promise<void>;
  readOnly: boolean;
}

export default function BillsCard({ bills, onTogglePaid, onAddBill, readOnly }: BillsCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('one_time');
  const nameRef = useRef<HTMLInputElement>(null);

  const sortedBills = useMemo(() => {
    return [...bills].sort((a, b) => {
      if (a.paid !== b.paid) return a.paid ? 1 : -1;
      const urgA = getDueUrgency(a.due_day);
      const urgB = getDueUrgency(b.due_day);
      return urgA.daysUntil - urgB.daysUntil;
    });
  }, [bills]);

  const resetForm = () => {
    setName('');
    setAmount('');
    setDueDay('');
    setRecurrenceType('one_time');
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const parsedAmount = parseFloat(amount);
    const parsedDay = parseInt(dueDay, 10);
    if (!trimmedName || isNaN(parsedAmount) || parsedAmount <= 0) return;

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
      resetForm();
      setTimeout(() => nameRef.current?.focus(), 0);
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

  const inputBase =
    'bg-transparent border-b border-foreground/20 font-mono text-[0.778rem] py-1.5 focus:outline-none focus:border-foreground/50 placeholder:text-muted-foreground w-full';

  return (
    <div className="flex-1 bg-card border border-border rounded-lg p-5 flex flex-col min-w-0">
      {/* Card header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="font-mono text-[0.778rem] uppercase tracking-widest text-muted-foreground">
          Bills
        </h3>
        {!readOnly && bills.length > 0 && !showForm && (
          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setTimeout(() => nameRef.current?.focus(), 0);
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Add bill"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Inline add form — stacked vertically */}
        {showForm && (
          <div className="space-y-3 mb-4 pb-4 border-b border-foreground/10" onKeyDown={handleKeyDown}>
            <div>
              <label className="text-[0.611rem] font-mono text-muted-foreground uppercase tracking-wider">Name</label>
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bill name"
                disabled={saving}
                className={inputBase}
              />
            </div>
            <div>
              <label className="text-[0.611rem] font-mono text-muted-foreground uppercase tracking-wider">Amount</label>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '' || /^\d*\.?\d*$/.test(v)) setAmount(v);
                }}
                placeholder="₱ 0.00"
                disabled={saving}
                className={inputBase}
              />
            </div>
            <div>
              <label className="text-[0.611rem] font-mono text-muted-foreground uppercase tracking-wider">Due Day</label>
              <input
                type="text"
                inputMode="numeric"
                value={dueDay}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '' || /^\d{1,2}$/.test(v)) setDueDay(v);
                }}
                placeholder="Day of month"
                disabled={saving}
                className={inputBase}
              />
            </div>
            <div>
              <label className="text-[0.611rem] font-mono text-muted-foreground uppercase tracking-wider">Recurrence</label>
              <select
                value={recurrenceType}
                onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
                disabled={saving}
                className={inputBase}
              >
                <option value="one_time">One-time</option>
                <option value="ongoing">Ongoing</option>
                <option value="recurring_n">Recurring</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="text-[0.667rem] font-mono text-foreground hover:underline disabled:opacity-50"
              >
                Add Another
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

        {/* Bill rows */}
        <div className="space-y-0">
          {sortedBills.length === 0 && !showForm ? (
            <div className="flex flex-col items-center justify-center py-8">
              {!readOnly ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(true);
                    setTimeout(() => nameRef.current?.focus(), 0);
                  }}
                  className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                >
                  <Plus size={32} strokeWidth={1} />
                </button>
              ) : (
                <span className="text-[0.778rem] font-mono text-muted-foreground">No bills</span>
              )}
            </div>
          ) : (
            sortedBills.map((bill) => (
              <div
                key={bill.id}
                className={`flex items-center gap-3 py-3 ${bill.paid ? 'opacity-40' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => { if (!readOnly) onTogglePaid(bill.id, !bill.paid); }}
                  disabled={readOnly}
                  className="shrink-0 transition-colors hover:text-foreground disabled:opacity-40"
                  aria-label={bill.paid ? 'Mark unpaid' : 'Mark paid'}
                >
                  {bill.paid ? (
                    <CheckCircle2 size={16} className="text-foreground" />
                  ) : (
                    <Circle size={16} className="text-muted-foreground" />
                  )}
                </button>
                <span
                  className={`font-mono text-[0.833rem] flex-1 min-w-0 truncate ${
                    bill.paid ? 'line-through' : ''
                  }`}
                >
                  {bill.name}
                </span>
                <span className="font-mono text-[0.833rem] tabular-nums shrink-0">
                  {formatPHP(bill.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add bill link at bottom */}
      {!readOnly && bills.length > 0 && !showForm && (
        <button
          type="button"
          onClick={() => {
            setShowForm(true);
            setTimeout(() => nameRef.current?.focus(), 0);
          }}
          className="flex items-center gap-1 text-[0.667rem] font-mono text-muted-foreground hover:text-foreground transition-colors mt-4 shrink-0"
        >
          <Plus size={12} />
          <span>Add Bill</span>
        </button>
      )}
    </div>
  );
}
