import { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router';
import { LayoutDashboard, BookOpen, Wallet, Settings, Flame, Lock, Home, DollarSign, Settings2 } from 'lucide-react';
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

const MOBILE_TABS = [
  { to: '/', icon: Home, label: 'Today', end: true },
  { to: '/journal', icon: BookOpen, label: 'Journal', end: false },
  { to: '/finance', icon: DollarSign, label: 'Finance', end: false },
  { to: '/settings', icon: Settings2, label: 'Settings', end: false },
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
      {/* Desktop left nav — hidden on mobile */}
      <nav
        className="hidden sm:flex fixed left-0 top-0 bottom-0 w-14 flex-col items-center border-r border-border bg-background z-10"
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
        <div className="hidden sm:flex flex-col items-center gap-3 pb-4">
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

      {/* Mobile bottom tab bar — hidden on desktop */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-10
                   flex items-center justify-around
                   border-t border-border bg-background"
        style={{
          height: 'calc(3.5rem + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {MOBILE_TABS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 ${
                isActive ? 'text-foreground' : 'text-muted-foreground'
              }`
            }
          >
            <Icon className="size-5" />
            <span className="text-[10px] font-mono uppercase tracking-wider">{label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => usePinStore.getState().lock()}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 text-muted-foreground"
        >
          <Lock className="size-5" />
          <span className="text-[10px] font-mono uppercase tracking-wider">Lock</span>
        </button>
      </nav>

      <StreakCelebration
        open={showCelebration}
        streak={celebrationStreakRef.current}
        onClose={() => setShowCelebration(false)}
      />
    </>
  );
}
