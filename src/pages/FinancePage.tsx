import { useState, useMemo } from 'react';
import { useFinance } from '@/hooks/useFinance';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { getCurrentMonth, getPrevMonth } from '@/lib/utils/month';
import MonthStrip from '@/components/finance/MonthStrip';
import BalanceHero from '@/components/finance/BalanceHero';
import BudgetGauge from '@/components/finance/BudgetGauge';
import IncomeCard from '@/components/finance/IncomeCard';

export default function FinancePage() {
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonth());
  const {
    monthData,
    incomes,
    loading,
    error,
    updateBalance,
    updateBudgetLimit,
    toggleIncomeReceived,
  } = useFinance(selectedMonth);
  const { rate, loading: rateLoading } = useExchangeRate();

  const isCurrentMonth = selectedMonth === getCurrentMonth();
  const isPastMonth = !isCurrentMonth;

  // Generate months list: 6 months back from current month + current month
  const months = useMemo(() => {
    const current = getCurrentMonth();
    const result: string[] = [];
    let m = current;
    for (let i = 0; i < 6; i++) {
      m = getPrevMonth(m);
    }
    // Now m is 6 months before current. Build forward.
    for (let i = 0; i < 7; i++) {
      if (i === 0) {
        result.push(m);
      } else {
        // Advance one month
        const [y, mo] = result[result.length - 1].split('-').map(Number);
        const nextMonth = mo === 12 ? 1 : mo + 1;
        const nextYear = mo === 12 ? y + 1 : y;
        result.push(`${nextYear}-${String(nextMonth).padStart(2, '0')}`);
      }
    }
    return result;
  }, []);

  // Calculate totalSpent: starting_balance + total received income - current_balance
  const totalIncomeReceived = useMemo(() => {
    return incomes
      .filter((i) => i.received)
      .reduce((sum, i) => sum + (i.net_php ?? i.expected_amount), 0);
  }, [incomes]);

  const totalSpent = useMemo(() => {
    if (!monthData) return 0;
    return Math.max(
      0,
      monthData.starting_balance + totalIncomeReceived - monthData.current_balance
    );
  }, [monthData, totalIncomeReceived]);

  return (
    <div>
      {/* MonthStrip - full width */}
      <MonthStrip
        months={months}
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
      />

      {/* Past month indicator */}
      {isPastMonth && (
        <div className="text-center text-[0.778rem] text-muted-foreground py-2">
          Past month — read only
        </div>
      )}

      {/* Content area */}
      <div className="max-w-[1100px] mx-auto px-8 py-12 space-y-6">
        {loading ? (
          <p className="text-sm font-mono text-muted-foreground text-center">
            Loading...
          </p>
        ) : error ? (
          <p className="text-sm font-mono text-destructive text-center">
            {error}
          </p>
        ) : (
          <>
            <BalanceHero
              balance={monthData?.current_balance ?? 0}
              onUpdateBalance={updateBalance}
              readOnly={false}
            />

            <BudgetGauge
              spent={totalSpent}
              limit={monthData?.budget_limit ?? 0}
              onUpdateLimit={updateBudgetLimit}
              readOnly={isPastMonth}
            />

            <div className="space-y-2">
              <h2 className="font-mono text-[0.778rem] uppercase tracking-widest text-muted-foreground">
                INCOME
              </h2>
              {incomes.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-foreground font-mono">No income sources</p>
                  <p className="text-muted-foreground text-[0.778rem] mt-1">
                    Add your first income source in Settings to start tracking.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                {incomes.map((income) => (
                  <IncomeCard
                    key={income.id}
                    income={income}
                    rate={rate}
                    rateLoading={rateLoading}
                    onToggleReceived={toggleIncomeReceived}
                    readOnly={isPastMonth}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
