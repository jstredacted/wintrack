# Phase 7: Unified Daily View - Research

**Researched:** 2026-03-15
**Domain:** React page consolidation, shared data hooks, carousel navigation
**Confidence:** HIGH

## Summary

This phase merges TodayPage and HistoryPage into a single unified view. The user's core complaint is that the split feels disconnected -- completing a win on Today doesn't reflect in History, and navigating between two pages to see the same data (wins) is friction. The DayStrip carousel becomes the primary navigation mechanism, and selecting "today" shows the editable win list while selecting past dates shows the read-only timeline view.

The technical work is primarily a React component restructuring problem. No new libraries are needed. The existing DayStrip, DayDetail, WinList, and WinCard components are all reusable. The main challenge is unifying the data layer -- currently `useWins` fetches today's wins with full CRUD, while `useHistory` fetches any date's wins read-only. The unified view needs both capabilities, gated by whether the selected date is "today."

**Primary recommendation:** Create a single UnifiedDayPage that embeds DayStrip at the top and conditionally renders either the editable TodayView (WinList + WinInputOverlay + RollForwardPrompt) or read-only HistoryView (DayDetail timeline) based on whether selectedDate === today. Remove the /history route entirely. Keep the existing hooks largely intact -- useWins for today, useHistory.fetchWinsForDate for past dates.

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19 | UI framework | Already in use |
| react-router | 7 | Routing -- remove /history route | Already in use |
| motion/react | 12 | AnimatePresence crossfade on date change | Already in use |
| zustand | 5 | UI state (selectedDate, overlay state) | Already in use |
| @supabase/supabase-js | - | Data fetching | Already in use |

### Supporting
No new libraries needed. This is purely a component reorganization phase.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Conditional render (today vs history) | Single hook fetching any date with CRUD | Would require rewriting useWins to accept arbitrary dates -- too much churn for little benefit |
| Removing /history route | Keeping /history as redirect to / | Redirect adds complexity; clean removal is simpler |

## Architecture Patterns

### Current Structure (Before)
```
src/
  pages/
    TodayPage.jsx        # editable wins, useWins hook
    HistoryPage.jsx      # DayStrip + DayDetail, useHistory hook
  components/
    history/
      DayStrip.jsx       # scrollable date carousel
      DayDetail.jsx      # read-only timeline view
    wins/
      WinList.jsx        # editable win cards
      WinCard.jsx        # individual win with edit/delete/toggle
      WinInputOverlay.jsx
      RollForwardPrompt.jsx
      CategorySummary.jsx
```

### Target Structure (After)
```
src/
  pages/
    TodayPage.jsx        # REWRITTEN: unified view with DayStrip + conditional content
    HistoryPage.jsx      # DELETED (or redirect stub)
  components/
    history/
      DayStrip.jsx       # UNCHANGED
      DayDetail.jsx      # UNCHANGED
    wins/
      WinList.jsx        # UNCHANGED
      WinCard.jsx        # UNCHANGED
      WinInputOverlay.jsx # UNCHANGED
      RollForwardPrompt.jsx # UNCHANGED
      CategorySummary.jsx   # UNCHANGED
```

### Pattern 1: Conditional View by Selected Date
**What:** The unified page checks if selectedDate equals today's date. If yes, render the editable TodayView with WinList, toggle, add, delete, roll-forward. If no, render read-only DayDetail timeline.
**When to use:** Always -- this is the core pattern.
**Example:**
```jsx
const today = getLocalDateString(new Date(), dayStartHour);
const isToday = selectedDate === today;

return (
  <div>
    <DayStrip ... selectedDate={selectedDate} onSelectDate={setSelectedDate} />
    {isToday ? (
      <TodayContent wins={wins} onEdit={...} onDelete={...} onToggle={...} />
    ) : (
      <DayDetail date={selectedDate} wins={historyWins} loading={detailLoading} />
    )}
  </div>
);
```

### Pattern 2: Dual Hook Strategy
**What:** Keep useWins for today's CRUD operations and useHistory for past-date read-only fetching. The page uses both hooks simultaneously.
**When to use:** This avoids rewriting useWins to be date-parameterized.
**Example:**
```jsx
const { wins, loading, addWin, editWin, deleteWin, toggleWinCompleted, ... } = useWins();
const { completionMap, fetchWinsForDate } = useHistory();
```

