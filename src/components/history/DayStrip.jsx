import { Check } from 'lucide-react';
import { getLocalDateString } from '@/lib/utils/date';

export default function DayStrip({
  completionMap = {},
  selectedDate,
  onSelectDate,
  days = 28,
}) {
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

  return (
    <div
      className="flex overflow-x-auto gap-1 py-2 snap-x snap-mandatory scroll-smooth"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {cells.map(({ date, dayAbbr, dateNum, completed }) => {
        const isSelected = selectedDate === date;
        return (
          <button
            key={date}
            aria-label={date}
            aria-pressed={isSelected}
            data-completed={completed ? 'true' : 'false'}
            onClick={() => onSelectDate?.(date)}
            className={[
              'snap-start shrink-0 flex flex-col items-center gap-1 px-3 py-2 min-w-[3.25rem] font-mono transition-colors',
              isSelected
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/70',
            ].join(' ')}
          >
            <span className="text-[0.6rem] uppercase tracking-wide">{dayAbbr}</span>
            <span className="text-sm tabular-nums">{dateNum}</span>
            {/* Status indicator row — always present to preserve alignment */}
            <span className="h-4 flex items-center justify-center">
              {completed
                ? <Check size={12} aria-hidden="true" className={isSelected ? 'text-foreground' : 'text-muted-foreground'} />
                : isSelected
                ? <span className="w-1 h-1 rounded-full bg-foreground" />
                : null
              }
            </span>
          </button>
        );
      })}
    </div>
  );
}
