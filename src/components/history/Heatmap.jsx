import { getLocalDateString } from '@/lib/utils/date'

export default function Heatmap({ completionMap = {}, selectedDate, onSelectDate, days = 84 }) {
  const cells = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000)
    const dateStr = getLocalDateString(d)
    cells.push({ date: dateStr, completed: completionMap[dateStr] === true })
  }

  return (
    <div
      className="grid gap-0.5"
      style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}
    >
      {cells.map(({ date, completed }) => (
        <button
          key={date}
          data-testid="heatmap-cell"
          title={date}
          onClick={() => onSelectDate?.(date)}
          className={[
            'aspect-square rounded-[1px] cursor-pointer',
            completed ? 'bg-foreground' : 'bg-border',
            selectedDate === date ? 'ring-1 ring-foreground ring-offset-1 ring-offset-background' : '',
          ].join(' ')}
        />
      ))}
    </div>
  )
}