### Pattern 3: DayStrip Completion Map Includes Today
**What:** The completionMap from useHistory currently doesn't reactively update when today's wins change. The unified view needs the DayStrip to reflect today's completion state in real-time. Derive today's completion from the useWins wins array and merge it into completionMap.
**When to use:** Always -- critical for visual consistency.
**Example:**
```jsx
const todayCompleted = wins.some(w => w.completed);
const mergedCompletionMap = { ...completionMap, [today]: todayCompleted || undefined };
```

### Anti-Patterns to Avoid
- **Single monolithic hook:** Don't try to create a useUnifiedWins that handles both CRUD (today) and read-only (history) -- the contract is fundamentally different and would be complex.
- **Re-fetching today's wins via fetchWinsForDate:** When the user is on today, don't also call fetchWinsForDate(today) -- use the already-loaded useWins data. Double-fetching wastes network and causes flicker.
- **Keeping HistoryPage as a separate route with shared state:** The whole point is eliminating the two-page split. Don't try to keep both routes and sync state between them.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date comparison (is today?) | String comparison edge cases | `getLocalDateString(new Date(), dayStartHour)` equality check | Already handles night-owl offset |
| Horizontal scroll carousel | Custom swipe handling | Existing DayStrip with overflow-x-auto and snap | Already built and tested |
| Animated date transitions | Manual mount/unmount | `AnimatePresence mode="wait"` on selected date key | Already used in HistoryPage |

## Common Pitfalls

### Pitfall 1: Stale completionMap When Toggling Today's Wins
**What goes wrong:** User toggles a win completed on today. DayStrip still shows the old completion state for today because completionMap was fetched once on mount.
**Why it happens:** useHistory fetches completionMap independently from useWins. They don't share state.
**How to avoid:** Compute today's completion status from useWins.wins array and merge it into completionMap before passing to DayStrip.
**Warning signs:** DayStrip checkmark for today doesn't update after toggling a win.

### Pitfall 2: DayStrip Scroll Position Reset on Re-render
**What goes wrong:** DayStrip scrolls to today on mount. If the parent re-renders (e.g., wins loading state change), DayStrip may re-mount and scroll jumps.
**Why it happens:** Key changes or conditional rendering causing DayStrip unmount/remount.
**How to avoid:** Keep DayStrip outside of any conditional render block. Only the content area below should switch between today/history views. DayStrip should be always mounted.
**Warning signs:** User selects a past date, then DayStrip jumps back to today after a re-render.

### Pitfall 3: selectedDate State Lost on Navigation
**What goes wrong:** User selects a past date, navigates to Journal, comes back, and selectedDate resets to today.
**Why it happens:** Component state is local; re-mounting the page resets useState.
**How to avoid:** This is actually desired behavior -- returning to the main view should show today. If persistence is desired later, use uiStore.
**Warning signs:** N/A -- document this as intentional.

### Pitfall 4: SideNav Tab Count Changes
**What goes wrong:** Removing the History nav item changes the SideNav layout. The Clock icon for History needs to be removed.
**Why it happens:** TABS array in SideNav includes { to: '/history', icon: Clock, label: 'History' }.
**How to avoid:** Remove the History entry from TABS. The main "/" route now serves both purposes.
**Warning signs:** Dead link in navigation, 404 on /history.

### Pitfall 5: AnimatePresence mode="wait" Blocking in Tests
**What goes wrong:** Tests hang when using AnimatePresence mode="wait" in jsdom.
**Why it happens:** Known project issue -- jsdom doesn't fire animation end events.
**How to avoid:** Use AnimatePresence without mode="wait" in the unified view, matching the pattern established in Phase 03-03 decisions.
**Warning signs:** Test timeouts.

## Code Examples

### Unified Page Layout
```jsx
// Conceptual structure for the rewritten TodayPage
export default function TodayPage() {
  const { dayStartHour } = useSettingsStore(s => s.settings);
  const today = getLocalDateString(new Date(), dayStartHour);
  const [selectedDate, setSelectedDate] = useState(() => today);
  const isToday = selectedDate === today;

  // Today's editable wins
  const { wins, loading, error, yesterdayWins, addWin, editWin, deleteWin, rollForward, toggleWinCompleted } = useWins();

  // History data
  const { completionMap, loading: historyLoading, fetchWinsForDate } = useHistory();

  // Past-date wins (only fetched when not today)
  const [historyWins, setHistoryWins] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (isToday) return; // Don't fetch -- use useWins data
    let cancelled = false;
    setDetailLoading(true);
    fetchWinsForDate(selectedDate).then(data => {
      if (!cancelled) { setHistoryWins(data); setDetailLoading(false); }
    });
    return () => { cancelled = true; };
  }, [selectedDate, isToday, fetchWinsForDate]);

  // Merge today's completion into the map
  const todayHasCompleted = wins.some(w => w.completed);
  const mergedMap = { ...completionMap, [today]: todayHasCompleted || undefined };

  return (
    <div className="flex flex-col min-h-svh">
      {/* Header */}
      {/* DayStrip -- always mounted, never conditionally rendered */}
      <DayStrip completionMap={mergedMap} selectedDate={selectedDate} onSelectDate={setSelectedDate} days={28} />

      {/* Content area -- switches based on isToday */}
      {isToday ? (
        /* Editable today view */
        <TodayContent ... />
      ) : (
        /* Read-only history view */
        <DayDetail date={selectedDate} wins={historyWins} loading={detailLoading} />
      )}
    </div>
  );
}
```

