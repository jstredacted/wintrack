import { useState } from 'react';
import type { IncomeSource } from '@/types/finance';

interface IncomeSourceEditorProps {
  source?: IncomeSource;
  onSave: (data: {
    name: string;
    amount: number;
    currency: 'USD' | 'PHP';
    conversion_method: 'wise' | 'paypal' | 'none';
    payday_day: number | null;
  }) => Promise<void>;
  onCancel: () => void;
  onRemove?: (id: string) => Promise<void>;
}

export default function IncomeSourceEditor({
  source,
  onSave,
  onCancel,
  onRemove,
}: IncomeSourceEditorProps) {
  const [name, setName] = useState(source?.name ?? '');
  const [amount, setAmount] = useState(source?.amount?.toString() ?? '');
  const [currency, setCurrency] = useState<'USD' | 'PHP'>(source?.currency ?? 'USD');
  const [conversionMethod, setConversionMethod] = useState<'wise' | 'paypal' | 'none'>(
    source?.conversion_method ?? 'wise'
  );
  const [paydayDay, setPaydayDay] = useState(source?.payday_day?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const inputClass =
    'w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono';

  async function handleSave() {
    if (!name.trim() || !amount) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        amount: parseFloat(amount),
        currency,
        conversion_method: currency === 'PHP' ? 'none' : conversionMethod,
        payday_day: paydayDay ? parseInt(paydayDay, 10) : null,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!source || !onRemove) return;
    await onRemove(source.id);
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Source name"
        className={inputClass}
        required
      />

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        step="0.01"
        className={inputClass}
        required
      />

      <select
        value={currency}
        onChange={(e) => {
          const val = e.target.value as 'USD' | 'PHP';
          setCurrency(val);
          if (val === 'PHP') setConversionMethod('none');
        }}
        className={inputClass}
      >
        <option value="USD">USD</option>
        <option value="PHP">PHP</option>
      </select>

      {currency === 'USD' && (
        <select
          value={conversionMethod}
          onChange={(e) =>
            setConversionMethod(e.target.value as 'wise' | 'paypal' | 'none')
          }
          className={inputClass}
        >
          <option value="wise">Wise</option>
          <option value="paypal">PayPal</option>
          <option value="none">None</option>
        </select>
      )}

      <input
        type="number"
        value={paydayDay}
        onChange={(e) => setPaydayDay(e.target.value)}
        placeholder="Day of month"
        min={1}
        max={31}
        className={inputClass}
      />

      <div className="flex items-center gap-4 pt-1">
        <button
          onClick={handleSave}
          disabled={saving || !name.trim() || !amount}
          className="font-mono text-sm uppercase tracking-widest border-b border-foreground pb-0.5 hover:opacity-70 transition-opacity disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>

        <button
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground text-sm font-mono"
        >
          Cancel
        </button>

        {source && onRemove && (
          <>
            {confirming ? (
              <span className="flex items-center gap-2 text-sm font-mono">
                <span className="text-muted-foreground">
                  Remove {source.name}? Past months are not affected.
                </span>
                <button
                  onClick={handleRemove}
                  className="text-destructive font-mono text-sm"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="text-muted-foreground hover:text-foreground font-mono text-sm"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="text-destructive text-sm font-mono"
              >
                Remove
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
