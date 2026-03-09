import { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router';
import { LayoutDashboard, Clock, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import ThemeToggle from '../theme/ThemeToggle';
import { useStreak } from '@/hooks/useStreak';
import { useUIStore } from '@/stores/uiStore';
import StreakCelebration from './StreakCelebration';

const TABS = [
  { to: '/', icon: LayoutDashboard, label: 'Today', end: true },
  { to: '/history', icon: Clock, label: 'History' },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
];

const STREAK_STORAGE_KEY = 'lastKnownCombinedStreak';

export default function SideNav() {
  const streakRefreshKey = useUIStore((s) => s.streakRefreshKey);
  const { combinedStreak, loading } = useStreak(streakRefreshKey);
  const [showCelebration, setShowCelebration] = useState(false);
  const celebrationStreakRef = useRef(0);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (loading) return;
    const stored = parseInt(localStorage.getItem(STREAK_STORAGE_KEY) || '0', 10);
    if (hasInitialized.current && combinedStreak > stored && combinedStreak > 0) {
      celebrationStreakRef.current = combinedStreak;
      setShowCelebration(true);
    }
    localStorage.setItem(STREAK_STORAGE_KEY, String(combinedStreak));
    hasInitialized.current = true;
  }, [loading, combinedStreak]);

  return (
    <>
      <nav
        className="fixed left-0 top-0 bottom-0 w-14 flex flex-col items-center border-r border-border bg-background z-10"
      >
        {/* Monogram */}
        <div
          aria-label="wintrack"
          className="h-14 flex items-center justify-center text-xs font-mono uppercase tracking-widest text-muted-foreground/50 select-none"
        >
          W
        </div>

        {/* Nav icons */}
        <div className="flex-1 flex flex-col items-center gap-1 pt-2">
          {TABS.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
              aria-label={label}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
                  isActive
                    ? 'text-foreground bg-foreground/8'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-0.5 -ml-2 rounded-full bg-foreground" />
                  )}
                  <Icon className="size-5" />
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Bottom: streak + theme */}
        <div className="flex flex-col items-center gap-3 pb-4">
          {!loading && combinedStreak > 0 && (
            <span
              className="font-mono text-xs tabular-nums text-muted-foreground leading-none"
              title={`Streak: ${combinedStreak} days`}
              aria-label={`Streak: ${combinedStreak} days`}
            >
              {combinedStreak}🔥
            </span>
          )}
          <ThemeToggle />
        </div>
      </nav>

      <StreakCelebration
        open={showCelebration}
        streak={celebrationStreakRef.current}
        onClose={() => setShowCelebration(false)}
      />
    </>
  );
}
