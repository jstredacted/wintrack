import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthYear } from '@/lib/utils/month';

interface MonthStripProps {
  months: string[];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
}

const MONTH_ABBR = new Intl.DateTimeFormat('en-US', { month: 'short' });

export default function MonthStrip({ months, selectedMonth, onSelectMonth }: MonthStripProps) {
  const idx = months.indexOf(selectedMonth);

  const goPrev = () => {
    if (idx > 0) onSelectMonth(months[idx - 1]);
  };

  const goNext = () => {
    if (idx < months.length - 1) onSelectMonth(months[idx + 1]);
  };

  // Show previous, current, next
  const visibleIndices: number[] = [];
  if (idx > 0) visibleIndices.push(idx - 1);
  visibleIndices.push(idx);
  if (idx < months.length - 1) visibleIndices.push(idx + 1);

  const cells = visibleIndices.map((i) => {
    const m = months[i];
    const { year, month } = getMonthYear(m);
    const date = new Date(year, month - 1, 1);
    const abbr = MONTH_ABBR.format(date).toUpperCase();
    return { month: m, abbr, year, isSelected: i === idx };
  });

  const canGoPrev = idx > 0;
  const canGoNext = idx < months.length - 1;

  return (
    <div className="relative flex items-center justify-center py-2">
      {/* Left fade gradient */}
      <div
        className="absolute left-0 top-0 bottom-0 w-16 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to right, var(--background) 20%, transparent 100%)' }}
      />

      {/* Left arrow */}
      <button
        aria-label="Previous month"
        onClick={goPrev}
        disabled={!canGoPrev}
        className={[
          'z-20 p-2 transition-colors',
          canGoPrev
            ? 'text-foreground hover:text-foreground/80'
            : 'text-muted-foreground/20 cursor-default',
        ].join(' ')}
      >
        <ChevronLeft size={20} />
      </button>

      {/* Visible months */}
      <div className="flex items-center gap-0">
        {cells.map(({ month, abbr, year, isSelected }) => (
          <button
            key={month}
            aria-label={`${abbr} ${year}`}
            aria-pressed={isSelected}
            onClick={() => onSelectMonth(month)}
            className={[
              'flex flex-col items-center gap-1 px-4 py-3 min-w-[5rem] font-mono transition-all active:scale-[0.94]',
              isSelected
                ? 'text-foreground border-b-2 border-foreground'
                : 'text-muted-foreground/40 hover:text-muted-foreground/70 border-b-2 border-transparent',
            ].join(' ')}
          >
            <span className="text-xs uppercase tracking-widest text-muted-foreground">{year}</span>
            <span className="text-3xl tabular-nums font-light">{abbr}</span>
          </button>
        ))}
      </div>

      {/* Right arrow */}
      <button
        aria-label="Next month"
        onClick={goNext}
        disabled={!canGoNext}
        className={[
          'z-20 p-2 transition-colors',
          canGoNext
            ? 'text-foreground hover:text-foreground/80'
            : 'text-muted-foreground/20 cursor-default',
        ].join(' ')}
      >
        <ChevronRight size={20} />
      </button>

      {/* Right fade gradient */}
      <div
        className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to left, var(--background) 20%, transparent 100%)' }}
      />
    </div>
  );
}
