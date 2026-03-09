import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useJournal } from '@/hooks/useJournal'
import JournalEntryCard from '@/components/journal/JournalEntryCard'
import JournalEditorOverlay from '@/components/journal/JournalEditorOverlay'

export default function JournalPage() {
  const { entries, loading, addEntry, editEntry, deleteEntry } = useJournal()
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const overlayOpen = showNewForm || editingId !== null
  const editingEntry = editingId ? entries.find(e => e.id === editingId) : null

  async function handleOverlaySave({ title, body }) {
    if (editingId) {
      await editEntry(editingId, { title, body })
    } else {
      await addEntry({ title, body })
    }
  }

  function handleOverlayClose() {
    setShowNewForm(false)
    setEditingId(null)
  }

  if (loading) return null

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Journal</h1>
        {!overlayOpen && (
          <button
            onClick={() => setShowNewForm(true)}
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors border-b border-muted-foreground pb-px"
          >
            New Entry
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">No entries yet</p>
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
                onEdit={(id) => setEditingId(id)}
                onDelete={(id) => deleteEntry(id)}
                editingId={editingId}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      <JournalEditorOverlay
        open={overlayOpen}
        initialTitle={editingEntry?.title ?? ''}
        initialBody={editingEntry?.body ?? ''}
        onSave={handleOverlaySave}
        onClose={handleOverlayClose}
      />
    </div>
  )
}
