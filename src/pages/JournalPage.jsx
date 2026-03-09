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
    <div className="p-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-mono text-lg">Journal</h1>
        {!showNewForm && !editingId && (
          <button
            onClick={() => setShowNewForm(true)}
            className="font-mono text-sm border border-border px-3 py-1 rounded"
          >
            New Entry
          </button>
        )}
      </div>

      {showNewForm && (
        <div className="mb-4 border border-border rounded p-3">
          <JournalEntryForm
            onSubmit={handleCreate}
            onCancel={() => setShowNewForm(false)}
          />
        </div>
      )}

      {entries.length === 0 && !showNewForm ? (
        <p className="font-mono text-sm text-muted-foreground">No entries yet</p>
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
                <div className="border border-border rounded p-3 mb-2">
                  <JournalEntryForm
                    initialTitle={entry.title}
                    initialBody={entry.body}
                    onSubmit={(fields) => handleEdit(entry.id, fields)}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
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
