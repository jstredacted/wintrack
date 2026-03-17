import { getCurrentMonth } from '@/lib/utils/month';
import MonthColumn from './MonthColumn';
import type { MonthSummary } from '@/types/finance';

interface YearGridProps {
  months: MonthSummary[];
  onMonthClick: (month: string) => void;
}

export default function YearGrid({ months, onMonthClick }: YearGridProps) {
  const currentMonth = getCurrentMonth();

  return (
    <div className="grid grid-cols-12 gap-2 min-h-[400px]">
      {months.map((summary) => (
        <MonthColumn
          key={summary.month}
          summary={summary}
          isCurrent={summary.month === currentMonth}
          onClick={() => onMonthClick(summary.month)}
        />
      ))}
    </div>
  );
}
