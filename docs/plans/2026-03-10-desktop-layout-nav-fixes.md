# Desktop Layout, Sidebar Nav & Bug Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the mobile bottom nav + header with an icon-only left sidebar, expand content width, fix TimerFocusOverlay to show all wins and support start/pause, and replace DayStrip scroll with arrow navigation defaulting to today.

**Architecture:** Four independent changes — (1) SideNav replaces Header + BottomTabBar in AppShell, (2) TimerFocusOverlay prop + logic fix, (3) DayStrip arrow navigation with scroll, (4) min-height cleanup for pages that assumed the old chrome. Each change is independently testable.

**Tech Stack:** React 19, React Router, Tailwind v4, Lucide icons, Vitest + Testing Library

---

## Task 1: Update TimerFocusOverlay tests

**Files:**
- Modify: `src/components/wins/TimerFocusOverlay.test.jsx`

The existing test asserts "at most 3 cells" — this contradicts the new desired behavior. Update the test file to reflect correct behavior: all wins shown, `onStartWin` called when play is pressed on a non-running win.

**Step 1: Update the test file**

Replace the entire file content with:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimerFocusOverlay from './TimerFocusOverlay';

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }));

const sampleWins = [
  { id: 'w1', title: 'Write docs', timer_elapsed_seconds: 120, timer_started_at: null },
  { id: 'w2', title: 'Review PR', timer_elapsed_seconds: 0, timer_started_at: null },
];

