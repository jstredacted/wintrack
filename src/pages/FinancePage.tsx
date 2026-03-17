import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { BarChart3 } from 'lucide-react';
import { useFinance } from '@/hooks/useFinance';
import { useBills } from '@/hooks/useBills';
import { useBalanceHistory } from '@/hooks/useBalanceHistory';
import { useOneOffIncome } from '@/hooks/useOneOffIncome';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { getCurrentMonth, getPrevMonth, getNextMonth } from '@/lib/utils/month';
import { formatPHP } from '@/lib/utils/currency';
import MonthStrip from '@/components/finance/MonthStrip';
import BalanceHero from '@/components/finance/BalanceHero';
import BalanceHistoryIndicator from '@/components/finance/BalanceHistoryIndicator';
import BalanceHistoryModal from '@/components/finance/BalanceHistoryModal';
import BudgetGauge from '@/components/finance/BudgetGauge';
import BillsList from '@/components/finance/BillsList';
import ExpenseGauge from '@/components/finance/ExpenseGauge';
import IncomeCard from '@/components/finance/IncomeCard';
import OneOffIncomeSection from '@/components/finance/OneOffIncomeSection';

export default function FinancePage() {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonth());
  const {
    monthData,
    incomes,
    loading,
    error,
    updateBalance,
    updateBudgetLimit,
    toggleIncomeReceived,
    refetch: refetchMonth,
  } = useFinance(selectedMonth);
  const { rate, loading: rateLoading } = useExchangeRate();
  const {
    bills,
    togglePaid,
    addBill,
  } = useBills(monthData?.id ?? null);
  const {
    changes: balanceChanges,
    lastChange,
    revertChange,
    refetch: refetchHistory,
  } = useBalanceHistory(monthData?.id ?? null);
  const {
    entries: oneOffEntries,
    addEntry: addOneOff,
    deleteEntry: deleteOneOff,
    updateEntry: updateOneOff,
  } = useOneOffIncome(monthData?.id ?? null);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Month mode determination
  const currentMonth = getCurrentMonth();
  const isCurrentMonth = selectedMonth === currentMonth;
  const isPastMonth = selectedMonth < currentMonth;
  const isFutureMonth = selectedMonth > currentMonth;

  // Generate months list: 6 months back + current + 3 months forward (10 total)
  const months = useMemo(() => {
    const current = getCurrentMonth();
    const result: string[] = [];
    // Go 6 months back
    let m = current;
    for (let i = 0; i < 6; i++) {
      m = getPrevMonth(m);
    }
    // Build forward from 6 back to current (7 entries)
    result.push(m);
    for (let i = 1; i < 7; i++) {
      m = getNextMonth(m);
      result.push(m);
    }
    // Add 3 future months
    for (let i = 0; i < 3; i++) {
      m = getNextMonth(m);
      result.push(m);
    }
    return result;
  }, []);

  // totalSpent: sum of paid bill amounts
  const totalSpent = useMemo(() => {
    return bills
      .filter((b) => b.paid)
      .reduce((sum, b) => sum + b.amount, 0);
  }, [bills]);

  // Projected balance for future months
  const projectedBalance = useMemo(() => {
    if (!isFutureMonth || !monthData) return 0;
    const expectedIncome = incomes.reduce(
      (sum, i) => sum + (i.net_php ?? i.expected_amount),
      0
    );
    const recurringBillsTotal = bills.reduce((sum, b) => sum + b.amount, 0);
    return monthData.starting_balance + expectedIncome - recurringBillsTotal;
  }, [isFutureMonth, monthData, incomes, bills]);

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
      <div className="max-w-[1100px] mx-auto px-8 py-12">
        {loading ? (
          <p className="text-sm font-mono text-muted-foreground text-center">
            Loading...
          </p>
        ) : error ? (
          <p className="text-sm font-mono text-destructive text-center">
            {error}
          </p>
        ) : isFutureMonth ? (
          /* Future month: projected balance only */
          <div className="flex flex-col items-center py-12">
            <span className="text-[2.667rem] font-light font-mono tabular-nums text-center">
              {formatPHP(projectedBalance)}
            </span>
            <span className="text-[0.778rem] text-muted-foreground text-center mt-2">
              Projected balance based on expected income and recurring bills
            </span>
          </div>
        ) : (
          /* Current or past month: two-column layout */
          <div className="flex gap-8">
            {/* Left column */}
            <div className="flex-1 space-y-6 min-w-0">
              <BalanceHero
                balance={monthData?.current_balance ?? 0}
                onUpdateBalance={async (newBalance) => {
                  await updateBalance(newBalance);
                  refetchHistory();
                }}
                readOnly={isPastMonth}
              />

              <BalanceHistoryIndicator
                lastChange={lastChange}
                onClick={() => setHistoryModalOpen(true)}
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

              <BillsList
                bills={bills}
                onTogglePaid={togglePaid}
                readOnly={isPastMonth}
                onAddBill={addBill}
                monthId={monthData?.id ?? ''}
              />

              <OneOffIncomeSection
                entries={oneOffEntries}
                onAdd={async (amount, date, note) => {
                  await addOneOff(amount, date, note);
                  refetchMonth();
                }}
                onDelete={async (id) => {
                  await deleteOneOff(id);
                  refetchMonth();
                }}
                onUpdate={async (id, fields) => {
                  await updateOneOff(id, fields);
                  refetchMonth();
                }}
                readOnly={isPastMonth}
              />
            </div>

            {/* Right column - sticky gauges */}
            <div className="w-80 shrink-0 hidden md:block">
              <div className="sticky top-4 space-y-6">
                <BudgetGauge
                  spent={totalSpent}
                  limit={monthData?.budget_limit ?? 0}
                  onUpdateLimit={updateBudgetLimit}
                  readOnly={isPastMonth}
                  size={200}
                />
                <ExpenseGauge bills={bills} size={200} />
              </div>
            </div>
          </div>
        )}
      </div>

      <BalanceHistoryModal
        changes={balanceChanges}
        onRevert={async (id) => {
          await revertChange(id);
          refetchHistory();
          refetchMonth();
        }}
        onClose={() => setHistoryModalOpen(false)}
        open={historyModalOpen}
      />

      {/* Year overview FAB */}
      <button
        type="button"
        onClick={() => navigate('/finance/year')}
        aria-label="Year overview"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg hover:opacity-80 transition-opacity active:scale-95"
      >
        <BarChart3 size={22} />
      </button>
    </div>
  );
}
