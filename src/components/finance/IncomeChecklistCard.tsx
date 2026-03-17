import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Check, Circle, Plus } from 'lucide-react';
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
}

export default function IncomeChecklistCard({
  incomes,
  rate,
  rateLoading,
  onToggleReceived,
  readOnly,
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
    <div className="bg-card border border-border rounded-lg p-4 flex-1 flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-mono text-[0.778rem] uppercase tracking-widest text-muted-foreground">
          Income
        </h3>
      </div>

      {/* Income rows */}
      <div className="flex-1 space-y-1 overflow-y-auto">
        {incomes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
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
                className={`flex items-center gap-2 py-1.5 w-full text-left transition-opacity ${
                  income.received ? 'opacity-50' : ''
                } ${isToggling ? 'opacity-40' : ''} disabled:cursor-default`}
              >
                {income.received ? (
                  <Check size={14} className="text-foreground shrink-0" />
                ) : (
                  <Circle size={14} className="text-muted-foreground shrink-0" />
                )}
                <span className="font-mono text-[0.778rem] flex-1 min-w-0 truncate">
                  {source?.name ?? 'Income'}
                </span>
                <span className="font-mono text-[0.778rem] tabular-nums shrink-0">
                  {getDisplayAmount(income)}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Add link to settings */}
      {!readOnly && (
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="flex items-center gap-1 text-[0.667rem] font-mono text-muted-foreground hover:text-foreground transition-colors mt-2 pt-2 border-t border-border"
        >
          <Plus size={12} />
          <span>Configure in Settings</span>
        </button>
      )}
    </div>
  );
}
