import { useState } from 'react';
import type { OneOffIncome } from '@/types/finance';
import OneOffIncomeRow from './OneOffIncomeRow';
import OneOffIncomeModal from './OneOffIncomeModal';

interface OneOffIncomeSectionProps {
  entries: OneOffIncome[];
  onAdd: (amount: number, date: string, note: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, fields: Partial<{ amount: number; date: string; note: string }>) => Promise<void>;
  readOnly: boolean;
}

export default function OneOffIncomeSection({ entries, onAdd, onDelete, onUpdate, readOnly }: OneOffIncomeSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-2">
      <h2 className="font-mono text-[0.778rem] uppercase tracking-widest text-muted-foreground">
        ONE-OFF INCOME
      </h2>

      {entries.length === 0 && (
        <div className="text-center py-8">
          <p className="text-foreground font-mono">No bonus income</p>
          <p className="text-muted-foreground text-[0.778rem] mt-1">
            Record one-off income like freelance payments or debts collected.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {entries.map((entry) => (
          <OneOffIncomeRow
            key={entry.id}
            entry={entry}
            onDelete={onDelete}
            onUpdate={onUpdate}
            readOnly={readOnly}
          />
        ))}
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="text-[0.778rem] font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          Add Income
        </button>
      )}

      <OneOffIncomeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={async (amount, date, note) => {
          await onAdd(amount, date, note);
        }}
      />
    </div>
  );
}
