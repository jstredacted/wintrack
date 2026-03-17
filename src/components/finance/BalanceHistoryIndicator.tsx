import { formatPHP } from '@/lib/utils/currency';
import type { BalanceChange } from '@/types/finance';

interface BalanceHistoryIndicatorProps {
  lastChange: BalanceChange | null;
  onClick: () => void;
}

export default function BalanceHistoryIndicator({ lastChange, onClick }: BalanceHistoryIndicatorProps) {
  if (!lastChange) return null;

  const sign = lastChange.delta > 0 ? '+' : '';

  return (
    <div className="text-center cursor-pointer" onClick={onClick}>
      <p className="text-[0.778rem] text-muted-foreground font-mono">
        {sign}{formatPHP(lastChange.delta)} from last change
      </p>
    </div>
  );
}
