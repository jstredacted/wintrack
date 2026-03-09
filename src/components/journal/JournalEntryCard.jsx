import { Pencil, Trash2 } from 'lucide-react'

function formatEntryDate(isoString) {
  const d = new Date(isoString)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).toUpperCase()
}

export default function JournalEntryCard({ entry, onEdit, onDelete, editingId, isEditing }) {
  const isCurrentlyEditing = isEditing != null ? isEditing : editingId === entry.id

  return (
    <article className="py-6 border-b border-border last:border-0">
      <p className="font-mono text-xs tracking-widest text-muted-foreground mb-2">
        {formatEntryDate(entry.created_at)}
      </p>
      <h2 className="text-2xl font-bold mb-3 leading-tight">{entry.title}</h2>
      {entry.body && (
        <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap break-words">
          {entry.body}
        </p>
      )}
      <div className="flex gap-3 mt-4">
        <button
          type="button"
          aria-label="Edit entry"
          onClick={() => onEdit(entry.id)}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Pencil size={14} />
        </button>
        {!isCurrentlyEditing && (
          <button
            type="button"
            aria-label="Delete entry"
            onClick={() => onDelete(entry.id)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </article>
  )
}
