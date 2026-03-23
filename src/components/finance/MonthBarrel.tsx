import { type ReactNode, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getPrevMonth, getNextMonth, getMonthYear } from '@/lib/utils/month';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface MonthBarrelProps {
  selected: string;
  onSelect: (month: string) => void;
  children?: ReactNode;
}

export default function MonthBarrel({ selected, onSelect, children }: MonthBarrelProps) {
  const [animating, setAnimating] = useState(false);

  const prev = getPrevMonth(selected);
  const next = getNextMonth(selected);

  const { year: prevYear, month: prevMonth } = getMonthYear(prev);
  const { year: currYear, month: currMonth } = getMonthYear(selected);
  const { year: nextYear, month: nextMonth } = getMonthYear(next);

  const prevLabel = prevYear !== currYear
    ? `${MONTH_NAMES[prevMonth - 1]} ${prevYear}`
    : MONTH_NAMES[prevMonth - 1];
  const nextLabel = nextYear !== currYear
    ? `${MONTH_NAMES[nextMonth - 1]} ${nextYear}`
    : MONTH_NAMES[nextMonth - 1];
  const currentMonthName = MONTH_NAMES[currMonth - 1];

  const goPrev = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      onSelect(prev);
      setAnimating(false);
    }, 150);
  }, [animating, prev, onSelect]);

  const goNext = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      onSelect(next);
      setAnimating(false);
    }, 150);
  }, [animating, next, onSelect]);

  return (
    <div className="flex flex-col h-full select-none">
      {/* Month navigation header — horizontal prev/current/next */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
        <button
          type="button"
          onClick={goPrev}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] justify-center"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
          <span className="text-xs font-mono hidden sm:inline">{prevLabel}</span>
        </button>

        <div className="text-center">
          <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight">{currentMonthName}</div>
          {(prevYear !== currYear || nextYear !== currYear) && (
            <div className="text-xs text-muted-foreground font-mono">{currYear}</div>
          )}
        </div>

        <button
          type="button"
          onClick={goNext}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] justify-center"
          aria-label="Next month"
        >
          <span className="text-xs font-mono hidden sm:inline">{nextLabel}</span>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Content — scrollable */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto">
        <div className="w-full px-4 py-4 max-w-[1000px] mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
