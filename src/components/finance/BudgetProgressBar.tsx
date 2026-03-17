import { useState } from 'react';
import { formatPHP } from '@/lib/utils/currency';

interface BudgetProgressBarProps {
  paidTotal: number;
  unpaidTotal: number;
  budgetLimit: number;
  totalIncome: number;
}

export default function BudgetProgressBar({
  paidTotal,
  unpaidTotal,
  budgetLimit,
  totalIncome,
}: BudgetProgressBarProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // Avoid division by zero
  const base = totalIncome > 0 ? totalIncome : 1;
  const paidPct = Math.min((paidTotal / base) * 100, 100);
  const unpaidPct = Math.min((unpaidTotal / base) * 100, 100 - paidPct);
  const budgetPct = Math.min((budgetLimit / base) * 100, 100);

  return (
    <div className="space-y-2">
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

        {/* Zone 3: Unpaid projected (lighter, after paid) */}
        <div
          className="absolute inset-y-0 bg-foreground/15 transition-all duration-300"
          style={{ left: `${paidPct}%`, width: `${unpaidPct}%` }}
          onMouseEnter={() => setHoveredZone('unpaid')}
          onMouseLeave={() => setHoveredZone(null)}
        />

        {/* Zone 2: Budget limit marker (dashed line) */}
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
        {budgetLimit > 0 && <span>Limit {formatPHP(budgetLimit)}</span>}
      </div>
    </div>
  );
}
