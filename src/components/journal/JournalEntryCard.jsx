import { Pencil, Trash2 } from 'lucide-react'

function formatEntryDate(isoString) {
  const d = new Date(isoString)
  return d.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function JournalEntryCard({ entry, onEdit, onDelete, editingId }) {
  const isCurrentlyEditing = editingId === entry.id
  return (
    <article className="py-10 border-b border-border/30 last:border-0 group">
      {/* Date — editorial metadata */}
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground/40 mb-4">
        {formatEntryDate(entry.created_at)}
      </p>

      {/* Title — the hero */}
      <h2 className="text-3xl font-bold leading-tight mb-4">{entry.title}</h2>

      {/* Body preview */}
      {entry.body && (
        <p className="text-base leading-loose text-muted-foreground line-clamp-4 whitespace-pre-wrap">
          {entry.body}
        </p>
      )}

      {/* Actions — visible on hover only */}
      <div className="flex gap-4 mt-5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          aria-label="Edit entry"
          onClick={() => onEdit(entry.id)}
          className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors active:opacity-70 transition-opacity duration-75"
        >
          <Pencil size={13} />
          Edit
        </button>
        {!isCurrentlyEditing && (
          <button
            type="button"
            aria-label="Delete entry"
            onClick={() => onDelete(entry.id)}
            className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors active:opacity-70 transition-opacity duration-75"
          >
            <Trash2 size={13} />
            Delete
          </button>
        )}
      </div>
    </article>
  )
}
