import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, ChevronUp } from 'lucide-react'

function TimelineItem({ win, isLast }) {
  const completed = win.check_ins?.[0]?.completed
  const note = win.check_ins?.[0]?.note
  const [expanded, setExpanded] = useState(false)

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
            {!completed && note && (
              <button
                onClick={() => setExpanded(v => !v)}
                aria-label={expanded ? 'Hide reason' : 'Show reason'}
                className="text-muted-foreground hover:text-foreground transition-colors active:opacity-70 transition-opacity duration-75"
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>
        </div>
        <AnimatePresence>
          {!completed && note && expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{ overflow: 'hidden' }}
            >
              <p className="font-mono text-xs text-muted-foreground mt-2 leading-relaxed">
                {note}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

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
      <p className="font-mono text-xs text-muted-foreground mb-3">{date}</p>
      {/* Vertical connecting line behind the dots */}
      <div className="border-l border-border ml-[7px]">
        {wins.map((win, index) => (
          <TimelineItem key={win.id} win={win} isLast={index === wins.length - 1} />
        ))}
      </div>
    </div>
  )
}
