import { type ReactNode, useState, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
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
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

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

  const canGoPrev = true;
  const canGoNext = true;

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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null || touchStartX.current === null) return;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    touchStartY.current = null;
    touchStartX.current = null;
    if (Math.abs(deltaY) < 40 || Math.abs(deltaX) > Math.abs(deltaY)) return;
    if (deltaY > 0) goNext();
    else goPrev();
  };

  return (
    <div
      className="flex flex-col h-full select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* PREVIOUS month at the very TOP */}
      <button
        type="button"
        onClick={goPrev}
        disabled={!canGoPrev}
        className="py-3 flex flex-col items-center opacity-30 hover:opacity-50 transition-opacity"
        aria-label="Previous month"
      >
        <ChevronUp size={16} className="text-muted-foreground mb-1" />
        <span className="text-lg font-mono text-muted-foreground">{prevLabel}</span>
      </button>

      {/* Gradient fade from top */}
      <div className="h-6 bg-gradient-to-b from-background to-transparent" />

      {/* CURRENT MONTH — centered in the middle, takes flex-1 */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0">
        <div className="text-center">
          <div className="text-4xl font-bold font-mono tracking-tight">{currentMonthName}</div>
          {/* Only show year when adjacent months span different years */}
          {(prevYear !== currYear || nextYear !== currYear) && (
            <div className="text-sm text-muted-foreground font-mono mt-1">{currYear}</div>
          )}
        </div>

        {/* Children content goes here */}
        {children}
      </div>

      {/* Gradient fade from bottom */}
      <div className="h-6 bg-gradient-to-t from-background to-transparent" />

      {/* NEXT month at the very BOTTOM */}
      <button
        type="button"
        onClick={goNext}
        disabled={!canGoNext}
        className="py-3 flex flex-col items-center opacity-30 hover:opacity-50 transition-opacity"
        aria-label="Next month"
      >
        <span className="text-lg font-mono text-muted-foreground">{nextLabel}</span>
        <ChevronDown size={16} className="text-muted-foreground mt-1" />
      </button>
    </div>
  );
}
