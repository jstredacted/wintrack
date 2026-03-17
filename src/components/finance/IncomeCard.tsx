import { useState } from 'react';
import {
  formatPHP,
  formatUSD,
  calculateWiseNetPHP,
  calculatePayPalNetPHP,
} from '@/lib/utils/currency';
import type { MonthlyIncome, IncomeSource } from '@/types/finance';

interface IncomeCardProps {
  income: MonthlyIncome & { income_sources?: IncomeSource };
  rate: number | null;
  rateLoading: boolean;
  onToggleReceived: (
    id: string,
    received: boolean,
    netPhp?: number,
    exchangeRate?: number,
    feeAmount?: number
  ) => Promise<void>;
  readOnly?: boolean;
}

export default function IncomeCard({
  income,
  rate,
  rateLoading,
  onToggleReceived,
  readOnly,
}: IncomeCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [toggling, setToggling] = useState(false);

  const source = income.income_sources;
  const isUSD = income.currency === 'USD';
  const isWise = income.conversion_method === 'wise';
  const isPayPal = income.conversion_method === 'paypal';

  // Calculate expected PHP for USD sources
  const getExpectedPHP = (): number => {
    if (!isUSD || !rate) return income.expected_amount;
    if (isWise) return calculateWiseNetPHP(income.expected_amount, rate).netPHP;
    if (isPayPal) return calculatePayPalNetPHP(income.expected_amount, rate).netPHP;
    return income.expected_amount * rate;
  };

  const getFeeBreakdown = () => {
    if (!isUSD || !rate) return null;
    if (isWise) {
      const result = calculateWiseNetPHP(income.expected_amount, rate);
      return { fee: result.fee, netPHP: result.netPHP };
    }
    if (isPayPal) {
      const result = calculatePayPalNetPHP(income.expected_amount, rate);
      return { fee: result.fee, netPHP: result.netPHP };
    }
    return null;
  };

  const handleMarkReceived = async () => {
    setToggling(true);
    try {
      if (isUSD && rate) {
        const breakdown = getFeeBreakdown();
        if (breakdown) {
          await onToggleReceived(income.id, true, breakdown.netPHP, rate, breakdown.fee);
        }
      } else {
        await onToggleReceived(income.id, true, income.expected_amount);
      }
    } finally {
      setToggling(false);
    }
  };

  const handleUndo = async () => {
    setToggling(true);
    try {
      await onToggleReceived(income.id, false);
    } finally {
      setToggling(false);
    }
  };

  // Received state - collapsed
  if (income.received) {
    return (
      <div
        className="bg-card border border-border rounded-[var(--radius)] opacity-60 transition-all duration-200"
      >
        <div className="flex items-center justify-between p-4">
          <span className="text-muted-foreground font-mono">
            {source?.name ?? 'Income'}: {formatPHP(income.net_php ?? income.expected_amount)} received
          </span>
          {!readOnly && (
            <button
              onClick={handleUndo}
              disabled={toggling}
              className="text-foreground underline hover:no-underline text-[0.778rem]"
            >
              Undo
            </button>
          )}
        </div>
      </div>
    );
  }

  // Unreceived state - full card
  const expectedPHP = getExpectedPHP();
  const breakdown = getFeeBreakdown();

  const buttonDisabled = toggling || (isUSD && rateLoading) || (isUSD && !rate);
  let buttonText = 'Mark Received';
  if (isUSD && rateLoading) buttonText = 'Fetching rate...';
  if (isUSD && !rateLoading && !rate) buttonText = 'Rate unavailable \u2014 retry';

  return (
    <div className="bg-card border border-border rounded-[var(--radius)] p-4 transition-all duration-200">
      <div className="flex flex-col gap-2">
        {/* Row 1: Source name + payday */}
        <div className="flex items-center justify-between">
          <span className="text-foreground font-mono">{source?.name ?? 'Income'}</span>
          {source?.payday_day && (
            <span className="text-muted-foreground text-[0.778rem]">
              Day {source.payday_day}
            </span>
          )}
        </div>

        {/* Row 2: Expected PHP amount */}
        <div className="text-[1.333rem] font-mono tabular-nums font-light text-foreground">
          {isUSD && !rate && !rateLoading
            ? formatUSD(income.expected_amount)
            : formatPHP(expectedPHP)}
        </div>

        {/* Row 3: USD fee details */}
        {isUSD && rate && (
          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-[0.778rem] text-muted-foreground hover:text-foreground transition-colors"
            >
              {showDetails ? 'Hide details' : 'Show details'}
            </button>

            {!showDetails && (
              <p className="text-[0.778rem] text-muted-foreground">
                {formatUSD(income.expected_amount)} at {rate?.toFixed(2)}
              </p>
            )}

            {showDetails && breakdown && (
              <div className="mt-2 space-y-0">
                <div className="flex items-center justify-between py-1.5 border-t border-border">
                  <span className="text-muted-foreground text-[0.778rem]">USD amount</span>
                  <span className="text-foreground tabular-nums text-[0.778rem]">
                    {formatUSD(income.expected_amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-t border-border">
                  <span className="text-muted-foreground text-[0.778rem]">Exchange rate</span>
                  <span className="text-foreground tabular-nums text-[0.778rem]">
                    {rate?.toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-t border-border">
                  <span className="text-muted-foreground text-[0.778rem]">Fee deducted</span>
                  <span className="text-foreground tabular-nums text-[0.778rem]">
                    {isWise ? formatUSD(breakdown.fee) : formatPHP(breakdown.fee)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-t border-border">
                  <span className="text-muted-foreground text-[0.778rem]">Net PHP</span>
                  <span className="text-foreground tabular-nums text-[0.778rem]">
                    {formatPHP(breakdown.netPHP)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Toggle button */}
        {!readOnly && (
          <button
            onClick={handleMarkReceived}
            disabled={buttonDisabled}
            className={[
              'w-full border border-border rounded-[var(--radius)] py-3 text-foreground hover:bg-foreground/5 active:scale-[0.98] transition-all',
              isUSD && rateLoading ? 'opacity-50' : '',
              isUSD && !rateLoading && !rate ? 'text-destructive' : '',
              toggling ? 'opacity-50' : '',
            ].join(' ')}
          >
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
}
