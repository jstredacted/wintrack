import { useState, useRef, useEffect } from 'react';
import { formatPHP } from '@/lib/utils/currency';

interface BudgetGaugeProps {
  spent: number;
  limit: number;
  onUpdateLimit: (newLimit: number) => Promise<void>;
  readOnly?: boolean;
  size?: number;
  strokeWidth?: number;
}

export default function BudgetGauge({
  spent,
  limit,
  onUpdateLimit,
  readOnly,
  size = 160,
  strokeWidth = 12,
}: BudgetGaugeProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = limit > 0 ? Math.min(spent / limit, 1) : 0;
  const dashOffset = circumference * (1 - progress);

  // Opacity thresholds
  const ringOpacity = progress < 0.5 ? 0.3 : progress < 0.8 ? 0.55 : 1.0;

  const cx = size / 2;
  const cy = size / 2;

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    if (readOnly) return;
    setEditValue(String(limit));
    setEditing(true);
  };

  const save = async () => {
    const parsed = parseFloat(editValue);
    if (isNaN(parsed) || parsed < 0) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onUpdateLimit(parsed);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const cancel = () => {
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      save();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          {/* Background ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          {/* Progress ring */}
          {limit > 0 && (
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="var(--foreground)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              opacity={ringOpacity}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{
                transition: 'stroke-dashoffset 600ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          )}
        </svg>

        {/* Center text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          onClick={startEdit}
          style={{ cursor: readOnly ? 'default' : 'pointer' }}
        >
          {editing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={save}
              className={[
                'text-center font-mono tabular-nums text-[1.333rem] font-light border-b-2 border-foreground bg-transparent outline-none w-20',
                saving ? 'opacity-50' : '',
              ].join(' ')}
            />
          ) : limit > 0 ? (
            <>
              <span className="text-[1.333rem] font-mono tabular-nums font-light text-foreground">
                {formatPHP(spent)}
              </span>
              <span className="text-[0.778rem] text-muted-foreground font-mono">
                of {formatPHP(limit)}
              </span>
            </>
          ) : (
            <span className="text-[0.778rem] text-muted-foreground font-mono">
              No budget set
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
