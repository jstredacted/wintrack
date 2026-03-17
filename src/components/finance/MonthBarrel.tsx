import { useState, useRef, useCallback, type ReactNode } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { getPrevMonth, getNextMonth, getMonthYear } from '@/lib/utils/month';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface MonthBarrelProps {
  selected: string;
  onSelect: (month: string) => void;
  children: ReactNode;
}

export default function MonthBarrel({ selected, onSelect, children }: MonthBarrelProps) {
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);
  const [animating, setAnimating] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const prev = getPrevMonth(selected);
  const next = getNextMonth(selected);

  const { year: prevYear, month: prevMonth } = getMonthYear(prev);
  const { year: currYear, month: currMonth } = getMonthYear(selected);
  const { year: nextYear, month: nextMonth } = getMonthYear(next);

  const goUp = useCallback(() => {
    if (animating) return;
    setDirection('up');
    setAnimating(true);
    onSelect(prev);
  }, [animating, prev, onSelect]);

  const goDown = useCallback(() => {
    if (animating) return;
    setDirection('down');
    setAnimating(true);
    onSelect(next);
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
    // Only vertical swipe if Y delta dominates X delta
    if (Math.abs(deltaY) < 40 || Math.abs(deltaX) > Math.abs(deltaY)) return;
    if (deltaY > 0) goDown();
    else goUp();
  };

  return (
    <div
      className="flex flex-col h-full select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top: Previous month button */}
      <button
        type="button"
        onClick={goUp}
        className="flex items-center justify-center gap-2 py-3 text-muted-foreground hover:text-foreground transition-colors shrink-0"
        aria-label="Previous month"
      >
        <ChevronUp size={20} />
        <span className="text-[0.667rem] font-mono">
          {MONTH_NAMES[prevMonth - 1]} {prevYear}
        </span>
      </button>

      {/* Middle: Current month content */}
      <div className="flex-1 overflow-hidden" style={{ perspective: '600px' }}>
        <div
          key={selected}
          className={`h-full flex flex-col ${
            animating
              ? direction === 'up'
                ? 'barrel-content-down'
                : 'barrel-content-up'
              : ''
          }`}
          onAnimationEnd={() => setAnimating(false)}
        >
          {/* Month heading */}
          <h1 className="text-center font-mono text-[1.667rem] font-light text-foreground pt-2 pb-1 shrink-0">
            {MONTH_NAMES[currMonth - 1]}
          </h1>
          <p className="text-center font-mono text-[0.778rem] text-muted-foreground pb-4 shrink-0">
            {currYear}
          </p>

          {/* Content (children) */}
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </div>

      {/* Bottom: Next month button */}
      <button
        type="button"
        onClick={goDown}
        className="flex items-center justify-center gap-2 py-3 text-muted-foreground hover:text-foreground transition-colors shrink-0"
        aria-label="Next month"
      >
        <span className="text-[0.667rem] font-mono">
          {MONTH_NAMES[nextMonth - 1]} {nextYear}
        </span>
        <ChevronDown size={20} />
      </button>
    </div>
  );
}
