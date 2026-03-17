export type UrgencyLevel = 'overdue' | 'urgent' | 'soon' | 'normal';

export interface DueUrgency {
  level: UrgencyLevel;
  label: string;
  daysUntil: number;
}

/**
 * Calculate due date urgency for a bill.
 * @param dueDay - Day of month (1-31)
 * @param today - Current date (defaults to new Date())
 */
export function getDueUrgency(dueDay: number, today: Date = new Date()): DueUrgency {
  const currentDay = today.getDate();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const effectiveDueDay = Math.min(dueDay, lastDayOfMonth);
  const daysUntil = effectiveDueDay - currentDay;

  if (daysUntil < 0) return { level: 'overdue', label: 'Overdue', daysUntil };
  if (daysUntil === 0) return { level: 'urgent', label: 'Due today', daysUntil: 0 };
  if (daysUntil <= 3) return { level: 'urgent', label: `Due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`, daysUntil };
  if (daysUntil <= 6) return { level: 'soon', label: `Due in ${daysUntil} days`, daysUntil };
  return { level: 'normal', label: `Due ${effectiveDueDay}${getOrdinal(effectiveDueDay)}`, daysUntil };
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export interface WaterfallStep {
  name: string;
  amount: number;
  paid: boolean;
  balanceAfter: number;
}

export function buildWaterfallSteps(
  startingBalance: number,
  bills: { name: string; amount: number; due_day: number; paid: boolean }[]
): WaterfallStep[] {
  let balance = startingBalance;
  return [...bills]
    .sort((a, b) => a.due_day - b.due_day)
    .map((bill) => {
      balance -= bill.amount;
      return { name: bill.name, amount: bill.amount, paid: bill.paid, balanceAfter: balance };
    });
}
