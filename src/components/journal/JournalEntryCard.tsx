import { Pencil, Trash2 } from 'lucide-react'
import type { Database } from '@/lib/database.types'

type JournalEntry = Database['public']['Tables']['journal_entries']['Row'] & { body_format?: string }

interface JournalEntryCardProps {
  entry: JournalEntry;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  editingId: string | null;
}

function formatEntryDate(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function renderBody(body: string, format: string) {
  if (format === 'html') {
    return (
      <div
        className="tiptap-content text-base leading-loose text-muted-foreground line-clamp-4"
        dangerouslySetInnerHTML={{ __html: body }}
      />
    )
  }
  return (
    <p className="text-base leading-loose text-muted-foreground line-clamp-4 whitespace-pre-wrap">
      {body}
    </p>
  )
}

export default function JournalEntryCard({ entry, onEdit, onDelete, editingId }: JournalEntryCardProps) {
  const isCurrentlyEditing = editingId === entry.id
  return (
    <article className="py-10 border-b border-border/30 last:border-0 group">
      {/* Date — editorial metadata */}
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground/40 mb-4 flex items-center gap-2">
        {formatEntryDate(entry.created_at)}
        {entry.category && entry.category !== 'daily' && (
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground border border-border px-1.5 py-0.5">
            {entry.category}
          </span>
        )}
      </p>

      {/* Title — the hero */}
      <h2 className="text-3xl font-bold leading-tight mb-4">{entry.title}</h2>

      {/* Body preview — format-aware */}
      {entry.body && renderBody(entry.body, entry.body_format || 'plaintext')}

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
