import { getCurrentMonth } from '@/lib/utils/month';
import type { MonthSummary } from '@/types/finance';

interface MonthColumnProps {
  summary: MonthSummary;
  isCurrent: boolean;
  onClick: () => void;
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function abbreviateAmount(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    return `${sign}P${(abs / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}P${Math.round(abs / 1_000)}K`;
  }
  return `${sign}P${Math.round(abs)}`;
}

export default function MonthColumn({ summary, isCurrent, onClick }: MonthColumnProps) {
  const monthIndex = parseInt(summary.month.split('-')[1], 10) - 1;
  const abbr = MONTH_ABBR[monthIndex];

  // Progress bar: income fill shows expenses consuming income
  const totalIncome = summary.total_income;
  const totalExpenses = summary.total_expenses;
  const totalOneoff = summary.total_oneoff;

  const expensePercent = totalIncome > 0 ? Math.min((totalExpenses / totalIncome) * 100, 100) : 0;
  const oneoffPercent = totalIncome > 0 ? Math.min((totalOneoff / totalIncome) * 100, 100 - expensePercent) : 0;

  return (
    <button
      onClick={onClick}
      className={[
        'flex flex-col items-center px-2 py-2 rounded transition-colors cursor-pointer',
        'hover:bg-card/80',
        isCurrent ? 'border border-foreground/30' : '',
      ].join(' ')}
    >
      {/* Month label */}
      <span className="text-[0.778rem] font-mono text-muted-foreground uppercase">
        {abbr}
      </span>

      {/* Ending balance */}
      <span className="text-[1.333rem] font-mono tabular-nums font-light">
        {abbreviateAmount(summary.ending_balance)}
      </span>

      {/* Vertical progress bar */}
      <div className="w-full h-32 bg-card rounded relative overflow-hidden mt-1">
        {/* Expense fill from bottom */}
        {expensePercent > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 bg-foreground/30 transition-all duration-300"
            style={{ height: `${expensePercent}%` }}
          />
        )}

        {/* One-off extension above expense fill */}
        {oneoffPercent > 0 && (
          <div
            className="absolute left-0 right-0 bg-foreground/15 transition-all duration-300"
            style={{
              bottom: `${expensePercent}%`,
              height: `${oneoffPercent}%`,
            }}
          />
        )}
      </div>
    </button>
  );
}
