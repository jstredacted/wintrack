import { useMemo } from 'react';
import { getDueUrgency } from '@/lib/utils/finance';
import BillRow from '@/components/finance/BillRow';
import BillAddInline from '@/components/finance/BillAddInline';
import type { MonthlyBill, RecurrenceType } from '@/types/finance';

interface BillsListProps {
  bills: MonthlyBill[];
  onTogglePaid: (id: string, paid: boolean) => void;
  readOnly: boolean;
  onAddBill: (template: {
    name: string;
    amount: number;
    due_day: number;
    recurrence_type: RecurrenceType;
    start_month: string;
  }) => Promise<void>;
  monthId: string;
}

export default function BillsList({
  bills,
  onTogglePaid,
  readOnly,
  onAddBill,
  monthId,
}: BillsListProps) {
  const sortedBills = useMemo(() => {
    // Filter out paid one-time bills
    const filtered = bills.filter(
      (b) => !(b.bill_templates?.recurrence_type === 'one_time' && b.paid === true)
    );

    // Sort: paid bills to bottom, then by urgency (overdue first, smallest daysUntil first)
    return filtered.sort((a, b) => {
      if (a.paid !== b.paid) return a.paid ? 1 : -1;
      const urgA = getDueUrgency(a.due_day);
      const urgB = getDueUrgency(b.due_day);
      return urgA.daysUntil - urgB.daysUntil;
    });
  }, [bills]);

  return (
    <div className="space-y-2">
      <h2 className="font-mono text-[0.778rem] uppercase tracking-widest text-muted-foreground">
        BILLS
      </h2>

      {sortedBills.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-foreground font-mono">No bills this month</p>
          <p className="text-muted-foreground text-[0.778rem] mt-1">
            Add your first bill to start tracking expenses.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedBills.map((bill) => (
            <BillRow
              key={bill.id}
              bill={bill}
              onTogglePaid={onTogglePaid}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}

      {!readOnly && <BillAddInline onAddBill={onAddBill} />}
    </div>
  );
}
