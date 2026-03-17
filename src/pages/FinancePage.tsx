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
          /* Future month: projected view only */
          <div className="flex flex-col items-center py-12 px-6">
            <span className="text-[2.667rem] font-light font-mono tabular-nums text-center">
              {formatPHP(projectedBalance)}
            </span>
            <span className="text-[0.778rem] text-muted-foreground text-center mt-2">
              Projected balance based on expected income and recurring bills
            </span>
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
                <div className="w-full shrink-0 px-6 overflow-y-auto">
                  <div className="max-w-[600px] mx-auto space-y-6 pb-8">
                    <BudgetProgressBar
                      paidTotal={paidTotal}
                      unpaidTotal={unpaidTotal}
                      budgetLimit={monthData?.budget_limit ?? 0}
                      totalIncome={totalIncome}
                      onUpdateBudgetLimit={updateBudgetLimit}
                      readOnly={isPastMonth}
                    />
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

                {/* View 1: Cards (borderless sections) */}
                <div className="w-full shrink-0 px-6 overflow-y-auto">
                  <div className="max-w-[600px] mx-auto space-y-8 pb-8">
                    <BillsCard
                      bills={bills}
                      onTogglePaid={togglePaid}
                      onAddBill={addBill}
                      readOnly={isPastMonth}
                    />

                    <div className="border-t border-foreground/10" />

                    <IncomeChecklistCard
                      incomes={incomes}
                      rate={rate}
                      rateLoading={rateLoading}
                      onToggleReceived={toggleIncomeReceived}
                      readOnly={isPastMonth}
                    />

                    <div className="border-t border-foreground/10" />

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
