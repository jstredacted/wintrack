import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, ChevronUp } from 'lucide-react'

function WinRow({ win }) {
  const completed = win.check_ins?.[0]?.completed
  const note = win.check_ins?.[0]?.note
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border-b border-border py-3">
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-sm">{win.title}</span>
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
      <div>
        {wins.map(win => (
          <WinRow key={win.id} win={win} />
        ))}
      </div>
    </div>
  )
}
