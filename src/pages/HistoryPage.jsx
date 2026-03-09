import { useState, useEffect } from 'react'
import { useHistory } from '@/hooks/useHistory'
import { getLocalDateString } from '@/lib/utils/date'
import DayStrip from '@/components/history/DayStrip'
import DayDetail from '@/components/history/DayDetail'

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HistoryPage() {
  const { completionMap, loading, fetchWinsForDate } = useHistory()
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString(new Date()))
  const [selectedWins, setSelectedWins] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)

  // Fetch wins for selected date whenever it changes
  useEffect(() => {
    let cancelled = false
    setDetailLoading(true)
    fetchWinsForDate(selectedDate).then(wins => {
      if (!cancelled) {
        setSelectedWins(wins)
        setDetailLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [selectedDate, fetchWinsForDate])

  function handleSelectDate(date) {
    setSelectedDate(date)
  }

  if (loading) return null

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="font-mono text-lg mb-4">History</h1>

      <div className="mb-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
          {getGreeting()}
        </p>
        <DayStrip
          completionMap={completionMap}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          days={28}
        />
      </div>

      <div>
        <DayDetail date={selectedDate} wins={selectedWins} loading={detailLoading} />
      </div>
    </div>
  )
}
