import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2 } from 'lucide-react';
import { formatPHP } from '@/lib/utils/currency';
import type { BalanceChange } from '@/types/finance';

interface BalanceHistoryModalProps {
  changes: BalanceChange[];
  onRevert: (id: string) => Promise<void>;
  onClose: () => void;
  open: boolean;
}

export default function BalanceHistoryModal({ changes, onRevert, onClose, open }: BalanceHistoryModalProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [reverting, setReverting] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setExiting(false);
      setConfirmingId(null);
    } else if (visible) {
      setExiting(true);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleRevert = async (id: string) => {
    setReverting(true);
    try {
      await onRevert(id);
      setConfirmingId(null);
    } finally {
      setReverting(false);
    }
  };

  if (!visible) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Balance History"
      className={`fixed inset-0 z-50 bg-background/95 overflow-y-auto ${
        exiting ? 'overlay-exit' : 'overlay-enter'
      }`}
      onAnimationEnd={() => {
        if (exiting) setVisible(false);
      }}
    >
      {/* Header */}
      <div className="max-w-[600px] mx-auto px-8 pt-12 flex items-center justify-between">
        <h2 className="text-[1.333rem] font-mono font-light">Balance History</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="max-w-[600px] mx-auto px-8 py-12 space-y-3">
        {changes.length === 0 ? (
          <p className="text-muted-foreground font-mono text-center">
            No balance changes recorded
          </p>
        ) : (
          changes.map((change) => (
            <div key={change.id} className="bg-card rounded-lg p-4">
              {confirmingId === change.id ? (
                /* Revert confirmation */
                <div className="space-y-3">
                  <p className="text-[0.778rem] text-muted-foreground font-mono">
                    Revert will adjust balance by {formatPHP(-change.delta)}. This cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleRevert(change.id)}
                      disabled={reverting}
                      className={`text-[0.778rem] font-mono text-destructive hover:underline ${
                        reverting ? 'opacity-50' : ''
                      }`}
                    >
                      Revert
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      disabled={reverting}
                      className="text-[0.778rem] font-mono text-muted-foreground hover:underline"
                    >
                      Keep Change
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal row */
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.778rem] text-muted-foreground font-mono">
                      {new Date(change.created_at).toLocaleDateString()}
                    </p>
                    <p
                      className={`text-[1.333rem] font-mono tabular-nums ${
                        change.delta < 0 ? 'text-destructive' : ''
                      }`}
                    >
                      {change.delta > 0 ? '+' : ''}{formatPHP(change.delta)}
                    </p>
                    <p className="text-[0.778rem] text-muted-foreground">
                      Balance: {formatPHP(change.new_balance)}
                    </p>
                    {change.note && (
                      <p className="text-[0.778rem] text-muted-foreground italic mt-1">
                        {change.note}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(change.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    aria-label="Revert change"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>,
    document.body
  );
}
