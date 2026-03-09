import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useRef, useEffect } from 'react';

export default function WinInputOverlay({ open, onSubmit, onClose }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);
  return createPortal(
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          key="win-input"
          role="dialog"
          aria-modal="true"
          aria-label="Log a win"
          initial={{ y: '100vh' }}
          animate={{ y: 0 }}
          exit={{ y: '100vh' }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          style={{ willChange: 'transform' }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-8"
          onAnimationComplete={() => inputRef.current?.focus()}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const title = new FormData(e.target).get('title');
              if (title?.trim()) onSubmit(title.trim());
            }}
          >
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-4">
              What's your win today?
            </p>
            <input
              ref={inputRef}
              name="title"
              autoComplete="off"
              className="w-full bg-transparent text-2xl font-mono outline-none border-b border-border pb-2 text-foreground"
              placeholder="I shipped..."
            />
            <button type="submit" className="sr-only">
              Submit
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
