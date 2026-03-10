import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { USER_ID } from '@/lib/env'

export function useJournal() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', USER_ID)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setEntries(data ?? [])
        setLoading(false)
      })
  }, [])

  const addEntry = useCallback(async ({ title, body }) => {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({ user_id: USER_ID, title, body })
      .select()
      .single()
    if (!error && data) setEntries(prev => [data, ...prev])
  }, [])

  const editEntry = useCallback(async (id, { title, body }) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, title, body } : e))
    await supabase
      .from('journal_entries')
      .update({ title, body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', USER_ID)
  }, [])

  const deleteEntry = useCallback(async (id) => {
    setEntries(prev => prev.filter(e => e.id !== id))
    await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', USER_ID)
  }, [])

  return { entries, loading, addEntry, editEntry, deleteEntry }
}
