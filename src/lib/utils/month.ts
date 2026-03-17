/**
 * Month string format: "YYYY-MM" (e.g., "2026-03")
 */

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
});

/** Returns current month as "YYYY-MM" */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Returns human-readable label like "Mar 2026" */
export function getMonthLabel(monthStr: string): string {
  const date = parseMonth(monthStr);
  const abbr = MONTH_LABEL_FORMATTER.format(date);
  return `${abbr} ${date.getFullYear()}`;
}

/** Parses "YYYY-MM" into a Date object (1st of that month) */
export function parseMonth(monthStr: string): Date {
  const [year, month] = monthStr.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

/** Returns previous month string, handling year rollover */
export function getPrevMonth(monthStr: string): string {
  const { year, month } = getMonthYear(monthStr);
  if (month === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${String(month - 1).padStart(2, '0')}`;
}

/** Returns next month string, handling year rollover */
export function getNextMonth(monthStr: string): string {
  const { year, month } = getMonthYear(monthStr);
  if (month === 12) {
    return `${year + 1}-01`;
  }
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/** Parses "YYYY-MM" into { year, month } (month is 1-indexed) */
export function getMonthYear(monthStr: string): { year: number; month: number } {
  const [year, month] = monthStr.split('-').map(Number);
  return { year, month };
}
