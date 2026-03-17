import { useState, useRef, useEffect, useMemo } from 'react';
import { formatPHP } from '@/lib/utils/currency';
import BalanceHistoryIndicator from './BalanceHistoryIndicator';
import type { BalanceChange } from '@/types/finance';

/** Split a formatted PHP string like "₱123,456.78" into parts */
function splitBalance(amount: number): { symbol: string; main: string; decimals: string } {
  const formatted = formatPHP(amount); // e.g. "₱123,456.78"
  const match = formatted.match(/^([₱\s]*)([^.]+)(\..*)?$/);
  if (!match) return { symbol: '₱', main: formatted, decimals: '' };
  return {
    symbol: match[1]?.trim() || '₱',
    main: match[2] || '0',
    decimals: match[3] || '.00',
  };
}

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

  const parts = useMemo(() => splitBalance(currentBalance), [currentBalance]);

  return (
    <div className="space-y-2 pt-6">
      {/* Current balance — hero */}
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
              'text-center font-mono tabular-nums text-[4rem] font-light border-b-2 border-foreground bg-transparent outline-none w-full',
              saving ? 'opacity-50' : '',
            ].join(' ')}
          />
        ) : (
          <p
            onClick={startEdit}
            className={[
              'font-mono tabular-nums text-foreground inline-flex items-baseline justify-center w-full',
              readOnly ? '' : 'cursor-pointer',
            ].join(' ')}
          >
            <span className="text-[2rem] font-light text-muted-foreground">{parts.symbol}</span>
            <span className="text-[4rem] font-light">{parts.main}</span>
            <span className="text-[2rem] font-light text-muted-foreground">{parts.decimals}</span>
          </p>
        )}
      </div>

      {/* Starting / Current label pairs */}
      <div className="flex gap-8 justify-center mt-2">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Starting </span>
          <span className="text-xs font-mono tabular-nums text-muted-foreground">{formatPHP(startingBalance)}</span>
        </div>
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Current </span>
          <span className="text-xs font-mono tabular-nums">{formatPHP(currentBalance)}</span>
        </div>
      </div>

      {/* History indicator */}
      <BalanceHistoryIndicator lastChange={lastChange} onClick={onOpenHistory} />
    </div>
  );
}
