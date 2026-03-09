export default function DayDetail({ date, wins = [], loading = false }) {
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
        <p className="font-mono text-xs text-muted-foreground mb-2">{date}</p>
        <p className="font-mono text-sm text-muted-foreground">No wins for this day</p>
      </div>
    )
  }

  return (
    <div>
      <p className="font-mono text-xs text-muted-foreground mb-2">{date}</p>
      <div className="space-y-2">
        {wins.map(win => {
          const completed = win.check_ins?.[0]?.completed
          return (
            <div key={win.id} className="flex items-start justify-between gap-2 py-2 border-b border-border">
              <span className="font-mono text-sm">{win.title}</span>
              <span className={[
                'font-mono text-xs border px-1.5 py-0.5 rounded shrink-0',
                completed
                  ? 'border-foreground text-foreground'
                  : 'border-border text-muted-foreground',
              ].join(' ')}>
                {completed ? 'Completed' : 'Incomplete'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
