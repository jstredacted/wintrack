import { useState, useRef, useEffect } from 'react';
import { formatPHP } from '@/lib/utils/currency';

interface BudgetProgressBarProps {
  paidTotal: number;
  unpaidTotal: number;
  budgetLimit: number;
  totalIncome: number;
  onUpdateBudgetLimit?: (newLimit: number) => Promise<void>;
  readOnly?: boolean;
}

export default function BudgetProgressBar({
  paidTotal,
  unpaidTotal,
  budgetLimit,
  totalIncome,
  onUpdateBudgetLimit,
  readOnly,
}: BudgetProgressBarProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetValue, setBudgetValue] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingBudget && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingBudget]);

  // Avoid division by zero
  const base = totalIncome > 0 ? totalIncome : 1;
  const paidPct = Math.min((paidTotal / base) * 100, 100);
  const unpaidPct = Math.min((unpaidTotal / base) * 100, 100 - paidPct);
  const budgetPct = Math.min((budgetLimit / base) * 100, 100);

  const startBudgetEdit = () => {
    if (readOnly || !onUpdateBudgetLimit) return;
    setBudgetValue(budgetLimit > 0 ? String(budgetLimit) : '');
    setEditingBudget(true);
  };

  const saveBudget = async () => {
    const parsed = parseFloat(budgetValue);
    if (isNaN(parsed) || parsed < 0 || !onUpdateBudgetLimit) {
      setEditingBudget(false);
      return;
    }
    setSaving(true);
    try {
      await onUpdateBudgetLimit(parsed);
    } finally {
      setSaving(false);
      setEditingBudget(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); saveBudget(); }
    else if (e.key === 'Escape') { e.preventDefault(); setEditingBudget(false); }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-mono text-[0.778rem] uppercase tracking-widest text-muted-foreground">
        Budget
      </h3>

      {/* Bar container */}
      <div className="relative h-8 rounded-md bg-muted overflow-hidden">
        {/* Zone 1: Paid bills */}
        <div
          className="absolute inset-y-0 left-0 bg-foreground/40 transition-all duration-300 rounded-l-md"
          style={{ width: `${paidPct}%` }}
          onMouseEnter={() => setHoveredZone('paid')}
          onMouseLeave={() => setHoveredZone(null)}
        />

        {/* Zone 3: Unpaid projected */}
        <div
          className="absolute inset-y-0 bg-foreground/15 transition-all duration-300"
          style={{ left: `${paidPct}%`, width: `${unpaidPct}%` }}
          onMouseEnter={() => setHoveredZone('unpaid')}
          onMouseLeave={() => setHoveredZone(null)}
        />

        {/* Budget limit marker */}
        {budgetLimit > 0 && (
          <div
            className="absolute inset-y-0 w-px border-l-2 border-dashed border-foreground/60 transition-all duration-300"
            style={{ left: `${budgetPct}%` }}
            onMouseEnter={() => setHoveredZone('limit')}
            onMouseLeave={() => setHoveredZone(null)}
          />
        )}

        {/* Tooltip */}
        {hoveredZone && (
          <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-foreground text-background text-[0.667rem] font-mono px-2 py-1 rounded whitespace-nowrap z-10">
            {hoveredZone === 'paid' && `Paid: ${formatPHP(paidTotal)}`}
            {hoveredZone === 'unpaid' && `Unpaid: ${formatPHP(unpaidTotal)}`}
            {hoveredZone === 'limit' && `Budget: ${formatPHP(budgetLimit)}`}
          </div>
        )}
      </div>

      {/* Labels below */}
      <div className="flex justify-between text-[0.667rem] font-mono text-muted-foreground">
        <span>Paid {formatPHP(paidTotal)}</span>
        <span>Unpaid {formatPHP(unpaidTotal)}</span>
      </div>

      {/* Editable budget limit */}
      <div className="pt-1">
        {editingBudget ? (
          <div className="flex items-center gap-2">
            <span className="text-[0.778rem] font-mono text-muted-foreground">Budget:</span>
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={budgetValue}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '' || /^\d*\.?\d*$/.test(v)) setBudgetValue(v);
              }}
              onKeyDown={handleKeyDown}
              onBlur={saveBudget}
              disabled={saving}
              className={`bg-transparent border-b border-foreground font-mono text-[0.778rem] tabular-nums py-0.5 focus:outline-none w-32 ${saving ? 'opacity-50' : ''}`}
              placeholder="0"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={startBudgetEdit}
            disabled={readOnly || !onUpdateBudgetLimit}
            className="text-[0.778rem] font-mono text-muted-foreground hover:text-foreground transition-colors disabled:hover:text-muted-foreground"
          >
            {budgetLimit > 0
              ? `Budget: ${formatPHP(budgetLimit)}`
              : 'Set budget'
            }
          </button>
        )}
      </div>
    </div>
  );
}
