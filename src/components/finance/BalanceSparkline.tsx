import type { MonthSummary } from '@/types/finance';

interface BalanceSparklineProps {
  months: MonthSummary[];
}

export default function BalanceSparkline({ months }: BalanceSparklineProps) {
  const balances = months.map((m) => m.ending_balance);

  // Need at least 2 data points to draw a line
  if (balances.length < 2) return null;

  const min = Math.min(...balances);
  const max = Math.max(...balances);
  const range = max - min || 1; // Avoid division by zero

  const viewBoxWidth = 400;
  const viewBoxHeight = 48;
  const padding = 4;
  const usableWidth = viewBoxWidth - padding * 2;
  const usableHeight = viewBoxHeight - padding * 2;

  const points = balances.map((val, i) => {
    const x = padding + (i / (balances.length - 1)) * usableWidth;
    const y = padding + usableHeight - ((val - min) / range) * usableHeight;
    return `${x},${y}`;
  });

  const d = `M ${points.join(' L ')}`;

  return (
    <svg
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      className="w-full"
      style={{ height: 48 }}
      preserveAspectRatio="none"
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
