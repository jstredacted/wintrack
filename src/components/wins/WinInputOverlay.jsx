import { createPortal } from 'react-dom';
import { useRef, useEffect, useState } from 'react';

const WIN_CATEGORIES = [
  { value: 'work', label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'health', label: 'Health' },
];

export default function WinInputOverlay({ open, onSubmit, onClose, onDone }) {
  const inputRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [submittedTitles, setSubmittedTitles] = useState([]);
  const [category, setCategory] = useState('work');

  const handleDone = onDone ?? onClose;

  useEffect(() => {
    if (open) {
      setVisible(true);
      setExiting(false);
      setSubmittedTitles([]);
      setCategory('work');
    } else if (visible) {
      setExiting(true);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleDone();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [open, handleDone]);

  if (!visible) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Set intentions"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-8 ${
        exiting ? 'overlay-exit' : 'overlay-enter'
      }`}
      onAnimationEnd={() => {
        if (exiting) setVisible(false);
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const title = new FormData(e.target).get('title');
          if (title?.trim()) {
            onSubmit(title.trim(), category);
            setSubmittedTitles((prev) => [...prev, { title: title.trim(), category }]);
            e.target.reset();
            inputRef.current?.focus();
          }
        }}
      >
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-4">
          What's the grind for today?
        </p>

        {/* Category selector */}
        <div className="flex gap-2 mb-4">
          {WIN_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`font-mono text-xs uppercase tracking-[0.2em] px-2 py-1 border ${
                category === cat.value
                  ? 'border-foreground text-foreground'
                  : 'border-border text-muted-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <input
          ref={inputRef}
          name="title"
          autoComplete="off"
          className="w-full bg-transparent text-2xl font-mono outline-none border-b border-border pb-2 text-foreground"
          placeholder="I will..."
        />
        <button type="submit" className="sr-only">
          Submit
        </button>

        {submittedTitles.length > 0 && (
          <ul className="mt-6 flex flex-col gap-1">
            {submittedTitles.map((entry, i) => (
              <li key={i} className="font-mono text-sm text-muted-foreground/60">
                + {entry.title}
                {entry.category !== 'work' && (
                  <span className="ml-2 text-xs uppercase tracking-[0.15em]">
                    [{entry.category}]
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        {submittedTitles.length > 0 && (
          <button
            type="button"
            onClick={handleDone}
            className="font-mono text-sm uppercase tracking-[0.2em] border border-foreground px-4 py-2 mt-6"
          >
            Done
          </button>
        )}
      </form>
    </div>,
    document.body
  );
}
