import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';

export default function EveningPrompt({ show, onStartCheckin, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setExiting(false);
    } else if (visible) {
      setExiting(true);
    }
  }, [show]);

  if (!visible) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Evening check-in prompt"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-8 ${
        exiting ? 'overlay-exit' : 'overlay-enter'
      }`}
      onAnimationEnd={() => {
        if (exiting) setVisible(false);
      }}
    >
      <div className="flex flex-col items-center gap-8 text-center max-w-sm">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
          Evening
        </p>
        <p className="text-2xl font-mono text-foreground leading-snug">
          Time to close the loop.
        </p>
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={onStartCheckin}
            className="w-full px-6 py-3 bg-foreground text-background rounded-md text-sm font-mono font-medium hover:opacity-90 transition-opacity"
            aria-label="Start check-in"
          >
            Start check-in
          </button>
          <button
            onClick={onDismiss}
            className="w-full px-6 py-3 border border-border rounded-md text-sm font-mono text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            aria-label="Later"
          >
            Later
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
