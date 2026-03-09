import { useState, useEffect, useRef } from 'react';
import ThemeToggle from '../theme/ThemeToggle';
import { useStreak } from '@/hooks/useStreak';
import { useUIStore } from '@/stores/uiStore';
import StreakCelebration from './StreakCelebration';

const STREAK_STORAGE_KEY = 'lastKnownCombinedStreak';

export default function Header() {
  const streakRefreshKey = useUIStore((s) => s.streakRefreshKey);
  const { combinedStreak, loading } = useStreak(streakRefreshKey);
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationStreakRef = useRef(0);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (loading) return;

    const stored = parseInt(localStorage.getItem(STREAK_STORAGE_KEY) || '0', 10);

    // Only celebrate on explicit refreshes (user action), not on first mount
    if (hasInitialized.current && combinedStreak > stored && combinedStreak > 0) {
      celebrationStreakRef.current = combinedStreak;
      setShowCelebration(true);
    }

    localStorage.setItem(STREAK_STORAGE_KEY, String(combinedStreak));
    hasInitialized.current = true;
  }, [loading, combinedStreak]);

  return (
    <>
      <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm">
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-foreground">
          wintrack
        </span>
        <div className="flex items-center gap-3">
          {!loading && (
            <span
              className="font-mono text-sm tabular-nums text-muted-foreground"
              title="Combined streak (wins + journal)"
              aria-label={`Streak: ${combinedStreak} days`}
            >
              {combinedStreak > 0 ? `${combinedStreak} 🔥` : '—'}
            </span>
          )}
          <ThemeToggle />
        </div>
      </header>

      <StreakCelebration
        open={showCelebration}
        streak={celebrationStreakRef.current}
        onClose={() => setShowCelebration(false)}
      />
    </>
  );
}
