import { useState } from 'react'

export default function JournalEntryForm({
  initialTitle = '',
  initialBody = '',
  onSubmit,
  onCancel,
}) {
  const [title, setTitle] = useState(initialTitle)
  const [body, setBody] = useState(initialBody)

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({ title: title.trim(), body: body.trim() })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="font-mono bg-transparent border-b border-border outline-none w-full mb-3"
      />
      <textarea
        rows={5}
        placeholder="Write your entry..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="font-mono bg-transparent border border-border rounded p-2 text-sm resize-none outline-none w-full"
      />
      <div className="flex gap-2 mt-2">
        <button
          type="submit"
          disabled={!title.trim()}
          className="font-mono text-sm border border-border px-3 py-1 rounded disabled:opacity-40"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="font-mono text-sm px-3 py-1"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
