import { formatPHP } from '@/lib/utils/currency';
import type { MonthSummary } from '@/types/finance';

interface MonthColumnProps {
  summary: MonthSummary;
  isCurrent: boolean;
  onClick: () => void;
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function MonthColumn({ summary, isCurrent, onClick }: MonthColumnProps) {
  const monthIndex = parseInt(summary.month.split('-')[1], 10) - 1;
  const monthName = MONTH_ABBR[monthIndex];

  const totalIncome = summary.total_income + summary.total_oneoff;
  const totalExpenses = summary.total_expenses;
  const expenseRatio = totalIncome > 0 ? Math.min(Math.round((totalExpenses / totalIncome) * 100), 100) : 0;

  return (
    <button
      onClick={onClick}
      className={[
        'bg-card rounded-lg p-4 text-left hover:bg-foreground/5 transition-colors',
        isCurrent ? 'border-2 border-foreground' : 'border border-border',
      ].join(' ')}
    >
      <div className="text-sm font-mono font-semibold uppercase">{monthName}</div>
      <div className="text-lg font-mono tabular-nums mt-1">{formatPHP(summary.ending_balance)}</div>
      <div className="h-2 bg-muted rounded-full mt-3 overflow-hidden">
        <div
          className="h-full bg-foreground/40 rounded-full"
          style={{ width: `${expenseRatio}%` }}
        />
      </div>
    </button>
  );
}
