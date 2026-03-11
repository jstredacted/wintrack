---
phase: 02-win-logging-focus-tracking
plan: "02"
subsystem: state
tags: [react, hooks, zustand, supabase, vitest, tdd, timer, wall-clock]

# Dependency graph
requires:
  - phase: 02-win-logging-focus-tracking/02-01
    provides: motion, zustand, TDD test stubs for hook behaviors
  - phase: 01-foundation/01-02
    provides: supabase.js client, date.js getLocalDateString utility
provides:
  - useStopwatch hook with wall-clock elapsed time computation
  - formatElapsed(seconds) utility for HH:MM:SS / MM:SS display
  - useWins hook with CRUD actions and timer controls
  - uiStore Zustand store for overlay and editing state
affects:
  - 02-win-logging-focus-tracking (Wave 3 components consume these contracts)
  - 03-daily-check-in (any components reusing timer display)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wall-clock timer: liveElapsed = floor((Date.now() - new Date(startedAt)) / 1000); setInterval triggers re-renders only via tick counter"
    - "Optimistic mutations: local state updated immediately, rolled back on Supabase error"
    - "Defense-in-depth: .eq('user_id', VITE_USER_ID) on every Supabase mutation alongside RLS"

key-files:
  created:
    - src/hooks/useStopwatch.js
    - src/hooks/useWins.js
    - src/stores/uiStore.js
  modified: []

key-decisions:
  - "useStopwatch accepts { elapsedBase, startedAt } object (matches test signatures from Wave 0 stubs)"
  - "pauseTimer and stopTimer are identical for Phase 2 — stopTimer delegates to pauseTimer"
  - "addWin uses optimistic insert with rollback — prevents UI jank on slow connections"

patterns-established:
  - "Wall-clock pattern: timestamp-based elapsed, never setInterval accumulation"
  - "Optimistic UI: local state update first, Supabase call second, rollback on error"
  - "Zustand store for transient UI state (no React Context needed)"

requirements-completed: [TIMER-01, TIMER-02, WIN-01, WIN-02, WIN-03, WIN-04]

# Metrics
duration: 2min
completed: 2026-03-09
---

# Phase 2 Plan 02: Logic Layer Summary

**useStopwatch (wall-clock timer), useWins (CRUD + timer actions), and uiStore (Zustand overlay state) — the complete data and logic contracts for Wave 3 components**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-09T14:09:04Z
- **Completed:** 2026-03-09T14:10:42Z
- **Tasks:** 2 completed
- **Files modified:** 3 created

## Accomplishments

- useStopwatch: wall-clock elapsed via timestamp arithmetic, setInterval only triggers re-renders, full page-refresh recovery — all 5 tests green
- formatElapsed: MM:SS or HH:MM:SS formatting (e.g., "01:05", "01:01:01")
- useWins: today/yesterday wins fetched on mount, addWin with optimistic insert + rollback, editWin/deleteWin, rollForward(), startTimer/pauseTimer/stopTimer using wall-clock timestamps
- uiStore: Zustand store managing inputOverlayOpen, editingWinId, rollForwardOffered with open/close/set/clear/mark actions

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement useStopwatch hook** - `2fea97d` (feat)
2. **Task 2: Implement useWins hook and uiStore** - `3896a06` (feat)

## Files Created/Modified

- `src/hooks/useStopwatch.js` - Wall-clock stopwatch hook + formatElapsed utility, exported as named exports
- `src/hooks/useWins.js` - Primary data hook: fetch wins, CRUD actions, timer controls, roll-forward
- `src/stores/uiStore.js` - Zustand store for transient UI state (overlay open/close, editing win ID)

## Decisions Made

- useStopwatch accepts `{ elapsedBase, startedAt }` object — matches the Wave 0 test stubs exactly (tests used object destructuring, plan spec used positional args; object form is correct)
- pauseTimer and stopTimer are identical in Phase 2 — stopTimer delegates to pauseTimer to avoid duplication
- addWin uses optimistic insert with local rollback on error — prevents UI stutter on slow Supabase connections

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three contracts ready for Wave 3 component consumption
- useStopwatch tests green; useWins tested implicitly through Wave 3-4 component tests
- npm run build passes with no module resolution errors
- Wave 3 components (WinCard, WinInput, DailyView) can now import useStopwatch, useWins, useUIStore directly

---
*Phase: 02-win-logging-focus-tracking*
*Completed: 2026-03-09*
