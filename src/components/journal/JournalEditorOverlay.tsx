import { createPortal } from 'react-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import SlashCommand from './SlashCommand';

function parseBodyForTiptap(body: string, format?: string): string {
  if (!body.trim()) return '';
  if (format === 'html' || body.startsWith('<')) return body;
  return body.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
}

const CATEGORIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'financial', label: 'Financial' },
];

interface JournalEditorOverlayProps {
  open: boolean;
  initialTitle?: string;
  initialBody?: string;
  initialBodyFormat?: string;
  initialCategory?: string;
  onSave: (entry: { title: string; body: string; body_format: string; category: string }) => Promise<void>;
  onClose: () => void;
}

export default function JournalEditorOverlay({
  open,
  initialTitle = '',
  initialBody = '',
  initialBodyFormat,
  initialCategory = 'daily',
  onSave,
  onClose,
}: JournalEditorOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [screen, setScreen] = useState<'editing' | 'summary'>('editing');
  const [title, setTitle] = useState(initialTitle);
  const [category, setCategory] = useState(initialCategory ?? 'daily');
  const [liveWordCount, setLiveWordCount] = useState(0);
  const [summaryWordCount, setSummaryWordCount] = useState(0);
  const [summaryMinutes, setSummaryMinutes] = useState(0);
  const [saving, setSaving] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const liveWordCountRef = useRef(0);
  const savingRef = useRef(false);
  const bodyRef = useRef<string>('');
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Track iOS virtual keyboard via visualViewport API
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      // When keyboard is open, visualViewport.height < window.innerHeight
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      setKeyboardOffset(Math.max(0, offset));
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [open]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      CharacterCount,
      Placeholder.configure({ placeholder: 'Write your entry...' }),
      SlashCommand,
    ],
    content: parseBodyForTiptap(initialBody, initialBodyFormat),
    shouldRerenderOnTransaction: false,
    onUpdate: ({ editor }) => {
      bodyRef.current = editor.getHTML();
      const wc = editor.storage.characterCount.words();
      setLiveWordCount(wc);
      liveWordCountRef.current = wc;
    },
  });

  useEffect(() => {
    if (open) {
      setVisible(true);
      setExiting(false);
      setScreen('editing');
      setTitle(initialTitle);
      setCategory(initialCategory ?? 'daily');
      const parsedContent = parseBodyForTiptap(initialBody, initialBodyFormat);
      editor?.commands.setContent(parsedContent);
      bodyRef.current = parsedContent;
      const initialWc = editor?.storage.characterCount.words() ?? 0;
      liveWordCountRef.current = initialWc;
      setLiveWordCount(initialWc);
      startedAtRef.current = Date.now();
      savingRef.current = false;
    } else if (visible) {
      setExiting(true);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const currentTitle = title.trim();
    if (!currentTitle || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    const wc = liveWordCountRef.current;
    const minutes = Math.round((Date.now() - (startedAtRef.current ?? Date.now())) / 60000);
    await onSave({ title: currentTitle, body: bodyRef.current, body_format: 'html', category });
    setSummaryWordCount(wc);
    setSummaryMinutes(minutes);
    setSaving(false);
    setScreen('summary');
  }

  if (!visible) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Journal editor"
      className={`fixed inset-0 z-50 flex flex-col bg-background ${exiting ? 'journal-overlay-exit' : 'journal-overlay-enter'}`}
      onAnimationEnd={(e) => {
        if (e.target !== e.currentTarget) return; // guard: ignore bubbled events from child animations
        if (exiting) { setVisible(false); setScreen('editing'); }
      }}
    >
      <AnimatePresence mode="wait">
        {screen === 'editing' ? (
          <motion.div
            key="editing"
            className="flex-1 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
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
            <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0 px-4 py-6 sm:px-20 sm:py-10 lg:px-32 w-full">
              {/* Category selector */}
              <div className="flex gap-2 sm:gap-3 mb-4">
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] px-1.5 sm:px-2 py-0.5 sm:py-1 border
                      ${category === c.value ? 'border-foreground text-foreground' : 'border-border text-muted-foreground'}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
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
              <div className="flex-1 w-full tiptap-editor overflow-y-auto">
                <EditorContent editor={editor} className="h-full" />
              </div>
              {/* Mobile formatting toolbar + save — fixed above keyboard using visualViewport */}
              {editor && (
                <div
                  ref={toolbarRef}
                  className="fixed left-0 right-0 sm:relative sm:bottom-auto flex sm:hidden flex-col bg-background border-t border-border z-[60]"
                  style={{ bottom: keyboardOffset > 0 ? keyboardOffset : 0 }}
                >
                  <div className="flex items-center gap-0 py-1 overflow-x-auto">
                    {[
                      { label: 'B', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), style: 'font-bold text-base' },
                      { label: 'I', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), style: 'italic text-base' },
                      { label: 'H2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }), style: 'text-xs' },
                      { label: 'H3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }), style: 'text-xs' },
                      { label: '—', action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList'), style: 'text-base' },
                      { label: '1.', action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList'), style: 'text-xs' },
                    ].map(({ label, action, active, style }) => (
                      <button
                        key={label}
                        type="button"
                        onPointerDown={(e) => { e.preventDefault(); action(); }}
                        className={`min-w-[48px] min-h-[48px] flex items-center justify-center rounded-md font-mono shrink-0 transition-colors
                          ${active ? 'bg-foreground text-background' : 'text-foreground border border-transparent active:bg-accent'} ${style}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-6 py-3 border-t border-border/50">
                    <button
                      type="submit"
                      disabled={!title.trim() || saving}
                      className="font-mono text-xs uppercase tracking-widest text-foreground
                                 disabled:opacity-30 border-b border-foreground pb-px
                                 disabled:border-muted-foreground
                                 active:scale-[0.96] transition-transform duration-75"
                    >
                      {saving ? 'Saving\u2026' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="font-mono text-xs uppercase tracking-widest text-muted-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {/* Desktop save buttons */}
              <div className="hidden sm:flex gap-6 mt-8 pb-4">
                <button
                  type="submit"
                  disabled={!title.trim() || saving}
                  className="font-mono text-xs uppercase tracking-widest text-foreground
                             disabled:opacity-30 border-b border-foreground pb-px
                             disabled:border-muted-foreground
                             active:scale-[0.96] transition-transform duration-75"
                >
                  {saving ? 'Saving\u2026' : 'Save'}
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
          </motion.div>
        ) : (
          /* Summary screen */
          <motion.div
            key="summary"
            className="flex-1 flex flex-col items-center justify-center gap-6 p-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
}
