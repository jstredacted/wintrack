interface HistoryWin {
  id: string;
  title: string;
  category: string;
  completed: boolean;
}

interface TimelineItemProps {
  win: HistoryWin;
  isLast: boolean;
}

function TimelineItem({ win, isLast }: TimelineItemProps) {
  const completed = win.completed

  return (
    <div className={['relative pl-8', isLast ? 'pb-0' : 'pb-6'].join(' ')}>
      {/* Dot on the vertical line */}
      <div
        className={[
          'absolute top-1.5 w-3 h-3 rounded-full border-2',
          completed
            ? 'bg-foreground border-foreground'
            : 'bg-background border-border',
        ].join(' ')}
        style={{ left: '7px', transform: 'translateX(-50%)' }}
        aria-hidden="true"
      />

      {/* Card content */}
      <div className={[
        'border-l-2 pl-4 py-1',
        completed ? 'border-foreground' : 'border-border/40',
      ].join(' ')}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <span className={[
              'font-mono text-sm block',
              completed ? 'line-through text-muted-foreground' : 'text-foreground',
            ].join(' ')}>
              {win.title}
            </span>
            {/* Category badge — suppressed for default 'work' category */}
            {win.category && win.category !== 'work' && (
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground border border-border px-1.5 py-0.5 mt-1 inline-block self-start">
                {win.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={[
              'font-mono text-xs border px-1.5 py-0.5 rounded',
              completed
                ? 'border-foreground text-foreground'
                : 'border-border text-muted-foreground',
            ].join(' ')}>
              {completed ? 'Completed' : 'Incomplete'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface DayDetailProps {
  date: string;
  wins?: HistoryWin[];
  loading?: boolean;
}

export default function DayDetail({ date, wins = [], loading = false }: DayDetailProps) {
  if (loading) {
    return (
      <div data-testid="loading" aria-busy="true" className="font-mono text-sm text-muted-foreground">
        Loading...
      </div>
    )
  }

  if (!wins || wins.length === 0) {
    return (
      <div>
        <p className="font-mono text-sm text-muted-foreground">No wins for this day</p>
      </div>
    )
  }

  return (
    <div>
      {/* Vertical connecting line behind the dots */}
      <div className="border-l border-border ml-[7px]">
        {wins.map((win, index) => (
          <TimelineItem key={win.id} win={win} isLast={index === wins.length - 1} />
        ))}
      </div>
    </div>
  )
}
