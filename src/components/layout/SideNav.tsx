import { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router';
import { LayoutDashboard, BookOpen, Wallet, Settings, Flame, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import ThemeToggle from '../theme/ThemeToggle';
import { useStreak } from '@/hooks/useStreak';
import { useUIStore } from '@/stores/uiStore';
import { usePinStore } from '@/stores/pinStore';
import StreakCelebration from './StreakCelebration';

const TABS = [
  { to: '/', icon: LayoutDashboard, label: 'Today', end: true },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
  { to: '/finance', icon: Wallet, label: 'Finance' },
  { to: '/settings', icon: Settings, label: 'Settings' },
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
      setTimeout(() => setShowCelebration(true), 1500);
    }
    localStorage.setItem(STREAK_STORAGE_KEY, String(combinedStreak));
    hasInitialized.current = true;
  }, [loading, combinedStreak]);

  return (
    <>
      <nav
        className="fixed left-0 top-0 bottom-0 w-14 flex flex-col items-center border-r border-border bg-background z-10"
      >
        {/* Logo */}
        <div aria-label="wintrack" className="h-14 flex items-center justify-center select-none">
          <img
            src="/logo.png"
            alt="Wintrack"
            className="w-8 h-8 dark:invert dark:mix-blend-screen mix-blend-multiply"
          />
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
                  'relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors active:bg-foreground/10',
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
              <span className="flex items-center gap-1">
                <Flame size={12} strokeWidth={1.5} />
                {combinedStreak}
              </span>
            </span>
          )}
          <button
            onClick={() => usePinStore.getState().lock()}
            title="Lock app"
            aria-label="Lock app"
            className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            <Lock className="size-5" strokeWidth={1.5} />
          </button>
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
