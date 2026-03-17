import { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { BarChart3 } from 'lucide-react';
import { useFinance } from '@/hooks/useFinance';
import { useBills } from '@/hooks/useBills';
import { useBalanceHistory } from '@/hooks/useBalanceHistory';
import { useOneOffIncome } from '@/hooks/useOneOffIncome';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { getCurrentMonth } from '@/lib/utils/month';
import { formatPHP } from '@/lib/utils/currency';
import MonthBarrel from '@/components/finance/MonthBarrel';
import BudgetProgressBar from '@/components/finance/BudgetProgressBar';
import BalanceDisplay from '@/components/finance/BalanceDisplay';
import BillsCard from '@/components/finance/BillsCard';
import IncomeChecklistCard from '@/components/finance/IncomeChecklistCard';
import OneOffCard from '@/components/finance/OneOffCard';
import ViewNavigator from '@/components/finance/ViewNavigator';
import BalanceHistoryModal from '@/components/finance/BalanceHistoryModal';

export default function FinancePage() {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonth());
  const [viewIndex, setViewIndex] = useState(0);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

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

  // Month mode
  const currentMonth = getCurrentMonth();
  const isPastMonth = selectedMonth < currentMonth;
  const isFutureMonth = selectedMonth > currentMonth;

  // Computed values
  const paidTotal = useMemo(
    () => bills.filter((b) => b.paid).reduce((s, b) => s + b.amount, 0),
    [bills]
  );
  const unpaidTotal = useMemo(
    () => bills.filter((b) => !b.paid).reduce((s, b) => s + b.amount, 0),
    [bills]
  );
  const totalIncome = useMemo(() => {
    return incomes.reduce((sum, i) => {
      if (i.net_php != null) return sum + i.net_php;
      if (i.currency === 'USD' && rate) return sum + i.expected_amount * rate;
      return sum + i.expected_amount;
    }, 0);
  }, [incomes, rate]);

  // Projected balance for future months
  // One-off income total
  const oneOffTotal = useMemo(
    () => oneOffEntries.reduce((sum, e) => sum + e.amount, 0),
    [oneOffEntries]
  );

  // Total income for stats (received income + one-off)
  const receivedIncome = useMemo(() => {
    return incomes.filter(i => i.received).reduce((sum, i) => {
      if (i.net_php != null) return sum + i.net_php;
      if (i.currency === 'USD' && rate) return sum + i.expected_amount * rate;
      return sum + i.expected_amount;
    }, 0);
  }, [incomes, rate]);

  const totalExpenses = paidTotal;
  const totalIncomeForStats = receivedIncome + oneOffTotal;
  const savingsRate = totalIncomeForStats > 0 ? Math.round((1 - totalExpenses / totalIncomeForStats) * 100) : 0;

  const projectedBalance = useMemo(() => {
    if (!isFutureMonth || !monthData) return 0;
    const expectedIncome = incomes.reduce((sum, i) => {
      if (i.net_php != null) return sum + i.net_php;
      if (i.currency === 'USD' && rate) return sum + i.expected_amount * rate;
      return sum + i.expected_amount;
    }, 0);
    const billsTotal = bills.reduce((sum, b) => sum + b.amount, 0);
    return monthData.starting_balance + expectedIncome - billsTotal;
  }, [isFutureMonth, monthData, incomes, bills, rate]);

  // Horizontal swipe detection for views
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const handleViewTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);
  const handleViewTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    touchStartX.current = null;
    touchStartY.current = null;
    // Only horizontal swipe if X delta dominates Y delta
    if (Math.abs(deltaX) < 50 || Math.abs(deltaY) > Math.abs(deltaX)) return;
    if (deltaX > 0 && viewIndex === 0) setViewIndex(1);
    else if (deltaX < 0 && viewIndex === 1) setViewIndex(0);
  }, [viewIndex]);

  return (
    <div className="flex flex-col h-full">
      <MonthBarrel selected={selectedMonth} onSelect={setSelectedMonth}>
        {/* Past month indicator */}
        {isPastMonth && (
          <div className="text-center text-[0.667rem] text-muted-foreground pb-2">
            Past month — read only
          </div>
        )}

        {loading ? (
          <p className="text-sm font-mono text-muted-foreground text-center py-12">Loading...</p>
        ) : error ? (
          <p className="text-sm font-mono text-destructive text-center py-12">{error}</p>
        ) : isFutureMonth ? (
          /* Future month: projected view with expected bills & income */
          <div className="flex flex-col items-center py-8 px-6 gap-8 overflow-y-auto">
            {/* Projected balance — hero */}
            <div className="text-center">
              <div className="text-[0.667rem] uppercase tracking-[0.2em] text-muted-foreground mb-2">Projected Balance</div>
              <span className="text-[3rem] font-light font-mono tabular-nums text-center">
                {formatPHP(projectedBalance)}
              </span>
            </div>

            {/* Expected sections */}
            <div className="flex gap-6 w-full max-w-3xl items-start">
              {/* Expected Bills */}
              <div className="flex-1 bg-card border border-border rounded-lg p-5">
                <h3 className="text-[0.667rem] uppercase tracking-[0.2em] text-muted-foreground font-mono mb-4">Expected Bills</h3>
                {bills.length === 0 ? (
                  <p className="text-[0.778rem] font-mono text-muted-foreground">No recurring bills</p>
                ) : (
                  <div className="space-y-0">
                    {bills.map((bill) => (
                      <div key={bill.id} className="flex items-center gap-3 py-2">
                        <span className="font-mono text-[0.833rem] flex-1 min-w-0 truncate text-muted-foreground">{bill.name}</span>
                        <span className="font-mono text-[0.833rem] tabular-nums shrink-0 text-muted-foreground">{formatPHP(bill.amount)}</span>
                      </div>
                    ))}
                    <div className="border-t border-border mt-2 pt-2 flex justify-between">
                      <span className="text-[0.667rem] uppercase tracking-[0.2em] text-muted-foreground font-mono">Total</span>
                      <span className="font-mono text-[0.833rem] tabular-nums">{formatPHP(bills.reduce((s, b) => s + b.amount, 0))}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Expected Income */}
              <div className="flex-1 bg-card border border-border rounded-lg p-5">
                <h3 className="text-[0.667rem] uppercase tracking-[0.2em] text-muted-foreground font-mono mb-4">Expected Income</h3>
                {incomes.length === 0 ? (
                  <p className="text-[0.778rem] font-mono text-muted-foreground">No income sources</p>
                ) : (
                  <div className="space-y-0">
                    {incomes.map((income) => {
                      const source = income.income_sources;
                      const displayAmount = income.currency === 'USD' && rate
                        ? formatPHP(income.expected_amount * rate)
                        : formatPHP(income.expected_amount);
                      return (
                        <div key={income.id} className="flex items-center gap-3 py-2">
                          <span className="font-mono text-[0.833rem] flex-1 min-w-0 truncate text-muted-foreground">{source?.name ?? 'Income'}</span>
                          <span className="font-mono text-[0.833rem] tabular-nums shrink-0 text-muted-foreground">{displayAmount}</span>
                        </div>
                      );
                    })}
                    <div className="border-t border-border mt-2 pt-2 flex justify-between">
                      <span className="text-[0.667rem] uppercase tracking-[0.2em] text-muted-foreground font-mono">Total</span>
                      <span className="font-mono text-[0.833rem] tabular-nums">{formatPHP(totalIncome)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Current or past: horizontal views inside month barrel */
          <div className="flex flex-col h-full">
            {/* Horizontal slide container */}
            <div
              className="flex-1 overflow-hidden"
              onTouchStart={handleViewTouchStart}
              onTouchEnd={handleViewTouchEnd}
            >
              <div
                className="flex transition-transform duration-300 h-full"
                style={{ transform: `translateX(${viewIndex * -100}%)` }}
              >
                {/* View 0: Overview */}
                <div className="w-full shrink-0 px-6 overflow-y-auto flex flex-col items-center justify-center h-full py-8">
                  <div className="max-w-[600px] w-full flex flex-col items-center gap-10">
                    <BudgetProgressBar
                      paidTotal={paidTotal}
                      unpaidTotal={unpaidTotal}
                      budgetLimit={monthData?.budget_limit ?? 0}
                      totalIncome={totalIncome}
                      onUpdateBudgetLimit={updateBudgetLimit}
                      readOnly={isPastMonth}
                    />

                    {/* Summary stats row */}
                    <div className="flex justify-between w-full max-w-lg">
                      <div className="text-center">
                        <div className="text-[0.667rem] uppercase tracking-[0.2em] text-muted-foreground">Total Income</div>
                        <div className="text-sm font-mono tabular-nums">{formatPHP(totalIncomeForStats)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[0.667rem] uppercase tracking-[0.2em] text-muted-foreground">Total Expenses</div>
                        <div className="text-sm font-mono tabular-nums">{formatPHP(totalExpenses)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[0.667rem] uppercase tracking-[0.2em] text-muted-foreground">Savings Rate</div>
                        <div className="text-sm font-mono tabular-nums">{savingsRate}%</div>
                      </div>
                    </div>

                    <BalanceDisplay
                      currentBalance={monthData?.current_balance ?? 0}
                      startingBalance={monthData?.starting_balance ?? 0}
                      lastChange={lastChange}
                      onUpdateBalance={async (newBalance) => {
                        await updateBalance(newBalance);
                        refetchHistory();
                      }}
                      onOpenHistory={() => setHistoryModalOpen(true)}
                      readOnly={isPastMonth}
                    />
                  </div>
                </div>

                {/* View 1: Cards side by side */}
                <div className="w-full shrink-0 px-6 overflow-y-auto flex flex-col items-center py-8 h-full">
                  <div className="flex gap-4 w-full max-w-4xl items-start">
                    <BillsCard
                      bills={bills}
                      onTogglePaid={togglePaid}
                      onAddBill={addBill}
                      readOnly={isPastMonth}
                    />

                    <IncomeChecklistCard
                      incomes={incomes}
                      rate={rate}
                      rateLoading={rateLoading}
                      onToggleReceived={toggleIncomeReceived}
                      readOnly={isPastMonth}
                    />

                    <OneOffCard
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
                </div>
              </div>
            </div>

            {/* View dots */}
            <ViewNavigator viewIndex={viewIndex} onChangeView={setViewIndex} />
          </div>
        )}
      </MonthBarrel>

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
