import { useState, useRef, useEffect } from 'react';
import { formatPHP } from '@/lib/utils/currency';
import BalanceHistoryIndicator from './BalanceHistoryIndicator';
import type { BalanceChange } from '@/types/finance';

interface BalanceDisplayProps {
  currentBalance: number;
  startingBalance: number;
  lastChange: BalanceChange | null;
  onUpdateBalance: (newBalance: number) => Promise<void>;
  onOpenHistory: () => void;
  readOnly: boolean;
}

export default function BalanceDisplay({
  currentBalance,
  startingBalance,
  lastChange,
  onUpdateBalance,
  onOpenHistory,
  readOnly,
}: BalanceDisplayProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    if (readOnly) return;
    setEditValue(String(currentBalance));
    setEditing(true);
  };

  const save = async () => {
    const parsed = parseFloat(editValue);
    if (isNaN(parsed)) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onUpdateBalance(parsed);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const cancel = () => setEditing(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  };

  return (
    <div className="space-y-2 pt-6">
      {/* Current balance */}
      <div className="text-center">
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={save}
            className={[
              'text-center font-mono tabular-nums text-[2.667rem] font-light border-b-2 border-foreground bg-transparent outline-none w-full',
              saving ? 'opacity-50' : '',
            ].join(' ')}
          />
        ) : (
          <p
            onClick={startEdit}
            className={[
              'text-[2.667rem] font-mono tabular-nums font-light text-foreground',
              readOnly ? '' : 'cursor-pointer',
            ].join(' ')}
          >
            {formatPHP(currentBalance)}
          </p>
        )}
      </div>

      {/* Starting -> Current */}
      <p className="text-center text-[0.667rem] font-mono text-muted-foreground">
        Starting: {formatPHP(startingBalance)} → Current: {formatPHP(currentBalance)}
      </p>

      {/* History indicator */}
      <BalanceHistoryIndicator lastChange={lastChange} onClick={onOpenHistory} />
    </div>
  );
}
