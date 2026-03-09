import { useState, useRef, useEffect } from 'react'

export default function JournalEntryForm({
  initialTitle = '',
  initialBody = '',
  onSubmit,
  onCancel,
}) {
  const [title, setTitle] = useState(initialTitle)
  const [body, setBody] = useState(initialBody)
  const titleRef = useRef(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({ title: title.trim(), body: body.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="py-4">
      <input
        ref={titleRef}
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-transparent text-2xl font-bold outline-none placeholder:text-muted-foreground mb-4 border-b border-border pb-2"
      />
      <textarea
        rows={8}
        placeholder="Write your entry..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full bg-transparent text-base leading-relaxed outline-none resize-none placeholder:text-muted-foreground"
      />
      <div className="flex gap-4 mt-6">
        <button
          type="submit"
          disabled={!title.trim()}
          className="font-mono text-xs uppercase tracking-widest text-foreground disabled:opacity-30 border-b border-foreground pb-px disabled:border-muted-foreground"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="font-mono text-xs uppercase tracking-widest text-muted-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
