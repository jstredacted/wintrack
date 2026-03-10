import { createPortal } from 'react-dom';
import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function JournalEditorOverlay({
  open,
  initialTitle = '',
  initialBody = '',
  onSave,
  onClose,
}) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [screen, setScreen] = useState('editing'); // 'editing' | 'summary'
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [liveWordCount, setLiveWordCount] = useState(0);
  const [summaryWordCount, setSummaryWordCount] = useState(0);
  const [summaryMinutes, setSummaryMinutes] = useState(0);
  const startedAtRef = useRef(null);
  const titleRef = useRef(null);
  const liveWordCountRef = useRef(0);
  const savingRef = useRef(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setExiting(false);
      setScreen('editing');
      setTitle(initialTitle);
      setBody(initialBody);
      liveWordCountRef.current = wordCount(initialBody);
      setLiveWordCount(liveWordCountRef.current);
      startedAtRef.current = Date.now();
      savingRef.current = false;
    } else if (visible) {
      setExiting(true);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  function handleBodyChange(e) {
    const val = e.target.value;
    const wc = wordCount(val);
    setBody(val);
    setLiveWordCount(wc);
    liveWordCountRef.current = wc;
  }

  async function handleSave(e) {
    e.preventDefault();
    const currentTitle = title.trim();
    if (!currentTitle || savingRef.current) return;
    savingRef.current = true;
    const wc = liveWordCountRef.current;
    const minutes = Math.round((Date.now() - startedAtRef.current) / 60000);
    await onSave({ title: currentTitle, body: body.trim() });
    setSummaryWordCount(wc);
    setSummaryMinutes(minutes);
    setScreen('summary');
  }

  if (!visible) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Journal editor"
      className={`fixed inset-0 z-50 flex flex-col bg-background ${exiting ? 'journal-overlay-exit' : 'journal-overlay-enter'}`}
      onAnimationEnd={() => { if (exiting) { setVisible(false); setScreen('editing'); } }}
    >
      {screen === 'editing' ? (
        <>
          {/* Editor header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              {liveWordCount > 0 ? `${liveWordCount} words` : 'Journal'}
            </span>
            <button
              aria-label="close"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Editor form — full-screen writing mode */}
          <form onSubmit={handleSave} className="flex-1 flex flex-col px-12 py-10 sm:px-20 lg:px-32 w-full">
            <input
              ref={titleRef}
              type="text"
              aria-label="title"
              placeholder="Title"
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-3xl font-bold outline-none placeholder:text-muted-foreground/40 mb-6 border-b border-border/40 pb-3"
            />
            <textarea
              aria-label="body"
              placeholder="Write your entry..."
              value={body}
              onChange={handleBodyChange}
              className="flex-1 w-full bg-transparent text-lg leading-relaxed outline-none resize-none placeholder:text-muted-foreground/30"
            />
            <div className="flex gap-6 mt-8 pb-4">
              <button
                type="submit"
                disabled={!title.trim()}
                className="font-mono text-xs uppercase tracking-widest text-foreground disabled:opacity-30 border-b border-foreground pb-px disabled:border-muted-foreground"
              >
                Save
              </button>
              <button
                type="button"
                onClick={onClose}
                className="font-mono text-xs uppercase tracking-widest text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          </form>
        </>
      ) : (
        /* Summary screen */
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
            Entry saved
          </p>
          <div className="flex gap-3">
            <span className="px-3 py-1 border border-border rounded font-mono text-sm tabular-nums">
              {summaryWordCount} words
            </span>
            <span className="px-3 py-1 border border-border rounded font-mono text-sm tabular-nums">
              {summaryMinutes < 1 ? '< 1 min' : `${summaryMinutes} min`}
            </span>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors border-b border-muted-foreground pb-px"
          >
            Done
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}
