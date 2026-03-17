import { formatPHP } from '@/lib/utils/currency';
import type { MonthlyBill } from '@/types/finance';

interface ExpenseGaugeProps {
  bills: MonthlyBill[];
  size?: number;
  strokeWidth?: number;
}

export default function ExpenseGauge({
  bills,
  size = 160,
  strokeWidth = 12,
}: ExpenseGaugeProps) {
  const totalBills = bills.length;
  const paidBills = bills.filter((b) => b.paid).length;
  const totalAmount = bills.reduce((s, b) => s + b.amount, 0);
  const paidAmount = bills.filter((b) => b.paid).reduce((s, b) => s + b.amount, 0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalBills > 0 ? paidBills / totalBills : 0;
  const dashOffset = circumference * (1 - progress);

  const ringOpacity = progress < 0.5 ? 0.3 : progress < 0.8 ? 0.55 : 1.0;

  const cx = size / 2;
  const cy = size / 2;

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
          {totalBills > 0 && (
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
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {totalBills > 0 ? (
            <>
              <span className="text-[1.333rem] font-mono tabular-nums font-light text-foreground">
                {formatPHP(paidAmount)}
              </span>
              <span className="text-[0.778rem] text-muted-foreground font-mono">
                of {formatPHP(totalAmount)}
              </span>
              <span className="text-[0.667rem] text-muted-foreground font-mono mt-0.5">
                {paidBills}/{totalBills} paid
              </span>
            </>
          ) : (
            <span className="text-[0.778rem] text-muted-foreground font-mono">
              No bills
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
