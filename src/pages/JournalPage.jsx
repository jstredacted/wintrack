import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useJournal } from '@/hooks/useJournal'
import JournalEntryCard from '@/components/journal/JournalEntryCard'
import JournalEntryForm from '@/components/journal/JournalEntryForm'

export default function JournalPage() {
  const { entries, loading, addEntry, editEntry, deleteEntry } = useJournal()
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  async function handleCreate({ title, body }) {
    await addEntry({ title, body })
    setShowNewForm(false)
  }

  async function handleEdit(id, { title, body }) {
    await editEntry(id, { title, body })
    setEditingId(null)
  }

  if (loading) return null

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Journal</h1>
        {!showNewForm && !editingId && (
          <button
            onClick={() => setShowNewForm(true)}
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors border-b border-muted-foreground pb-px"
          >
            New Entry
          </button>
        )}
      </div>

      {showNewForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="border-b border-border mb-2"
        >
          <JournalEntryForm
            onSubmit={handleCreate}
            onCancel={() => setShowNewForm(false)}
          />
        </motion.div>
      )}

      {entries.length === 0 && !showNewForm ? (
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
              {editingId === entry.id ? (
                <JournalEntryForm
                  initialTitle={entry.title}
                  initialBody={entry.body}
                  onSubmit={(fields) => handleEdit(entry.id, fields)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <JournalEntryCard
                  entry={entry}
                  onEdit={(id) => setEditingId(id)}
                  onDelete={(id) => deleteEntry(id)}
                  editingId={editingId}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  )
}