### SideNav TABS Update
```jsx
// Remove History tab
const TABS = [
  { to: '/', icon: LayoutDashboard, label: 'Today', end: true },
  // { to: '/history', icon: Clock, label: 'History' },  // REMOVED
  { to: '/journal', icon: BookOpen, label: 'Journal' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate TodayPage + HistoryPage | Unified page with DayStrip nav | Phase 7 | Eliminates disconnected feel, single source of truth |
| /history route | Removed | Phase 7 | Simpler routing, fewer nav items |
| completionMap standalone | Merged with today's live win state | Phase 7 | DayStrip always reflects current completion |

## Open Questions

1. **Greeting header behavior on past dates**
   - What we know: TodayPage currently shows "Good morning/afternoon/evening" with today's date
   - What's unclear: Should the greeting still show when viewing a past date? Or should it change to show the selected date prominently?
   - Recommendation: Show greeting only when isToday. For past dates, show the selected date as the heading (e.g., "2026-03-12" or formatted nicely). This makes it clear you're looking at history.

2. **Roll-forward prompt on past dates**
   - What we know: RollForwardPrompt only applies to today
   - What's unclear: Should it be visible when viewing a past date?
   - Recommendation: Hide it when !isToday. It's today-specific functionality.

3. **"Set intentions" button on past dates**
   - What we know: The add button only makes sense for today
   - What's unclear: Should there be any action on past dates?
   - Recommendation: Hide the "Set intentions" button when !isToday. Past dates are read-only.

4. **ConsistencyGraph placement**
   - What we know: ConsistencyGraph exists in history components but is currently only on SettingsPage
   - What's unclear: Should it be added to the unified view?
   - Recommendation: Leave it on Settings. The DayStrip checkmarks serve the same "at-a-glance" purpose.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest + jsdom + @testing-library/react |
| Config file | `vitest.config.js` |
| Quick run command | `bunx vitest run --reporter=verbose` |
| Full suite command | `bunx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UNIFIED-01 | DayStrip is visible on main page with today selected by default | unit | `bunx vitest run src/pages/TodayPage.test.jsx -t "DayStrip"` | Will update existing |
| UNIFIED-02 | Selecting today shows editable WinList with CRUD | unit | `bunx vitest run src/pages/TodayPage.test.jsx -t "editable"` | Will update existing |
| UNIFIED-03 | Selecting past date shows read-only DayDetail timeline | unit | `bunx vitest run src/pages/TodayPage.test.jsx -t "history"` | Will update existing |
| UNIFIED-04 | /history route removed, SideNav History tab removed | unit | `bunx vitest run src/components/layout/SideNav.test.jsx` | Needs creation or update |
| UNIFIED-05 | DayStrip checkmark updates when toggling today's wins | unit | `bunx vitest run src/pages/TodayPage.test.jsx -t "completion"` | Will update existing |

### Sampling Rate
- **Per task commit:** `bunx vitest run --reporter=verbose`
- **Per wave merge:** `bunx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/pages/TodayPage.test.jsx` -- needs updating for unified view (DayStrip present, date switching behavior)
- [ ] `src/pages/HistoryPage.jsx` and test -- delete or redirect
- [ ] SideNav test may need update if History tab assertion exists

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of TodayPage.jsx, HistoryPage.jsx, DayStrip.jsx, DayDetail.jsx, useWins.js, useHistory.js, SideNav.jsx, App.jsx, uiStore.js
- User feedback: `feedback_merge_today_history.md` -- explicit request for unified view

### Secondary (MEDIUM confidence)
- Project decisions in STATE.md -- AnimatePresence mode="wait" avoidance in tests (Phase 03-03 decision)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries, purely using existing project stack
- Architecture: HIGH - straightforward component restructuring with well-understood patterns
- Pitfalls: HIGH - identified from direct codebase analysis and project history decisions

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable -- no external dependency changes)
