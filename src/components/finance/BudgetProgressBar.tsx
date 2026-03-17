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

  // Calculate widths relative to budget limit (not income)
  const base = budgetLimit > 0 ? budgetLimit : 1;
  const paidPct = budgetLimit > 0 ? Math.min((paidTotal / base) * 100, 100) : 0;
  const unpaidPct = budgetLimit > 0 ? Math.min((unpaidTotal / base) * 100, 100 - paidPct) : 0;
  const overBudget = paidTotal + unpaidTotal > budgetLimit && budgetLimit > 0;

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

  // readOnly with no budget: show only a static message, no bar at all
  if (readOnly && budgetLimit <= 0) {
    return (
      <div className="w-full text-center py-4">
        <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-mono">
          No budget set
        </span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <h3 className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-mono">
        Budget
      </h3>

      {/* Bar container — h-12 = 48px, full width */}
      <div className="relative w-full h-12 rounded-md bg-muted overflow-hidden">
        {/* Zone 1: Paid bills */}
        <div
          className="absolute inset-y-0 left-0 bg-foreground/40 transition-all duration-300 rounded-l-md"
          style={{ width: `${paidPct}%` }}
          onMouseEnter={() => !readOnly && setHoveredZone('paid')}
          onMouseLeave={() => setHoveredZone(null)}
        />

        {/* Zone 2: Unpaid projected */}
        <div
          className="absolute inset-y-0 bg-foreground/15 transition-all duration-300"
          style={{ left: `${paidPct}%`, width: `${unpaidPct}%` }}
          onMouseEnter={() => !readOnly && setHoveredZone('unpaid')}
          onMouseLeave={() => setHoveredZone(null)}
        />

        {/* Over-budget indicator */}
        {overBudget && (
          <div className="absolute inset-0 border-2 border-destructive/60 rounded-md pointer-events-none" />
        )}

        {/* Tooltip */}
        {hoveredZone && !readOnly && (
          <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-mono px-2 py-1 rounded whitespace-nowrap z-10">
            {hoveredZone === 'paid' && `Paid: ${formatPHP(paidTotal)}`}
            {hoveredZone === 'unpaid' && `Unpaid: ${formatPHP(unpaidTotal)}`}
          </div>
        )}
      </div>

      {/* Labels below bar — left / center / right */}
      <div className="flex justify-between">
        <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-mono">
          Paid {formatPHP(paidTotal)}
        </span>
        <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-mono">
          Budget {formatPHP(budgetLimit)}
        </span>
        <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-mono">
          Unpaid {formatPHP(unpaidTotal)}
        </span>
      </div>

      {/* Editable budget limit — only show when not readOnly */}
      {!readOnly && (
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
              disabled={!onUpdateBudgetLimit}
              className="text-xs uppercase tracking-[0.15em] font-mono text-muted-foreground hover:text-foreground transition-colors disabled:hover:text-muted-foreground"
            >
              {budgetLimit > 0
                ? 'Edit budget'
                : 'Set budget'
              }
            </button>
          )}
        </div>
      )}
    </div>
  );
}
