import { createPortal } from 'react-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useCheckin } from '@/hooks/useCheckin';

export default function CheckInOverlay({ open, wins, onComplete, onClose }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submitCalledRef = useRef(false);
  const { submitCheckin } = useCheckin();

  // Overlay mount/unmount state machine — same as WinInputOverlay
  useEffect(() => {
    if (open) {
      setVisible(true);
      setExiting(false);
      setStep(0);
      setAnswers([]);
      setShowNote(false);
      setNote('');
      submitCalledRef.current = false;
    } else if (visible) {
      setExiting(true);
    }
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const isComplete = step === wins.length;

  // Submit check-in answers when completion screen mounts
  useEffect(() => {
    if (!isComplete || submitCalledRef.current || !visible || exiting) return;
    submitCalledRef.current = true;

    async function submit() {
      setSubmitting(true);
      await submitCheckin(answers);
      setSubmitting(false);
      onComplete?.();
    }
    submit();
  }, [isComplete, visible, exiting]);

  const handleYes = useCallback(() => {
    setAnswers((prev) => [
      ...prev,
      { winId: wins[step].id, completed: true, note: null },
    ]);
    setShowNote(false);
    setNote('');
    setStep((s) => s + 1);
  }, [step, wins]);

  const handleNo = useCallback(() => {
    setShowNote(true);
  }, []);

  const handleNoteSubmit = useCallback(
    (e) => {
      e?.preventDefault?.();
      setAnswers((prev) => [
        ...prev,
        { winId: wins[step].id, completed: false, note: note.trim() || null },
      ]);
      setShowNote(false);
      setNote('');
      setStep((s) => s + 1);
    },
    [step, wins, note]
  );

  if (!visible) return null;

  const completedCount = answers.filter((a) => a.completed).length;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Evening check-in"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-8 ${
        exiting ? 'overlay-exit' : 'overlay-enter'
      }`}
      onAnimationEnd={() => {
        if (exiting) setVisible(false);
      }}
    >
      <AnimatePresence>
        {isComplete ? (
          <motion.div
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-6 text-center"
          >
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              Done.
            </p>
            <p className="text-4xl font-mono text-foreground">
              {completedCount} of {wins.length}
            </p>
            {wins.length > 0 && (
              <p className="text-xs font-mono text-muted-foreground">
                wins completed
              </p>
            )}
            <button
              onClick={onClose}
              disabled={submitting}
              className="mt-4 px-6 py-2 border border-border rounded-md text-sm font-mono text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            >
              {submitting ? 'Saving\u2026' : 'Close'}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={`step-${step}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-center gap-8 text-center w-full max-w-md"
          >
            {/* Progress indicator */}
            <p className="text-xs font-mono text-muted-foreground">
              {step + 1} / {wins.length}
            </p>

            {/* Win title */}
            <p className="text-2xl font-mono text-foreground leading-snug">
              {wins[step].title}
            </p>

            {/* Yes / No buttons or note field */}
            {showNote ? (
              <form onSubmit={handleNoteSubmit} className="w-full flex flex-col gap-4">
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
                  What happened?
                </p>
                <textarea
                  autoFocus
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleNoteSubmit();
                    }
                  }}
                  rows={3}
                  placeholder="Optional — press Enter to skip"
                  className="w-full bg-transparent border border-border rounded-md p-3 text-sm font-mono text-foreground resize-none outline-none focus:border-foreground"
                />
                <button
                  type="submit"
                  className="px-6 py-2 border border-border rounded-md text-sm font-mono text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                >
                  Next
                </button>
              </form>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={handleYes}
                  className="px-8 py-3 bg-foreground text-background rounded-md text-sm font-mono font-medium hover:opacity-90 transition-opacity"
                >
                  Yes
                </button>
                <button
                  onClick={handleNo}
                  className="px-8 py-3 border border-border rounded-md text-sm font-mono text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                >
                  No
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
}
