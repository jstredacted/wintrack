import { Check } from 'lucide-react';
import { getLocalDateString } from '@/lib/utils/date';

export default function DayStrip({ completionMap = {}, selectedDate, onSelectDate, days = 28 }) {
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
      className="flex overflow-x-auto gap-0 snap-x snap-mandatory scroll-smooth"
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
  );
}
