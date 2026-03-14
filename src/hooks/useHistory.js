import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { USER_ID } from '@/lib/env'
import { useSettingsStore } from '@/stores/settingsStore'

export function useHistory() {
  const dayStartHour = useSettingsStore(s => s.settings.dayStartHour)
  const [completionMap, setCompletionMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMap() {
      const { data, error } = await supabase
        .from('wins')
        .select('win_date, completed')
        .eq('user_id', USER_ID)

      if (error || !data) { setLoading(false); return }

      const map = {}
      for (const win of data) {
        if (win.completed) {
          map[win.win_date] = true
        } else if (!map[win.win_date]) {
          map[win.win_date] = false
        }
      }
      setCompletionMap(map)
      setLoading(false)
    }
    fetchMap()
  }, [dayStartHour])

  const fetchWinsForDate = useCallback(async (date) => {
    const { data } = await supabase
      .from('wins')
      .select('id, title, category, completed')
      .eq('user_id', USER_ID)
      .eq('win_date', date)
      .order('created_at', { ascending: true })
    return data ?? []
  }, [])

  return { completionMap, loading, fetchWinsForDate }
}
