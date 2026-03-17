import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import { useYearOverview } from '@/hooks/useYearOverview';
import { formatPHP } from '@/lib/utils/currency';
import YearGrid from '@/components/finance/YearGrid';
import BalanceSparkline from '@/components/finance/BalanceSparkline';

export default function YearOverviewPage() {
  const navigate = useNavigate();
  const [year] = useState(() => new Date().getFullYear());
  const { months, loading, error } = useYearOverview(year);

  const summary = useMemo(() => {
    // Only include months that have actual activity (income received or bills paid)
    const activeMonths = months.filter(
      (m) => Number(m.total_income) > 0 || Number(m.total_expenses) > 0 || Number(m.total_oneoff) > 0
    );
    const totalIncome = activeMonths.reduce((s, m) => s + Number(m.total_income) + Number(m.total_oneoff), 0);
    const totalExpenses = activeMonths.reduce((s, m) => s + Number(m.total_expenses), 0);
    const net = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.round((1 - totalExpenses / totalIncome) * 100) : 0;
    return { totalIncome, totalExpenses, net, savingsRate };
  }, [months]);

  const handleMonthClick = (month: string) => {
    navigate(`/finance?month=${month}`);
  };

  return (
    <div className="max-w-[1100px] mx-auto px-8 py-12 space-y-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[1.333rem] font-mono font-light">{year} Overview</h1>
        <Link to="/finance" className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors">
          &larr; Back
        </Link>
      </div>

      {loading ? (
        <p className="text-sm font-mono text-muted-foreground text-center">Loading...</p>
      ) : error ? (
        <p className="text-sm font-mono text-destructive text-center">{error}</p>
      ) : (
        <>
          {/* Year summary row */}
          <div className="flex items-center justify-center gap-8 py-4 border-b border-border">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
                Total Income
              </p>
              <p className="text-[1.333rem] font-mono tabular-nums font-light">
                {formatPHP(summary.totalIncome)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
                Total Expenses
              </p>
              <p className="text-[1.333rem] font-mono tabular-nums font-light">
                {formatPHP(summary.totalExpenses)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
                Net
              </p>
              <p className={`text-[1.333rem] font-mono tabular-nums font-light ${summary.net < 0 ? 'text-destructive' : ''}`}>
                {formatPHP(summary.net)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
                Savings Rate
              </p>
              <p className="text-[1.333rem] font-mono tabular-nums font-light">
                {summary.savingsRate}%
              </p>
            </div>
          </div>

          {/* Balance sparkline */}
          <BalanceSparkline months={months} />

          {/* Year grid — 12-column strip */}
          <div className="flex-1">
            <YearGrid
              months={months}
              onMonthClick={handleMonthClick}
            />
          </div>
        </>
      )}
    </div>
  );
}
