import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useYearOverview } from '@/hooks/useYearOverview';
import YearGrid from '@/components/finance/YearGrid';
import BalanceSparkline from '@/components/finance/BalanceSparkline';

export default function YearOverviewPage() {
  const navigate = useNavigate();
  const [year] = useState(() => new Date().getFullYear());
  const { months, loading, error } = useYearOverview(year);

  return (
    <div className="max-w-[1100px] mx-auto px-8 py-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[1.333rem] font-mono font-light">Year Overview</h1>
        <button
          onClick={() => navigate('/finance')}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-[0.778rem] font-mono transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>
      </div>

      {loading ? (
        <p className="text-sm font-mono text-muted-foreground text-center">Loading...</p>
      ) : error ? (
        <p className="text-sm font-mono text-destructive text-center">{error}</p>
      ) : (
        <>
          {/* Balance sparkline */}
          <BalanceSparkline months={months} />

          {/* Year grid */}
          <YearGrid
            months={months}
            onMonthClick={(month) => navigate(`/finance?month=${month}`)}
          />
        </>
      )}
    </div>
  );
}
