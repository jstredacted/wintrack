import { Pencil, Trash2 } from 'lucide-react'
import { getLocalDateString } from '@/lib/utils/date'

export default function JournalEntryCard({ entry, onEdit, onDelete, editingId, isEditing }) {
  const isCurrentlyEditing = isEditing != null ? isEditing : editingId === entry.id
  const preview =
    entry.body && entry.body.length > 120
      ? entry.body.slice(0, 120) + '...'
      : entry.body

  return (
    <div className="border-b border-border py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs text-muted-foreground mb-1">
            {getLocalDateString(new Date(entry.created_at))}
          </p>
          <p className="font-mono font-medium">{entry.title}</p>
          {preview && (
            <p className="font-mono text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">
              {preview}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            aria-label="Edit entry"
            onClick={() => onEdit(entry.id)}
            className="p-1"
          >
            <Pencil size={14} />
          </button>
          {!isCurrentlyEditing && (
            <button
              type="button"
              aria-label="Delete entry"
              onClick={() => onDelete(entry.id)}
              className="p-1"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
