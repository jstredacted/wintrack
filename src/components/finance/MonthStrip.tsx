import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthYear } from '@/lib/utils/month';

interface MonthStripProps {
  months: string[];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
}

const MONTH_ABBR = new Intl.DateTimeFormat('en-US', { month: 'short' });

export default function MonthStrip({ months, selectedMonth, onSelectMonth }: MonthStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  // Scroll to selected month on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = months.indexOf(selectedMonth);
    if (idx === -1) return;
    // Each cell is min-w-[5rem] = 80px at 18px base
    const cellWidth = 80;
    const scrollTarget = idx * cellWidth - el.clientWidth / 2 + cellWidth / 2;
    el.scrollLeft = Math.max(0, scrollTarget);
    requestAnimationFrame(updateScrollState);
  }, [months, selectedMonth]);

  const scroll = (dir: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 240, behavior: 'smooth' });
  };

  const cells = months.map((m) => {
    const { year, month } = getMonthYear(m);
    const date = new Date(year, month - 1, 1);
    const abbr = MONTH_ABBR.format(date).toUpperCase();
    return { month: m, abbr, year };
  });

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
            aria-label="Previous months"
            onClick={() => scroll(-1)}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 text-muted-foreground/50 hover:text-foreground transition-colors active:opacity-70 transition-opacity duration-75 p-1"
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
        {cells.map(({ month, abbr, year }) => {
          const isSelected = selectedMonth === month;
          return (
            <button
              key={month}
              aria-label={`${abbr} ${year}`}
              aria-pressed={isSelected}
              onClick={() => onSelectMonth(month)}
              className={[
                'snap-start shrink-0 flex flex-col items-center gap-1 px-3 py-4 min-w-[5rem] font-mono transition-all active:scale-[0.94]',
                isSelected
                  ? 'text-foreground border-b-2 border-foreground'
                  : 'text-muted-foreground/40 hover:text-muted-foreground/70 border-b-2 border-transparent',
              ].join(' ')}
            >
              <span className="text-xs uppercase tracking-widest">{abbr}</span>
              <span className="text-3xl tabular-nums font-light">{year}</span>
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
            aria-label="Next months"
            onClick={() => scroll(1)}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 text-muted-foreground/50 hover:text-foreground transition-colors active:opacity-70 transition-opacity duration-75 p-1"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}
    </div>
  );
}
