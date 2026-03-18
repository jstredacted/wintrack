import { useState } from 'react';
import { formatPHP } from '@/lib/utils/currency';
import type { MonthSummary } from '@/types/finance';

interface MonthColumnProps {
  summary: MonthSummary;
  isCurrent: boolean;
  onClick: () => void;
}

const MONTH_ABBR = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function abbreviateBalance(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `\u20B1${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000) return `\u20B1${(amount / 1_000).toFixed(0)}K`;
  return `\u20B1${amount.toFixed(0)}`;
}

export default function MonthColumn({ summary, isCurrent, onClick }: MonthColumnProps) {
  const [hovered, setHovered] = useState(false);
  const monthIndex = parseInt(summary.month.split('-')[1], 10) - 1;
  const monthName = MONTH_ABBR[monthIndex];

  const totalIncome = Number(summary.total_income) + Number(summary.total_oneoff);
  const totalExpenses = Number(summary.total_expenses);
  const endingBalance = Number(summary.ending_balance);

  // Only show balance for months with actual activity
  const hasActivity = totalIncome > 0 || totalExpenses > 0;
  const displayBalance = hasActivity ? endingBalance : 0;

  // Calculate fill percentages relative to income
  const expenseRatio = totalIncome > 0 ? Math.min(totalExpenses / totalIncome, 1) : 0;
  const oneoffRatio = totalIncome > 0 ? Math.min(Number(summary.total_oneoff) / totalIncome, 1 - expenseRatio) : 0;

  // Dim months with no activity
  const isEmpty = !hasActivity && endingBalance === 0;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={[
        'relative flex flex-col items-center h-64 rounded-md transition-all',
        isCurrent ? 'border border-foreground/50' : 'border border-transparent',
        isEmpty ? 'opacity-40' : !hasActivity ? 'opacity-40' : '',
        hovered ? 'ring-1 ring-foreground/40' : '',
      ].join(' ')}
    >
      {/* Month abbreviation at top */}
      <div className="text-xs font-mono font-semibold tracking-wider pt-2 pb-1 shrink-0">
        {monthName}
      </div>

      {/* Bar area — fills remaining vertical space */}
      <div className="flex-1 w-full px-1 pb-1 flex flex-col justify-end">
        <div className="relative w-full rounded-sm overflow-hidden" style={{ height: '100%' }}>
          {/* Background (surplus / empty) */}
          <div className="absolute inset-0 bg-muted/30" />

          {/* One-off fill above expenses */}
          {oneoffRatio > 0 && (
            <div
              className="absolute bottom-0 left-0 right-0 bg-foreground/15 transition-all duration-300"
              style={{ height: `${(expenseRatio + oneoffRatio) * 100}%` }}
            />
          )}

          {/* Expense fill from bottom */}
          {expenseRatio > 0 && (
            <div
              className="absolute bottom-0 left-0 right-0 bg-foreground/30 transition-all duration-300"
              style={{ height: `${expenseRatio * 100}%` }}
            />
          )}
        </div>
      </div>

      {/* Journal count — shown above balance when present */}
      {summary.journal_count > 0 && (
        <div
          className="text-[0.6rem] font-mono tabular-nums text-muted-foreground/60 shrink-0 w-full text-center"
          title="Journal entries"
        >
          {summary.journal_count}
        </div>
      )}

      {/* Balance at bottom — abbreviated to prevent overlap */}
      <div className="text-xs font-mono tabular-nums text-muted-foreground pb-1.5 shrink-0 w-full text-center px-0.5">
        {hasActivity ? abbreviateBalance(displayBalance) : '\u2014'}
      </div>

      {/* Hover tooltip */}
      {hovered && hasActivity && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-foreground text-background text-[0.6rem] font-mono px-2 py-1.5 rounded whitespace-nowrap z-20 shadow-lg">
          <div>{formatPHP(totalIncome)} in</div>
          <div>{formatPHP(totalExpenses)} out</div>
          <div className="border-t border-background/20 mt-0.5 pt-0.5">{formatPHP(displayBalance)}</div>
        </div>
      )}
    </button>
  );
}