describe('TimerFocusOverlay', () => {
  it('renders nothing when open is false', () => {
    render(<TimerFocusOverlay open={false} wins={sampleWins} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders a dialog when open is true', () => {
    render(<TimerFocusOverlay open={true} wins={sampleWins} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders one bento cell per win when open', () => {
    render(<TimerFocusOverlay open={true} wins={sampleWins} onClose={vi.fn()} />);
    expect(screen.getByText('Write docs')).toBeInTheDocument();
    expect(screen.getByText('Review PR')).toBeInTheDocument();
  });

  it('renders all wins when there are more than 3', () => {
    const manyWins = Array.from({ length: 5 }, (_, i) => ({
      id: `w${i}`, title: `Win ${i}`, timer_elapsed_seconds: 0, timer_started_at: null,
    }));
    render(<TimerFocusOverlay open={true} wins={manyWins} onClose={vi.fn()} />);
    for (let i = 0; i < 5; i++) {
      expect(screen.getByText(`Win ${i}`)).toBeInTheDocument();
    }
  });

  it('calls onStartWin when play is clicked on a non-running, fresh win', async () => {
    const user = userEvent.setup();
    const onStartWin = vi.fn();
    const wins = [{ id: 'w1', title: 'Write docs', timer_elapsed_seconds: 0, timer_started_at: null }];
    render(<TimerFocusOverlay open={true} wins={wins} onClose={vi.fn()} onStartWin={onStartWin} />);
    await user.click(screen.getByRole('button', { name: /start timer/i }));
    expect(onStartWin).toHaveBeenCalledWith('w1');
  });

  it('calls onStartWin when play is clicked on a paused win (elapsed > 0, not running)', async () => {
    const user = userEvent.setup();
    const onStartWin = vi.fn();
    const wins = [{ id: 'w1', title: 'Write docs', timer_elapsed_seconds: 300, timer_started_at: null }];
    render(<TimerFocusOverlay open={true} wins={wins} onClose={vi.fn()} onStartWin={onStartWin} />);
    await user.click(screen.getByRole('button', { name: /resume timer/i }));
    expect(onStartWin).toHaveBeenCalledWith('w1');
  });
});
```

**Step 2: Run tests — expect FAIL on the new tests**

```bash
cd /Users/justin/Repositories/Personal/wintrack
npx vitest run src/components/wins/TimerFocusOverlay.test.jsx 2>&1 | tail -30
```

Expected: existing pass, new onStartWin tests FAIL with "Unable to find role button with name /start timer/"

---

## Task 2: Fix TimerFocusOverlay implementation

**Files:**
- Modify: `src/components/wins/TimerFocusOverlay.jsx`

**Step 1: Update the component**

Replace the entire file with:

```jsx
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { X, Plus, Square, Pause, Play } from 'lucide-react';
import { formatElapsed, useStopwatch } from '@/hooks/useStopwatch';

function timerFontSize(count) {
  if (count === 1) return 'clamp(5rem, 12vw, 10rem)';
  if (count === 2) return 'clamp(4rem, 8vw, 7rem)';
  if (count === 3) return 'clamp(2.75rem, 5.5vw, 5rem)';
  return 'clamp(2rem, 4vw, 3.5rem)';
}

function TimerStation({ win, fontSize }) {
  const { displaySeconds } = useStopwatch({
    elapsedBase: win.timer_elapsed_seconds ?? 0,
    startedAt: win.timer_started_at ?? null,
  });

  const isRunning = !!win.timer_started_at;
  const hasElapsed = (win.timer_elapsed_seconds ?? 0) > 0;

  // Determine play button label: fresh win vs paused win vs running win
  const playLabel = isRunning ? 'Pause timer' : hasElapsed ? 'Resume timer' : 'Start timer';

  return (
    <div className="flex flex-col items-center gap-6 select-none" data-win-id={win.id} data-display-seconds={displaySeconds}>
      <span
        className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground text-center"
        style={{ maxWidth: '22ch' }}
      >
        {win.title.length > 30 ? win.title.slice(0, 30) + '…' : win.title}
      </span>

      <span
        className="font-mono tabular-nums text-foreground font-light"
        style={{ fontSize, lineHeight: 1, letterSpacing: '-0.02em' }}
      >
        {formatElapsed(displaySeconds)}
      </span>

      <div className="flex items-center gap-6">
        <button
          aria-label={playLabel}
          onClick={() => {
            if (isRunning) {
              win._onPause?.(win.id, displaySeconds);
            } else {
              win._onStart?.(win.id);
            }
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          aria-label="Stop timer"
          onClick={() => win._onStop?.(win.id, displaySeconds)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Square size={16} />
        </button>
      </div>
    </div>
  );
}

function AddSlot({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Add a win"
      className="flex flex-col items-center justify-center gap-6 opacity-30 hover:opacity-70 transition-opacity cursor-pointer px-10 py-8"
    >
      <span className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
        New win
      </span>
      <div className="w-16 h-16 rounded-full border border-muted-foreground/50 flex items-center justify-center">
        <Plus size={24} strokeWidth={1.5} />
      </div>
    </button>
  );
}

export default function TimerFocusOverlay({
  open,
  wins = [],
  onClose,
  onStopAll,
  onAddWin,
  onPauseWin,
  onStartWin,
  onStopWin,
}) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (open) { setVisible(true); setExiting(false); }
    else if (visible) { setExiting(true); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!visible) return null;

  // Show all wins — no artificial cap
  const displayWins = wins.map(w => ({
    ...w,
    _onPause: onPauseWin,
    _onStart: onStartWin,
    _onStop: onStopWin,
  }));
  const showAddSlot = displayWins.length < 4;
  const totalItems = displayWins.length + (showAddSlot ? 1 : 0);
  const fontSize = timerFontSize(displayWins.length);

  // Use 2-column grid for 3+ items, single row for 1-2
  const useGrid = totalItems >= 3;
  const gapStyle = totalItems <= 2 ? 'clamp(4rem, 10vw, 8rem)' : 'clamp(3rem, 6vw, 5rem)';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Focus timer"
      className={`fixed inset-0 z-50 flex flex-col bg-background ${exiting ? 'overlay-exit' : 'overlay-enter'}`}
      onAnimationEnd={() => { if (exiting) setVisible(false); }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border/40">
        <span className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground/60">
          Focus
        </span>
        <div className="flex items-center gap-8">
          <button
            aria-label="Stop all timers"
            onClick={onStopAll}
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            <Square size={14} />
            Stop all
          </button>
          <button
            aria-label="Close focus view"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Timers */}
      <div className="flex-1 flex items-center justify-center px-12">
        {displayWins.length === 0 ? (
          <div className="flex flex-col items-center gap-6 text-muted-foreground/40">
            <span className="font-mono text-sm uppercase tracking-[0.2em]">No active wins</span>
            <button
              onClick={onAddWin}
              className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest hover:text-muted-foreground transition-colors"
            >
              <Plus size={18} />
              Log a win
            </button>
          </div>
        ) : useGrid ? (
          <div className="grid grid-cols-2 gap-x-20 gap-y-16 items-center justify-items-center">
            {displayWins.map((win) => (
              <TimerStation key={win.id} win={win} fontSize={fontSize} />
            ))}
            {showAddSlot && <AddSlot onClick={onAddWin} />}
          </div>
        ) : (
          <div className="flex items-center justify-center" style={{ gap: gapStyle }}>
            {displayWins.map((win) => (
              <TimerStation key={win.id} win={win} fontSize={fontSize} />
            ))}
            {showAddSlot && <AddSlot onClick={onAddWin} />}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
```

**Step 2: Run tests**

```bash
npx vitest run src/components/wins/TimerFocusOverlay.test.jsx 2>&1 | tail -30
```

Expected: all tests PASS

**Step 3: Wire onStartWin in TodayPage**

In `src/pages/TodayPage.jsx`, add `onStartWin` prop to the `<TimerFocusOverlay>` component (around line 229):

```jsx
<TimerFocusOverlay
  open={timerOverlayOpen}
  wins={wins}
  onClose={closeTimerOverlay}
  onStopAll={() => {
    wins.forEach((win) => {
      if (win.timer_started_at) {
        const elapsed = (win.timer_elapsed_seconds ?? 0) +
          Math.floor((Date.now() - new Date(win.timer_started_at).getTime()) / 1000);
        stopTimer(win.id, elapsed);
      }
    });
    closeTimerOverlay();
  }}
  onAddWin={() => {
    closeTimerOverlay();
    openInputOverlay();
  }}
  onStartWin={(id) => startTimer(id)}
  onPauseWin={(id, displaySeconds) => pauseTimer(id, displaySeconds)}
  onStopWin={(id, displaySeconds) => {
    stopTimer(id, displaySeconds);
    const remaining = wins.filter(w => w.id !== id && w.timer_started_at);
    if (remaining.length === 0) closeTimerOverlay();
  }}
/>
```

**Step 4: Run full test suite**

```bash
npx vitest run 2>&1 | tail -20
```

Expected: all tests pass (same count as before or more)

**Step 5: Commit**

```bash
git add src/components/wins/TimerFocusOverlay.jsx src/components/wins/TimerFocusOverlay.test.jsx src/pages/TodayPage.jsx
git commit -m "fix(timer): show all wins in overlay, fix start/resume/pause button logic"
```

---

## Task 3: Update DayStrip tests

**Files:**
- Modify: `src/components/history/DayStrip.test.jsx`

The existing test uses `getAllByRole('button')` which will include the new arrow buttons. Update to use `data-testid="day-cell"` for day cells, and add tests for arrow behavior.

**Step 1: Replace the test file**

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DayStrip from './DayStrip';
import { getLocalDateString } from '@/lib/utils/date';

const today = getLocalDateString(new Date());
const yesterday = getLocalDateString(new Date(Date.now() - 86400000));

describe('DayStrip', () => {
  it('renders N day cells for N days', () => {
    render(<DayStrip completionMap={{}} selectedDate={today} onSelectDate={vi.fn()} days={7} />);
    // Use data-testid to count only day cells, not arrow buttons
    const cells = screen.getAllByTestId('day-cell');
    expect(cells).toHaveLength(7);
  });

  it('shows a checkmark indicator for completed days', () => {
    const completionMap = { [yesterday]: true };
    render(<DayStrip completionMap={completionMap} selectedDate={today} onSelectDate={vi.fn()} days={7} />);
    const completedCell = screen.getByRole('button', { name: new RegExp(yesterday) });
    expect(completedCell).toHaveAttribute('data-completed', 'true');
  });

  it('calls onSelectDate with the date string when a cell is clicked', async () => {
    const user = userEvent.setup();
    const onSelectDate = vi.fn();
    render(<DayStrip completionMap={{}} selectedDate={today} onSelectDate={onSelectDate} days={7} />);
    const firstCell = screen.getAllByTestId('day-cell')[0];
    await user.click(firstCell);
    expect(onSelectDate).toHaveBeenCalledWith(expect.any(String));
  });

  it('renders scroll arrow buttons', () => {
    render(<DayStrip completionMap={{}} selectedDate={today} onSelectDate={vi.fn()} days={28} />);
    // Arrow buttons are rendered (visibility depends on scroll state, but buttons exist in DOM)
    // At least one navigation button should be present
    const prevBtn = screen.queryByRole('button', { name: /previous days/i });
    const nextBtn = screen.queryByRole('button', { name: /next days/i });
    // At least one arrow should exist (today is at the far right so prev should exist after scroll)
    expect(prevBtn !== null || nextBtn !== null).toBe(true);
  });
});
```

**Step 2: Run — expect FAIL on data-testid tests**

```bash
npx vitest run src/components/history/DayStrip.test.jsx 2>&1 | tail -20
```

Expected: FAIL — "Unable to find an accessible element with the role 'testid'" (data-testid doesn't exist yet)

---

## Task 4: Fix DayStrip implementation

**Files:**
- Modify: `src/components/history/DayStrip.jsx`

Replace the entire file with an arrow-nav version that:
- Hides the native scrollbar
- Shows prev/next arrow buttons when there are more dates in that direction
- Fades dates near the arrows with gradient overlays
- Auto-scrolls to today (rightmost) on mount

```jsx
import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { getLocalDateString } from '@/lib/utils/date';

export default function DayStrip({ completionMap = {}, selectedDate, onSelectDate, days = 28 }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const cells = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    const dateStr = getLocalDateString(d);
    const dayAbbr = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d);
    const dateNum = d.getDate();
    const completed = completionMap[dateStr] === true;
    cells.push({ date: dateStr, dayAbbr, dateNum, completed });
  }

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  // Scroll to today (rightmost) on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
    updateScrollState();
  }, []);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll ~3 cell widths (each cell is min-w-[4.5rem] = 81px at 18px base)
    el.scrollBy({ left: dir * 243, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {/* Left arrow + fade */}
      {canScrollLeft && (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 w-20 pointer-events-none z-10"
            style={{ background: 'linear-gradient(to right, var(--background) 20%, transparent 100%)' }}
          />
          <button
            aria-label="Previous days"
            onClick={() => scroll(-1)}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 text-muted-foreground/50 hover:text-foreground transition-colors p-1"
          >
            <ChevronLeft size={16} />
          </button>
        </>
      )}

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-0 snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onScroll={updateScrollState}
      >
        {cells.map(({ date, dayAbbr, dateNum, completed }) => {
          const isSelected = selectedDate === date;
          return (
            <button
              key={date}
              data-testid="day-cell"
              aria-label={date}
              aria-pressed={isSelected}
              data-completed={completed ? 'true' : 'false'}
              onClick={() => onSelectDate?.(date)}
              className={[
                'snap-start shrink-0 flex flex-col items-center gap-2 px-4 py-5 min-w-[4.5rem] font-mono transition-all',
                isSelected
                  ? 'text-foreground border-b-2 border-foreground'
                  : 'text-muted-foreground/40 hover:text-muted-foreground/70 border-b-2 border-transparent',
              ].join(' ')}
            >
              <span className="text-xs uppercase tracking-widest">{dayAbbr}</span>
              <span className="text-3xl tabular-nums font-light">{dateNum}</span>
              <span className="h-4 flex items-center justify-center">
                {completed && (
                  <Check
                    size={13}
                    aria-hidden="true"
                    className={isSelected ? 'text-foreground' : 'text-muted-foreground/40'}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right arrow + fade */}
      {canScrollRight && (
        <>
          <div
            className="absolute right-0 top-0 bottom-0 w-20 pointer-events-none z-10"
            style={{ background: 'linear-gradient(to left, var(--background) 20%, transparent 100%)' }}
          />
          <button
            aria-label="Next days"
            onClick={() => scroll(1)}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 text-muted-foreground/50 hover:text-foreground transition-colors p-1"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}
    </div>
  );
}
```

**Step 2: Run DayStrip tests**

```bash
npx vitest run src/components/history/DayStrip.test.jsx 2>&1 | tail -20
```

Expected: all tests PASS

**Step 3: Commit**

```bash
git add src/components/history/DayStrip.jsx src/components/history/DayStrip.test.jsx
git commit -m "feat(history): DayStrip arrow navigation with fade, auto-scroll to today"
```

---

## Task 5: Create SideNav component

**Files:**
- Create: `src/components/layout/SideNav.jsx`
- Create: `src/components/layout/SideNav.test.jsx`

SideNav is the new primary navigation. It replaces both `Header.jsx` and `BottomTabBar.jsx`. It holds the streak display, theme toggle, and StreakCelebration portal (moved from Header).

**Step 1: Write the failing test first**

Create `src/components/layout/SideNav.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import SideNav from './SideNav';

vi.mock('@/hooks/useStreak', () => ({
  useStreak: () => ({ combinedStreak: 5, loading: false }),
}));
vi.mock('@/stores/uiStore', () => ({
  useUIStore: (sel) => sel({ streakRefreshKey: 0 }),
}));

const renderWithRouter = (ui, { route = '/' } = {}) =>
  render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);

describe('SideNav', () => {
  it('renders the three nav links', () => {
    renderWithRouter(<SideNav />);
    expect(screen.getByRole('link', { name: /today/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /history/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /journal/i })).toBeInTheDocument();
  });

  it('displays the streak value', () => {
    renderWithRouter(<SideNav />);
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it('renders the wintrack monogram', () => {
    renderWithRouter(<SideNav />);
    expect(screen.getByLabelText(/wintrack/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run — expect FAIL (module not found)**

```bash
npx vitest run src/components/layout/SideNav.test.jsx 2>&1 | tail -15
```

Expected: FAIL with "Cannot find module './SideNav'"

**Step 3: Create SideNav.jsx**

```jsx
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
        aria-label="wintrack"
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
```

**Step 4: Run SideNav tests**

```bash
npx vitest run src/components/layout/SideNav.test.jsx 2>&1 | tail -20
```

Expected: all 3 tests PASS

---

## Task 6: Refactor AppShell and remove old nav files

**Files:**
- Modify: `src/components/layout/AppShell.jsx`
- Delete: `src/components/layout/Header.jsx`
- Delete: `src/components/layout/Header.test.jsx`
- Delete: `src/components/layout/BottomTabBar.jsx`

**Step 1: Replace AppShell.jsx**

```jsx
import { Outlet } from 'react-router';
import SideNav from './SideNav';

export default function AppShell() {
  return (
    <div className="flex h-svh bg-background text-foreground dot-grid">
      <SideNav />
      <main className="ml-14 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

**Step 2: Delete old files**

```bash
rm src/components/layout/Header.jsx
rm src/components/layout/Header.test.jsx
rm src/components/layout/BottomTabBar.jsx
```

**Step 3: Run full test suite**

```bash
npx vitest run 2>&1 | tail -20
```

Expected: all tests pass, no references to Header or BottomTabBar

**Step 4: Commit**

```bash
git add src/components/layout/AppShell.jsx src/components/layout/SideNav.jsx src/components/layout/SideNav.test.jsx
git rm src/components/layout/Header.jsx src/components/layout/Header.test.jsx src/components/layout/BottomTabBar.jsx
git commit -m "feat(layout): replace header+bottom nav with icon-only left sidebar"
```

---

## Task 7: Fix page min-heights and content padding

**Files:**
- Modify: `src/pages/TodayPage.jsx`
- Modify: `src/pages/HistoryPage.jsx`

The `min-h-[calc(100svh-7rem)]` values compensated for the old header (48px) + bottom nav (56px). With the sidebar, the main content area fills full viewport height directly. Also expand horizontal padding to use more of the screen.

**Step 1: Update TodayPage root div**

In `src/pages/TodayPage.jsx`, line 98, change:

```jsx
// Before
<div className="flex flex-col min-h-[calc(100svh-7rem)] px-10 py-10 gap-10">

// After
<div className="flex flex-col min-h-svh px-16 py-12 gap-10">
```

Also add `mt-auto` to the action buttons div so it anchors to the bottom when content is sparse. Find the action buttons div around line 168:

```jsx
// Before
<div className="flex items-center gap-4 pb-2">

// After
<div className="flex items-center gap-4 pb-2 mt-auto">
```

**Step 2: Update HistoryPage root div**

In `src/pages/HistoryPage.jsx`, line 32, change:

```jsx
// Before
<div className="flex flex-col min-h-[calc(100svh-7rem)] px-10 py-10">

// After
<div className="flex flex-col min-h-svh px-16 py-12">
```

The DayStrip bleed container uses `-mx-10` to bleed to the page edges. Update to match the new padding:

```jsx
// Before
<div className="mb-10 -mx-10 px-10 border-y border-border/30 py-4">

// After
<div className="mb-10 -mx-16 px-16 border-y border-border/30 py-4">
```

**Step 3: Run full test suite**

```bash
npx vitest run 2>&1 | tail -20
```

Expected: all tests pass

**Step 4: Commit**

```bash
git add src/pages/TodayPage.jsx src/pages/HistoryPage.jsx
git commit -m "fix(layout): update page min-heights and padding for sidebar layout"
```

---

## Task 8: Final verification

**Step 1: Run the full test suite**

```bash
cd /Users/justin/Repositories/Personal/wintrack
npx vitest run 2>&1 | tail -30
```

Expected: all tests pass, 0 failures

**Step 2: Check for any broken imports**

```bash
npx vitest run --reporter=verbose 2>&1 | grep -E "FAIL|ERROR" | head -20
```

Expected: no output (no failures)

**Step 3: Commit any remaining changes**

If any files are unstaged:

```bash
git status
git add -p  # stage remaining changes selectively
git commit -m "chore: final cleanup for desktop layout pass"
```
