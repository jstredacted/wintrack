import { useState } from 'react';
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

interface TooltipData {
  x: number;
  y: number;
  label: string;
}

export default function MonthColumn({ summary, isCurrent, onClick }: MonthColumnProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<'expense' | 'oneoff' | null>(null);
  const monthIndex = parseInt(summary.month.split('-')[1], 10) - 1;
  const abbr = MONTH_ABBR[monthIndex];

  // Progress bar: income fill shows expenses consuming income
  const totalIncome = summary.total_income;
  const totalExpenses = summary.total_expenses;
  const totalOneoff = summary.total_oneoff;

  const expensePercent = totalIncome > 0 ? Math.min((totalExpenses / totalIncome) * 100, 100) : 0;
  const oneoffPercent = totalIncome > 0 ? Math.min((totalOneoff / totalIncome) * 100, 100 - expensePercent) : 0;

  const handleSegmentEnter = (e: React.MouseEvent, label: string, segment: 'expense' | 'oneoff') => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      label,
    });
    setHoveredSegment(segment);
  };

  const handleSegmentLeave = () => {
    setTooltip(null);
    setHoveredSegment(null);
  };

  return (
    <button
      onClick={onClick}
      className={[
        'relative flex flex-col items-center px-2 py-2 rounded transition-colors cursor-pointer',
        'hover:bg-card/80',
        isCurrent ? 'border-2 border-foreground/30' : '',
      ].join(' ')}
    >
      {/* Month label */}
      <span className="text-[0.778rem] font-mono text-muted-foreground uppercase">
        {abbr}
      </span>

      {/* Vertical progress bar */}
      <div className="w-full h-40 bg-card rounded relative overflow-hidden mt-1">
        {/* Expense fill from bottom */}
        {expensePercent > 0 && (
          <div
            className={[
              'absolute bottom-0 left-0 right-0 bg-foreground/30 transition-all duration-300',
              hoveredSegment === 'expense' ? 'ring-1 ring-white/90 z-10' : '',
            ].join(' ')}
            style={{ height: `${expensePercent}%` }}
            onMouseEnter={(e) => handleSegmentEnter(e, `Expenses: ${abbreviateAmount(totalExpenses)}`, 'expense')}
            onMouseLeave={handleSegmentLeave}
          >
            {hoveredSegment === 'expense' && (
              <div className="absolute inset-0 bg-white/15" />
            )}
          </div>
        )}

        {/* One-off extension above expense fill — striped pattern to distinguish from regular */}
        {oneoffPercent > 0 && (
          <div
            className={[
              'absolute left-0 right-0 transition-all duration-300',
              hoveredSegment === 'oneoff' ? 'ring-1 ring-white/90 z-10' : '',
            ].join(' ')}
            style={{
              bottom: `${expensePercent}%`,
              height: `${oneoffPercent}%`,
              backgroundImage:
                'repeating-linear-gradient(135deg, transparent, transparent 3px, hsl(var(--foreground) / 0.15) 3px, hsl(var(--foreground) / 0.15) 6px)',
              backgroundColor: 'hsl(var(--foreground) / 0.08)',
            }}
            onMouseEnter={(e) => handleSegmentEnter(e, `One-off: ${abbreviateAmount(totalOneoff)}`, 'oneoff')}
            onMouseLeave={handleSegmentLeave}
          >
            {hoveredSegment === 'oneoff' && (
              <div className="absolute inset-0 bg-white/15" />
            )}
          </div>
        )}
      </div>

      {/* Ending balance below bar */}
      <span className="text-[0.778rem] font-mono tabular-nums font-light mt-1 text-muted-foreground">
        {abbreviateAmount(summary.ending_balance)}
      </span>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-foreground text-background text-[0.667rem] font-mono px-2 py-1 rounded whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {tooltip.label}
        </div>
      )}
    </button>
  );
}
