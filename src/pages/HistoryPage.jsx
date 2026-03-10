import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useHistory } from '@/hooks/useHistory'
import { getLocalDateString } from '@/lib/utils/date'
import DayStrip from '@/components/history/DayStrip'
import DayDetail from '@/components/history/DayDetail'

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HistoryPage() {
  const { completionMap, loading, fetchWinsForDate } = useHistory()
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString(new Date()))
  const [selectedWins, setSelectedWins] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setDetailLoading(true)
    fetchWinsForDate(selectedDate).then(wins => {
      if (!cancelled) { setSelectedWins(wins); setDetailLoading(false) }
    })
    return () => { cancelled = true }
  }, [selectedDate, fetchWinsForDate])

  if (loading) return null

  return (
    <div className="flex flex-col min-h-svh px-16 py-12">
      {/* Header */}
      <div className="mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground/50 mb-3">
          {getGreeting()}
        </p>
        <h1 className="text-5xl font-bold leading-none tracking-tight">History</h1>
      </div>

      {/* Timeline strip — bleeds edge-to-edge for drama */}
      <div className="mb-10 -mx-16 px-16 border-y border-border/30 py-4">
        <DayStrip
          completionMap={completionMap}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          days={28}
        />
      </div>

      {/* Day detail — crossfade on selected date change */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDate}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          <DayDetail date={selectedDate} wins={selectedWins} loading={detailLoading} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
