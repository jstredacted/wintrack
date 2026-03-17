import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { USER_ID } from '@/lib/env'
import type { Database } from '@/lib/database.types'

type JournalEntry = Database['public']['Tables']['journal_entries']['Row']

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
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

  const addEntry = useCallback(async ({ title, body, category = 'daily', body_format = 'plaintext' }: { title: string; body: string; category?: string; body_format?: string }) => {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({ user_id: USER_ID, title, body, category, body_format } as Database['public']['Tables']['journal_entries']['Insert'] & { body_format: string })
      .select()
      .single()
    if (!error && data) setEntries(prev => [data, ...prev])
  }, [])

  const editEntry = useCallback(async (id: string, { title, body, category = 'daily', body_format = 'plaintext' }: { title: string; body: string; category?: string; body_format?: string }) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, title, body, category, body_format } as JournalEntry : e))
    await supabase
      .from('journal_entries')
      .update({ title, body, category, body_format, updated_at: new Date().toISOString() } as Database['public']['Tables']['journal_entries']['Update'] & { body_format: string })
      .eq('id', id)
      .eq('user_id', USER_ID)
  }, [])

  const deleteEntry = useCallback(async (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id))
    await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', USER_ID)
  }, [])

  return { entries, loading, addEntry, editEntry, deleteEntry }
}
