import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, CheckSquare, Square } from 'lucide-react';
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reverting, setReverting] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setExiting(false);
      setSelectedIds(new Set());
      setConfirmBulk(false);
    } else if (visible) {
      setExiting(true);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmBulk) { setConfirmBulk(false); return; }
        if (selectedIds.size > 0) { setSelectedIds(new Set()); return; }
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, confirmBulk, selectedIds]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === changes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(changes.map(c => c.id)));
    }
  };

  const handleBulkRevert = async () => {
    setReverting(true);
    try {
      // Revert in reverse chronological order (newest first)
      const sorted = changes
        .filter(c => selectedIds.has(c.id))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      for (const change of sorted) {
        await onRevert(change.id);
      }
      setSelectedIds(new Set());
      setConfirmBulk(false);
    } finally {
      setReverting(false);
    }
  };

  const totalDelta = changes
    .filter(c => selectedIds.has(c.id))
    .reduce((sum, c) => sum + Number(c.delta), 0);

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

      {/* Toolbar — visible when items exist */}
      {changes.length > 0 && (
        <div className="max-w-[600px] mx-auto px-8 pt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            {selectedIds.size === changes.length ? (
              <CheckSquare size={14} />
            ) : (
              <Square size={14} />
            )}
            {selectedIds.size === changes.length ? 'Deselect all' : 'Select all'}
          </button>

          {selectedIds.size > 0 && !confirmBulk && (
            <button
              type="button"
              onClick={() => setConfirmBulk(true)}
              className="text-xs uppercase tracking-[0.15em] font-mono text-destructive hover:underline"
            >
              Remove {selectedIds.size} selected
            </button>
          )}
        </div>
      )}

      {/* Bulk confirm */}
      {confirmBulk && (
        <div className="max-w-[600px] mx-auto px-8 pt-3">
          <div className="bg-card rounded-lg p-4 space-y-3">
            <p className="text-xs font-mono text-muted-foreground">
              Revert {selectedIds.size} change{selectedIds.size > 1 ? 's' : ''}? Balance will adjust by{' '}
              <span className={totalDelta > 0 ? '' : 'text-destructive'}>
                {formatPHP(-totalDelta)}
              </span>
              . This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBulkRevert}
                disabled={reverting}
                className={`text-xs font-mono uppercase tracking-[0.15em] text-destructive hover:underline ${
                  reverting ? 'opacity-50' : ''
                }`}
              >
                {reverting ? 'Reverting...' : 'Revert'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmBulk(false)}
                disabled={reverting}
                className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-[600px] mx-auto px-8 py-8 space-y-3">
        {changes.length === 0 ? (
          <p className="text-muted-foreground font-mono text-center">
            No balance changes recorded
          </p>
        ) : (
          changes.map((change) => (
            <div
              key={change.id}
              className={`bg-card rounded-lg p-4 transition-colors cursor-pointer ${
                selectedIds.has(change.id) ? 'ring-1 ring-foreground/30' : ''
              }`}
              onClick={() => toggleSelect(change.id)}
            >
              <div className="flex items-center gap-3">
                {/* Checkbox */}
                <div className="shrink-0 text-muted-foreground">
                  {selectedIds.has(change.id) ? (
                    <CheckSquare size={16} className="text-foreground" />
                  ) : (
                    <Square size={16} />
                  )}
                </div>

                {/* Details */}
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
              </div>
            </div>
          ))
        )}
      </div>
    </div>,
    document.body
  );
}
