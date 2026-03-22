import { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
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
import BalanceHistoryModal from '@/components/finance/BalanceHistoryModal';

export default function FinancePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const fromUrl = searchParams.get('month');
    return fromUrl && /^\d{4}-\d{2}$/.test(fromUrl) ? fromUrl : getCurrentMonth();
  });
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
  const { rate, loading: rateLoading, fetchFreshRate } = useExchangeRate();
  const {
    bills,
    togglePaid,
    addBill,
    deleteBill,
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

  const totalExpenses = bills.reduce((sum, b) => sum + Number(b.amount), 0);
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
    <>
      <MonthBarrel selected={selectedMonth} onSelect={setSelectedMonth}>
        {/* Past month indicator */}
        {isPastMonth && (
          <div className="text-center text-xs text-muted-foreground pb-2 mt-4">
            Past month — read only
          </div>
        )}

        {loading ? (
          <p className="text-sm font-mono text-muted-foreground text-center py-12">Loading...</p>
        ) : error ? (
          <p className="text-sm font-mono text-destructive text-center py-12">{error}</p>
        ) : isFutureMonth ? (
          /* Future month: projected view */
          <div className="w-full max-w-[1000px] mx-auto relative p-4 sm:p-8 mt-6">
            <div className="flex flex-col items-center gap-8">
              {/* Projected balance — hero */}
              <div className="text-center">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Projected Balance</div>
                <span className="text-[3rem] font-light font-mono tabular-nums text-center">
                  {formatPHP(projectedBalance)}
                </span>
              </div>

              {/* Expected sections */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full items-start">
                {/* Expected Bills */}
                <div className="bg-card border border-border rounded-lg p-5">
                  <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono mb-4">Expected Bills</h3>
                  {bills.length === 0 ? (
                    <p className="text-[0.778rem] font-mono text-muted-foreground">No recurring bills</p>
                  ) : (
                    <div className="space-y-0">
                      {bills.map((bill) => (
                        <div key={bill.id} className="flex items-center gap-3 py-2">
                          <span className="font-mono text-[0.833rem] flex-1 min-w-0 text-muted-foreground">{bill.name}</span>
                          <span className="font-mono text-[0.833rem] tabular-nums shrink-0 text-muted-foreground">{formatPHP(bill.amount)}</span>
                        </div>
                      ))}
                      <div className="border-t border-border mt-2 pt-2 flex justify-between">
                        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">Total</span>
                        <span className="font-mono text-[0.833rem] tabular-nums">{formatPHP(bills.reduce((s, b) => s + b.amount, 0))}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expected Income */}
                <div className="bg-card border border-border rounded-lg p-5">
                  <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono mb-4">Expected Income</h3>
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
                            <span className="font-mono text-[0.833rem] flex-1 min-w-0 text-muted-foreground">{source?.name ?? 'Income'}</span>
                            <span className="font-mono text-[0.833rem] tabular-nums shrink-0 text-muted-foreground">{displayAmount}</span>
                          </div>
                        );
                      })}
                      <div className="border-t border-border mt-2 pt-2 flex justify-between">
                        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">Total</span>
                        <span className="font-mono text-[0.833rem] tabular-nums">{formatPHP(totalIncome)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Current or past: horizontal views in centered container */
          <div
            className="mt-6"
            onTouchStart={handleViewTouchStart}
            onTouchEnd={handleViewTouchEnd}
          >
            <div className="w-full max-w-[1000px] mx-auto relative overflow-hidden bg-card/50 border border-border/30 rounded-2xl">
              {/* Left arrow (only on View 1) */}
              {viewIndex === 1 && (
                <button
                  type="button"
                  onClick={() => setViewIndex(0)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Overview"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              {/* Right arrow (only on View 0) */}
              {viewIndex === 0 && (
                <button
                  type="button"
                  onClick={() => setViewIndex(1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Cards"
                >
                  <ChevronRight size={20} />
                </button>
              )}

              {/* Horizontal slide */}
              <div
                className="flex transition-transform duration-300"
                style={{ transform: `translateX(${viewIndex * -100}%)` }}
              >
                {/* View 0: Overview */}
                <div className="w-full shrink-0 p-4 sm:p-8 flex flex-col items-center gap-8">
                  {/* Budget bar — full width inside container */}
                  <div className="w-full">
                    <BudgetProgressBar
                      paidTotal={paidTotal}
                      unpaidTotal={unpaidTotal}
                      budgetLimit={monthData?.budget_limit ?? 0}
                      totalIncome={totalIncome}
                      onUpdateBudgetLimit={updateBudgetLimit}
                      readOnly={isPastMonth}
                    />
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-lg px-4">
                    <div className="text-center">
                      <div className="text-[10px] sm:text-xs uppercase tracking-[0.1em] sm:tracking-[0.15em] text-muted-foreground font-mono">Total Income</div>
                      <div className="text-sm sm:text-base font-mono tabular-nums">{formatPHP(totalIncomeForStats)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] sm:text-xs uppercase tracking-[0.1em] sm:tracking-[0.15em] text-muted-foreground font-mono">Total Expenses</div>
                      <div className="text-sm sm:text-base font-mono tabular-nums">{formatPHP(totalExpenses)}</div>
                    </div>
                    <div className="text-center col-span-2 sm:col-span-1">
                      <div className="text-[10px] sm:text-xs uppercase tracking-[0.1em] sm:tracking-[0.15em] text-muted-foreground font-mono">Savings Rate</div>
                      <div className="text-sm sm:text-base font-mono tabular-nums">{savingsRate}%</div>
                    </div>
                  </div>

                  {/* Hero balance */}
                  <div>
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

                {/* View 1: Cards */}
                <div className="w-full shrink-0 p-4 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                  <BillsCard
                    bills={bills}
                    onTogglePaid={togglePaid}
                    onAddBill={addBill}
                    onDeleteBill={deleteBill}
                    readOnly={isPastMonth}
                    className="w-full"
                  />

                  <IncomeChecklistCard
                    incomes={incomes}
                    rate={rate}
                    rateLoading={rateLoading}
                    fetchFreshRate={fetchFreshRate}
                    onToggleReceived={toggleIncomeReceived}
                    readOnly={isPastMonth}
                    className="w-full"
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
                    className="w-full"
                  />
                </div>
              </div>

              {/* Dot indicators at bottom of container */}
              <div className="flex items-center justify-center gap-2 pb-4">
                {[0, 1].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setViewIndex(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      viewIndex === i
                        ? 'bg-foreground'
                        : 'bg-foreground/20 hover:bg-foreground/40'
                    }`}
                    aria-label={i === 0 ? 'Overview' : 'Cards'}
                  />
                ))}
              </div>
            </div>
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
    </>
  );
}
