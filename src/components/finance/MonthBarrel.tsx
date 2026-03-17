import { useState, useRef, useCallback } from 'react';
import { getPrevMonth, getNextMonth, getMonthYear } from '@/lib/utils/month';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface MonthBarrelProps {
  selected: string;
  onSelect: (month: string) => void;
}

export default function MonthBarrel({ selected, onSelect }: MonthBarrelProps) {
  const [animating, setAnimating] = useState(false);
  const [offset, setOffset] = useState(0);
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

  const goPrev = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    setOffset(52); // slide down to reveal prev
    setTimeout(() => {
      onSelect(prev);
      setOffset(0);
      setAnimating(false);
    }, 300);
  }, [animating, prev, onSelect]);

  const goNext = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    setOffset(-52); // slide up to reveal next
    setTimeout(() => {
      onSelect(next);
      setOffset(0);
      setAnimating(false);
    }, 300);
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
      className="relative overflow-hidden h-[160px] shrink-0 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Gradient fade top */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />

      {/* Barrel content */}
      <div
        className="flex flex-col items-center justify-center h-full transition-transform duration-300"
        style={{ transform: `translateY(${offset}px)` }}
      >
        {/* Previous month */}
        <button
          type="button"
          onClick={goPrev}
          className="text-xl font-mono opacity-30 scale-90 py-2 hover:opacity-50 transition-opacity"
          aria-label="Previous month"
        >
          {prevLabel}
        </button>

        {/* Current month */}
        <div className="text-center py-2">
          <div className="text-4xl font-bold font-mono tracking-tight">{MONTH_NAMES[currMonth - 1]}</div>
          <div className="text-sm text-muted-foreground font-mono mt-1">{currYear}</div>
        </div>

        {/* Next month */}
        <button
          type="button"
          onClick={goNext}
          className="text-xl font-mono opacity-30 scale-90 py-2 hover:opacity-50 transition-opacity"
          aria-label="Next month"
        >
          {nextLabel}
        </button>
      </div>

      {/* Gradient fade bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
    </div>
  );
}
