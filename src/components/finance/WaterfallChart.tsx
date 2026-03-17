import { useMemo } from 'react';
import { buildWaterfallSteps } from '@/lib/utils/finance';
import { formatPHP } from '@/lib/utils/currency';
import type { MonthlyBill } from '@/types/finance';

interface WaterfallChartProps {
  startingBalance: number;
  bills: MonthlyBill[];
  isPastMonth?: boolean;
}

const CHART_HEIGHT = 200;
const PAD_TOP = 24;
const PAD_BOTTOM = 44;
const PAD_LEFT = 64;
const PAD_RIGHT = 16;
const PLOT_HEIGHT = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '\u2026' : s;
}

export default function WaterfallChart({
  startingBalance,
  bills,
  isPastMonth = false,
}: WaterfallChartProps) {
  const steps = useMemo(
    () =>
      buildWaterfallSteps(
        startingBalance,
        bills.map((b) => ({
          name: b.name,
          amount: b.amount,
          due_day: b.due_day,
          paid: b.paid,
        }))
      ),
    [startingBalance, bills]
  );

  if (steps.length === 0) return null;

  // Y-axis domain
  const allBalances = [startingBalance, ...steps.map((s) => s.balanceAfter)];
  const maxBalance = Math.max(...allBalances);
  const minBalance = Math.min(0, ...allBalances);
  const range = maxBalance - minBalance || 1;

  // X-axis: equal segments for starting point + each step
  const totalSegments = steps.length + 1;
  const plotWidth = 800 - PAD_LEFT - PAD_RIGHT;
  const segmentWidth = plotWidth / totalSegments;

  function yPos(balance: number): number {
    return PAD_TOP + PLOT_HEIGHT * (1 - (balance - minBalance) / range);
  }

  function xPos(index: number): number {
    return PAD_LEFT + index * segmentWidth;
  }

  // Build path segments
  const pathSegments: { d: string; paid: boolean }[] = [];
  let prevBalance = startingBalance;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const x1 = xPos(i) + segmentWidth * 0.5;
    const x2 = xPos(i + 1) + segmentWidth * 0.5;
    const y1 = yPos(prevBalance);
    const y2 = yPos(step.balanceAfter);

    // Horizontal at previous level, vertical drop, horizontal at new level
    const d = `M ${x1} ${y1} L ${x2 - segmentWidth * 0.15} ${y1} L ${x2 - segmentWidth * 0.15} ${y2} L ${x2} ${y2}`;
    pathSegments.push({ d, paid: isPastMonth || step.paid });
    prevBalance = step.balanceAfter;
  }

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 800 ${CHART_HEIGHT}`}
        width="100%"
        height={CHART_HEIGHT}
        className="overflow-visible"
        aria-label="Balance waterfall chart"
      >
        {/* Y-axis labels */}
        <text
          x={PAD_LEFT - 8}
          y={yPos(startingBalance) + 4}
          textAnchor="end"
          className="text-[11px] font-mono fill-current opacity-50"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {formatPHP(startingBalance)}
        </text>
        <text
          x={PAD_LEFT - 8}
          y={yPos(steps[steps.length - 1].balanceAfter) + 4}
          textAnchor="end"
          className="text-[11px] font-mono fill-current opacity-50"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {formatPHP(steps[steps.length - 1].balanceAfter)}
        </text>

        {/* Starting balance horizontal line */}
        <line
          x1={xPos(0)}
          y1={yPos(startingBalance)}
          x2={xPos(0) + segmentWidth * 0.5}
          y2={yPos(startingBalance)}
          stroke="currentColor"
          strokeWidth={2}
        />

        {/* Step segments */}
        {pathSegments.map((seg, i) => (
          <path
            key={i}
            d={seg.d}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            opacity={seg.paid ? 1 : 0.3}
            strokeDasharray={seg.paid ? 'none' : '4 4'}
          />
        ))}

        {/* Step anchor circles */}
        {steps.map((step, i) => (
          <circle
            key={i}
            cx={xPos(i + 1) + segmentWidth * 0.5}
            cy={yPos(step.balanceAfter)}
            r={3}
            fill="currentColor"
            opacity={isPastMonth || step.paid ? 1 : 0.3}
          />
        ))}

        {/* X-axis bill name labels */}
        {steps.map((step, i) => (
          <text
            key={i}
            x={xPos(i + 1) + segmentWidth * 0.5}
            y={CHART_HEIGHT - 8}
            textAnchor="middle"
            className="text-[11px] font-mono fill-current opacity-50"
          >
            {truncate(step.name, 8)}
          </text>
        ))}
      </svg>
    </div>
  );
}
