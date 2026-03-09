import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { getLocalDateString } from '@/lib/utils/date';

export default function DayStrip({ completionMap = {}, selectedDate, onSelectDate, days = 28 }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const cells = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    const dateStr = getLocalDateString(d);
    const dayAbbr = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d);
    const dateNum = d.getDate();
    const completed = completionMap[dateStr] === true;
    cells.push({ date: dateStr, dayAbbr, dateNum, completed });
  }

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  // Scroll to today (rightmost) on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
    updateScrollState();
  }, []);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll ~3 cell widths (each cell is min-w-[4.5rem] = 81px at 18px base)
    el.scrollBy({ left: dir * 243, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {/* Left arrow + fade */}
      {canScrollLeft && (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 w-20 pointer-events-none z-10"
            style={{ background: 'linear-gradient(to right, var(--background) 20%, transparent 100%)' }}
          />
          <button
            aria-label="Previous days"
            onClick={() => scroll(-1)}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 text-muted-foreground/50 hover:text-foreground transition-colors p-1"
          >
            <ChevronLeft size={16} />
          </button>
        </>
      )}

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-0 snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onScroll={updateScrollState}
      >
        {cells.map(({ date, dayAbbr, dateNum, completed }) => {
          const isSelected = selectedDate === date;
          return (
            <button
              key={date}
              data-testid="day-cell"
              aria-label={date}
              aria-pressed={isSelected}
              data-completed={completed ? 'true' : 'false'}
              onClick={() => onSelectDate?.(date)}
              className={[
                'snap-start shrink-0 flex flex-col items-center gap-2 px-4 py-5 min-w-[4.5rem] font-mono transition-all',
                isSelected
                  ? 'text-foreground border-b-2 border-foreground'
                  : 'text-muted-foreground/40 hover:text-muted-foreground/70 border-b-2 border-transparent',
              ].join(' ')}
            >
              <span className="text-xs uppercase tracking-widest">{dayAbbr}</span>
              <span className="text-3xl tabular-nums font-light">{dateNum}</span>
              <span className="h-4 flex items-center justify-center">
                {completed && (
                  <Check
                    size={13}
                    aria-hidden="true"
                    className={isSelected ? 'text-foreground' : 'text-muted-foreground/40'}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right arrow + fade */}
      {canScrollRight && (
        <>
          <div
            className="absolute right-0 top-0 bottom-0 w-20 pointer-events-none z-10"
            style={{ background: 'linear-gradient(to left, var(--background) 20%, transparent 100%)' }}
          />
          <button
            aria-label="Next days"
            onClick={() => scroll(1)}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 text-muted-foreground/50 hover:text-foreground transition-colors p-1"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}
    </div>
  );
}
