import { createPortal } from 'react-dom';
import { useRef, useEffect, useState } from 'react';

export default function WinInputOverlay({ open, onSubmit, onClose }) {
  const inputRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setExiting(false);
    } else if (visible) {
      setExiting(true);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [open, onClose]);

  if (!visible) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Log a win"
      className={[
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-8',
        'duration-300 fill-mode-forwards',
        exiting
          ? 'animate-out slide-out-to-bottom'
          : 'animate-in slide-in-from-bottom',
      ].join(' ')}
      onAnimationEnd={() => {
        if (exiting) setVisible(false);
      }}
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
    </div>,
    document.body
  );
}
