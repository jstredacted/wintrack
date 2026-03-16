---
phase: 01-ux-revisions-stopwatch-removal-journal-categories-win-wording-streak-theming-multi-win-entry-animation-polish
plan: 01
subsystem: ui
tags: [react, supabase, sql, migration]

# Dependency graph
requires: []
provides:
  - DB migration file dropping timer_elapsed_seconds and timer_started_at from wins table
  - DB migration file adding category column to journal_entries
  - useWins hook without timer functions or timer fields in insert payloads
  - WinCard, WinList, TodayPage with all timer/stopwatch UI commented out
affects:
  - 01-02 (win wording / overlay changes build on updated TodayPage)
  - 01-03 and later (no timer fields in DB schema)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "STOPWATCH REMOVED comment blocks — code commented out (not deleted) for potential re-enable"

key-files:
  created:
    - supabase/migrations/002_phase01_changes.sql
  modified:
    - src/hooks/useWins.js
    - src/hooks/useStopwatch.js
    - src/components/wins/WinCard.jsx
    - src/components/wins/WinList.jsx
    - src/components/wins/TimerFocusOverlay.jsx
    - src/components/wins/TotalFocusTime.jsx
    - src/pages/TodayPage.jsx

key-decisions:
  - "Timer code commented out (not deleted) — comment blocks marked STOPWATCH REMOVED for potential re-enable"
  - "DB migration batches two schema changes: DROP timer columns + ADD journal category column"
  - "category CHECK constraint allows: daily, milestone, financial — DEFAULT daily"

patterns-established:
  - "STOPWATCH REMOVED: standard comment block marker for disabled timer code"

requirements-completed: [UX-01, UX-02]

# Metrics
duration: 4min
completed: 2026-03-13
---

# Phase 01 Plan 01: Stopwatch Removal Summary

**Timer/stopwatch feature removed from all UI and insert payloads via comment-out pattern, plus DB migration batching timer column drops with journal category column addition.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-13T23:09:19Z
- **Completed:** 2026-03-13T23:12:34Z
- **Tasks:** 2
- **Files modified:** 7 (+ 1 created)

## Accomplishments

- Created `supabase/migrations/002_phase01_changes.sql` dropping `timer_elapsed_seconds` and `timer_started_at` columns and adding `category` to `journal_entries`
- Commented out all timer functions (`startTimer`, `pauseTimer`, `stopTimer`) from `useWins.js` and removed timer fields from `addWin` and `rollForward` insert payloads
- Commented out all timer UI (stopwatch display, Play/Pause/Stop buttons) from `WinCard.jsx`, `WinList.jsx`, and `TodayPage.jsx`
- Added `STOPWATCH REMOVED` markers to `TimerFocusOverlay.jsx`, `TotalFocusTime.jsx`, and `useStopwatch.js`
- All 117 existing tests pass after changes

## Task Commits

1. **Task 1: Create DB migration and comment out timer code in hooks** - `38c85c7` (feat)
2. **Task 2: Comment out timer UI in components and TodayPage** - `e986c2e` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified

- `supabase/migrations/002_phase01_changes.sql` - DROP timer columns, ADD journal category column with CHECK constraint
- `src/hooks/useWins.js` - Timer functions commented out, timer fields removed from insert/rollforward payloads
- `src/hooks/useStopwatch.js` - STOPWATCH REMOVED header comment added
- `src/components/wins/WinCard.jsx` - useStopwatch import, timer display, and Play/Pause/Stop buttons commented out
- `src/components/wins/WinList.jsx` - Timer prop passthrough commented out
- `src/components/wins/TimerFocusOverlay.jsx` - STOPWATCH REMOVED header comment added
- `src/components/wins/TotalFocusTime.jsx` - STOPWATCH REMOVED header comment added
- `src/pages/TodayPage.jsx` - TimerFocusOverlay import/JSX, TotalFocusTime, and all timer wiring commented out

## Decisions Made

- Timer code is commented out (not deleted) so it can be re-enabled in a future plan without git archaeology
- Standard marker `// STOPWATCH REMOVED` used consistently across all affected files
- DB migration batches both schema changes together (timer DROP + category ADD) to minimize migration count

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added WinList.jsx to comment-out scope**
- **Found during:** Task 2 (Comment out timer UI in components)
- **Issue:** WinList passes timer props down to WinCard; not listed in plan's files_modified but required for consistency
- **Fix:** Commented out `onStartTimer`, `onPauseTimer`, `onStopTimer` props in WinList's prop destructuring and WinCard invocation
- **Files modified:** `src/components/wins/WinList.jsx`
- **Verification:** No prop warnings; 117 tests pass
- **Committed in:** `e986c2e` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 - missing critical for completeness)
**Impact on plan:** Necessary for clean removal — WinList is the intermediary between TodayPage and WinCard. No scope creep.

## Issues Encountered

- JSX comment syntax (`{/* */}`) cannot appear inside a JSX element's opening tag — had to restructure WinList's WinCard invocation to use block comment above the element instead of inline comment on removed props. Fixed immediately.

## User Setup Required

Migration file `supabase/migrations/002_phase01_changes.sql` needs to be applied to the Supabase project. This can be done via:
- Supabase CLI: `supabase db push` or `supabase migration up`
- Or manually via the Supabase SQL editor

## Next Phase Readiness

- Timer UI fully removed from app — no stopwatch controls visible anywhere
- DB migration ready to apply (drops timer columns, adds journal category)
- TodayPage and WinCard are clean for Plan 02 changes (win wording, new overlay behavior)
- `useStopwatch.js`, `TimerFocusOverlay.jsx`, and `TotalFocusTime.jsx` preserved for potential re-enable

---
*Phase: 01-ux-revisions*
*Completed: 2026-03-13*
