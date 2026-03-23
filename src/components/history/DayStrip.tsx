import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { getLocalDateString } from '@/lib/utils/date';
import { useSettingsStore } from '@/stores/settingsStore';

interface DayStripProps {
  completionMap?: Record<string, unknown>;
  selectedDate: string;
  onSelectDate?: (date: string) => void;
  days?: number;
}

export default function DayStrip({ completionMap = {}, selectedDate, onSelectDate, days = 28 }: DayStripProps) {
  const dayStartHour = useSettingsStore(s => s.settings.dayStartHour);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const cells = [];
  // Compute logical today using dayStartHour offset, then build cells backward from it.
  // This ensures dateStr, dayAbbr, and dateNum all agree on the same offset-aware date.
  const logicalToday = getLocalDateString(new Date(), dayStartHour);
  const [ly, lm, ld] = logicalToday.split('-').map(Number);
  for (let i = days - 1; i >= 0; i--) {
    const base = new Date(ly, lm - 1, ld);
    base.setDate(base.getDate() - i);
    const dateStr = new Intl.DateTimeFormat('en-CA').format(base);
    const dayAbbr = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(base);
    const dateNum = base.getDate();
    const entry = completionMap[dateStr];
    const completed = entry === true || (typeof entry === 'object' && entry !== null && entry.completed > 0);
    cells.push({ date: dateStr, dayAbbr, dateNum, completed });
  }

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  // Scroll to center the selected day on mount and when selectedDate changes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const selectedCell = el.querySelector(`[data-date="${selectedDate}"]`) as HTMLElement;
    if (selectedCell) {
      const cellCenter = selectedCell.offsetLeft + selectedCell.offsetWidth / 2;
      el.scrollLeft = cellCenter - el.clientWidth / 2;
    } else {
      el.scrollLeft = el.scrollWidth; // fallback: scroll to end
    }
    requestAnimationFrame(updateScrollState);
  }, [selectedDate]);

  const scroll = (dir: number) => {
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
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 text-muted-foreground/50 hover:text-foreground transition-colors active:opacity-70 transition-opacity duration-75 p-1"
          >
            <ChevronLeft size={16} />
          </button>
        </>
      )}

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-0 snap-x snap-mandatory scroll-smooth px-4 sm:px-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onScroll={updateScrollState}
      >
        {cells.map(({ date, dayAbbr, dateNum, completed }) => {
          const isSelected = selectedDate === date;
          return (
            <button
              key={date}
              data-testid="day-cell"
              data-date={date}
              aria-label={date}
              aria-pressed={isSelected}
              data-completed={completed ? 'true' : 'false'}
              onClick={() => onSelectDate?.(date)}
              className={[
                'snap-start shrink-0 flex flex-col items-center gap-2 px-4 py-5 min-w-[4.5rem] font-mono transition-all active:scale-[0.94]',
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
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 text-muted-foreground/50 hover:text-foreground transition-colors active:opacity-70 transition-opacity duration-75 p-1"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}
    </div>
  );
}
