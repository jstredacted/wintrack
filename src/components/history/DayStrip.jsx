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
      className="flex overflow-x-auto gap-2 pb-2 snap-x snap-mandatory scroll-smooth day-strip"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {cells.map(({ date, dayAbbr, dateNum, completed }) => (
        <button
          key={date}
          aria-label={date}
          data-completed={completed ? 'true' : 'false'}
          onClick={() => onSelectDate?.(date)}
          className={[
            'snap-start shrink-0 flex flex-col items-center gap-1 p-2 min-w-[3rem] rounded font-mono',
            'text-muted-foreground hover:text-foreground transition-colors',
            selectedDate === date ? 'ring-1 ring-foreground text-foreground' : '',
          ].join(' ')}
        >
          <span className="text-[0.6rem] uppercase tracking-wide">{dayAbbr}</span>
          <span className="text-sm tabular-nums">{dateNum}</span>
          {completed && <Check size={18} aria-hidden="true" />}
        </button>
      ))}
    </div>
  );
}
