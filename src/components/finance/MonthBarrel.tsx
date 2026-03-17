import { useState, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
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
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);
  const [animating, setAnimating] = useState(false);
  const touchStartY = useRef<number | null>(null);

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
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    touchStartY.current = null;
    if (Math.abs(delta) < 30) return;
    if (delta > 0) goDown();
    else goUp();
  };

  return (
    <div
      className="flex flex-col items-center py-6 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Up chevron */}
      <button
        type="button"
        onClick={goUp}
        className="text-muted-foreground hover:text-foreground transition-colors p-1"
        aria-label="Previous month"
      >
        <ChevronUp size={20} />
      </button>

      {/* Barrel container */}
      <div
        className="relative h-[120px] w-full max-w-[300px] overflow-hidden"
        style={{ perspective: '600px' }}
      >
        {/* Previous month (recessed above) */}
        <div
          key={`prev-${prev}`}
          className={`absolute inset-x-0 top-0 flex flex-col items-center justify-center h-[40px] transition-all duration-300 ease-out ${
            animating && direction === 'up' ? 'barrel-slide-down' : ''
          }`}
          style={{
            transform: 'rotateX(30deg) scale(0.85)',
            opacity: 0.4,
            transformOrigin: 'center bottom',
          }}
        >
          <span className="font-mono text-base text-muted-foreground">
            {MONTH_NAMES[prevMonth - 1]}
          </span>
          <span className="font-mono text-[0.667rem] text-muted-foreground/60">
            {prevYear}
          </span>
        </div>

        {/* Current month (centered, full) */}
        <div
          key={`curr-${selected}`}
          className={`absolute inset-x-0 top-[40px] flex flex-col items-center justify-center h-[40px] transition-all duration-300 ease-out ${
            animating ? (direction === 'up' ? 'barrel-slide-down' : 'barrel-slide-up') : ''
          }`}
          onTransitionEnd={() => setAnimating(false)}
          onAnimationEnd={() => setAnimating(false)}
        >
          <span className="font-mono text-[1.667rem] font-light text-foreground">
            {MONTH_NAMES[currMonth - 1]}
          </span>
          <span className="font-mono text-[0.778rem] text-muted-foreground">
            {currYear}
          </span>
        </div>

        {/* Next month (recessed below) */}
        <div
          key={`next-${next}`}
          className={`absolute inset-x-0 bottom-0 flex flex-col items-center justify-center h-[40px] transition-all duration-300 ease-out ${
            animating && direction === 'down' ? 'barrel-slide-up' : ''
          }`}
          style={{
            transform: 'rotateX(-30deg) scale(0.85)',
            opacity: 0.4,
            transformOrigin: 'center top',
          }}
        >
          <span className="font-mono text-base text-muted-foreground">
            {MONTH_NAMES[nextMonth - 1]}
          </span>
          <span className="font-mono text-[0.667rem] text-muted-foreground/60">
            {nextYear}
          </span>
        </div>
      </div>

      {/* Down chevron */}
      <button
        type="button"
        onClick={goDown}
        className="text-muted-foreground hover:text-foreground transition-colors p-1"
        aria-label="Next month"
      >
        <ChevronDown size={20} />
      </button>
    </div>
  );
}
