import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useJournal } from '@/hooks/useJournal'
import { useUIStore } from '@/stores/uiStore'
import JournalEntryCard from '@/components/journal/JournalEntryCard'
import JournalEditorOverlay from '@/components/journal/JournalEditorOverlay'

export default function JournalPage() {
  const { entries, loading, addEntry, editEntry, deleteEntry } = useJournal()
  const refreshStreak = useUIStore((s) => s.refreshStreak)
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const overlayOpen = showNewForm || editingId !== null
  const editingEntry = editingId ? entries.find(e => e.id === editingId) : null

  async function handleOverlaySave({ title, body, category }) {
    if (editingId) {
      await editEntry(editingId, { title, body, category })
    } else {
      await addEntry({ title, body, category })
      refreshStreak()
    }
  }

  function handleOverlayClose() {
    setShowNewForm(false)
    setEditingId(null)
  }

  if (loading) return null

  return (
    <div className="flex flex-col min-h-svh px-16 py-12">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-10">
        <h1 className="text-5xl font-bold leading-none tracking-tight">Journal</h1>
        <button
          onClick={() => setShowNewForm(true)}
          className="font-mono text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors border-b border-muted-foreground/40 hover:border-foreground pb-px active:opacity-70 transition-opacity duration-75"
        >
          New Entry
        </button>
      </div>

      {/* Entry list */}
      {entries.length === 0 ? (
        <p className="font-mono text-sm text-muted-foreground/50">No entries yet</p>
      ) : (
        <AnimatePresence>
          {entries.map(entry => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <JournalEntryCard
                entry={entry}
                editingId={editingId}
                onEdit={(id) => setEditingId(id)}
                onDelete={(id) => deleteEntry(id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      <JournalEditorOverlay
        open={overlayOpen}
        initialTitle={editingEntry?.title ?? ''}
        initialBody={editingEntry?.body ?? ''}
        initialCategory={editingEntry?.category ?? 'daily'}
        onSave={handleOverlaySave}
        onClose={handleOverlayClose}
      />
    </div>
  )
}
