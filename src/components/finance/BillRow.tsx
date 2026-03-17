import { useState } from 'react';
import { CheckCircle2, Circle, Repeat } from 'lucide-react';
import { getDueUrgency } from '@/lib/utils/finance';
import { formatPHP } from '@/lib/utils/currency';
import type { MonthlyBill } from '@/types/finance';

interface BillRowProps {
  bill: MonthlyBill;
  onTogglePaid: (id: string, paid: boolean) => void;
  readOnly: boolean;
}

const urgencyBorderClasses: Record<string, string> = {
  normal: 'border-l-2 border-foreground/20',
  soon: 'border-l-2 border-foreground/40',
  urgent: 'border-l-3 border-foreground/70',
  overdue: 'border-l-3 border-destructive',
};

function getRecurrenceLabel(bill: MonthlyBill): string | null {
  const template = bill.bill_templates;
  if (!template) return null;
  switch (template.recurrence_type) {
    case 'one_time':
      return 'One-time';
    case 'recurring_n':
      return `Recurring - ${template.recurrence_count} total months`;
    case 'recurring_until':
      return `Recurring until ${template.recurrence_end}`;
    case 'ongoing':
      return 'Ongoing';
    default:
      return null;
  }
}

export default function BillRow({ bill, onTogglePaid, readOnly }: BillRowProps) {
  const [expanded, setExpanded] = useState(false);

  const urgency = getDueUrgency(bill.due_day);
  const isRecurring = bill.bill_templates?.recurrence_type !== 'one_time';
  const borderClass = bill.paid
    ? 'border-l-2 border-foreground/20'
    : urgencyBorderClasses[urgency.level] ?? urgencyBorderClasses.normal;

  return (
    <div
      className={`bg-card rounded-lg ${borderClass} transition-all duration-200`}
      onClick={isRecurring ? () => setExpanded((e) => !e) : undefined}
      role={isRecurring ? 'button' : undefined}
    >
      <div className="flex items-center gap-2 py-4 px-4">
        {isRecurring && (
          <Repeat size={14} className="text-muted-foreground shrink-0" />
        )}

        <span
          className={`text-base font-mono ${bill.paid ? 'line-through opacity-60' : ''}`}
        >
          {bill.name}
        </span>

        <span className="flex-1" />

        {!bill.paid && (
          <span className="text-[0.778rem] text-muted-foreground whitespace-nowrap">
            {urgency.label}
          </span>
        )}

        <span className="text-[1.333rem] font-mono tabular-nums">
          {formatPHP(bill.amount)}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!readOnly) onTogglePaid(bill.id, !bill.paid);
          }}
          disabled={readOnly}
          className="shrink-0 p-1 transition-colors hover:text-foreground disabled:opacity-40"
          aria-label={bill.paid ? 'Mark unpaid' : 'Mark paid'}
        >
          {bill.paid ? (
            <CheckCircle2 size={20} className="text-foreground" />
          ) : (
            <Circle size={20} className="text-muted-foreground" />
          )}
        </button>
      </div>

      {expanded && isRecurring && (
        <div className="px-4 pb-3 text-[0.778rem] text-muted-foreground font-mono">
          {getRecurrenceLabel(bill)}
        </div>
      )}
    </div>
  );
}
