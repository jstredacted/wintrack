import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle2, Circle, Plus } from 'lucide-react';
import {
  formatPHP,
  formatUSD,
  calculateWiseNetPHP,
  calculatePayPalNetPHP,
} from '@/lib/utils/currency';
import type { MonthlyIncome, IncomeSource } from '@/types/finance';

type IncomeWithSource = MonthlyIncome & { income_sources?: IncomeSource };

interface IncomeChecklistCardProps {
  incomes: IncomeWithSource[];
  rate: number | null;
  rateLoading: boolean;
  onToggleReceived: (
    id: string,
    received: boolean,
    netPhp?: number,
    exchangeRate?: number,
    feeAmount?: number
  ) => Promise<void>;
  readOnly: boolean;
  className?: string;
}

export default function IncomeChecklistCard({
  incomes,
  rate,
  rateLoading,
  onToggleReceived,
  readOnly,
  className,
}: IncomeChecklistCardProps) {
  const navigate = useNavigate();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggle = async (income: IncomeWithSource) => {
    if (readOnly || togglingId) return;

    setTogglingId(income.id);
    try {
      if (income.received) {
        await onToggleReceived(income.id, false);
      } else {
        const isUSD = income.currency === 'USD';
        const isWise = income.conversion_method === 'wise';
        const isPayPal = income.conversion_method === 'paypal';

        if (isUSD && rate) {
          if (isWise) {
            const r = calculateWiseNetPHP(income.expected_amount, rate);
            await onToggleReceived(income.id, true, r.netPHP, rate, r.fee);
          } else if (isPayPal) {
            const r = calculatePayPalNetPHP(income.expected_amount, rate);
            await onToggleReceived(income.id, true, r.netPHP, rate, r.fee);
          } else {
            await onToggleReceived(income.id, true, income.expected_amount * rate, rate);
          }
        } else {
          await onToggleReceived(income.id, true, income.expected_amount);
        }
      }
    } finally {
      setTogglingId(null);
    }
  };

  const getDisplayAmount = (income: IncomeWithSource): string => {
    if (income.received && income.net_php != null) return formatPHP(income.net_php);
    const isUSD = income.currency === 'USD';
    if (isUSD && rate) {
      const isWise = income.conversion_method === 'wise';
      const isPayPal = income.conversion_method === 'paypal';
      if (isWise) return formatPHP(calculateWiseNetPHP(income.expected_amount, rate).netPHP);
      if (isPayPal) return formatPHP(calculatePayPalNetPHP(income.expected_amount, rate).netPHP);
      return formatPHP(income.expected_amount * rate);
    }
    if (isUSD) return formatUSD(income.expected_amount);
    return formatPHP(income.expected_amount);
  };

  return (
    <div className={`bg-card border border-border rounded-lg p-5 flex flex-col min-w-0 ${className ?? ''}`}>
      {/* Card header */}
      <h3 className="font-mono text-[0.778rem] uppercase tracking-widest text-muted-foreground mb-4 shrink-0">
        Income
      </h3>

      {/* Content */}
      <div>
        <div className="space-y-0">
          {incomes.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-[0.778rem] font-mono text-muted-foreground">
                No income sources
              </span>
            </div>
          ) : (
            incomes.map((income) => {
              const source = income.income_sources;
              const isToggling = togglingId === income.id;
              const isUSD = income.currency === 'USD';

              return (
                <button
                  key={income.id}
                  type="button"
                  onClick={() => handleToggle(income)}
                  disabled={readOnly || isToggling || (isUSD && rateLoading && !income.received)}
                  className={`flex items-center gap-3 w-full text-left py-3 transition-opacity ${
                    income.received ? 'opacity-60' : ''
                  } ${isToggling ? 'opacity-30' : ''} disabled:cursor-default`}
                >
                  {income.received ? (
                    <CheckCircle2 size={16} className="text-foreground shrink-0" />
                  ) : (
                    <Circle size={16} className="text-muted-foreground/30 shrink-0" />
                  )}
                  <span className={`font-mono text-[0.833rem] flex-1 min-w-0 ${income.received ? 'line-through' : ''}`}>
                    {source?.name ?? 'Income'}
                  </span>
                  <span className={`font-mono text-[0.833rem] tabular-nums shrink-0 ${income.received ? 'line-through' : ''}`}>
                    {getDisplayAmount(income)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Settings link */}
      {!readOnly && (
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="flex items-center gap-1 text-[0.667rem] font-mono text-muted-foreground hover:text-foreground transition-colors mt-4 shrink-0"
        >
          <Plus size={12} />
          <span>Manage in Settings</span>
        </button>
      )}
    </div>
  );
}
