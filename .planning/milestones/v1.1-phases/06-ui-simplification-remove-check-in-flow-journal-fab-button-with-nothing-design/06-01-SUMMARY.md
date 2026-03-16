---
phase: 06-ui-simplification-remove-check-in-flow-journal-fab-button-with-nothing-design
plan: 01
subsystem: ui
tags: [react, zustand, supabase, streak, cleanup]

requires:
  - phase: 03-daily-loop-closure
    provides: check-in components, useCheckin hook, streak via check_ins table
provides:
  - Clean codebase with no check-in references in src/
  - Streak driven by wins.completed directly (no check_ins join)
  - Simplified DayDetail timeline without note expansion
  - DevToolsPanel seeding wins.completed instead of check_ins
  - Evening push notification with updated copy
affects: [07-unified-daily-view]

tech-stack:
  added: []
  patterns:
    - "Streak query from wins table directly instead of check_ins join"

key-files:
  created: []
  modified:
    - src/pages/TodayPage.jsx
    - src/stores/uiStore.js
    - src/hooks/useStreak.js
    - src/hooks/useHistory.js
    - src/components/history/DayDetail.jsx
    - src/components/dev/DevToolsPanel.jsx
    - supabase/functions/send-push/index.ts

key-decisions:
  - "Streak now queries wins.completed=true directly, eliminating check_ins table dependency"
  - "Check-in comment references preserved in DevToolsPanel (FK cascade) and test file (historical context)"

patterns-established:
  - "wins.completed as source of truth for streak and completion status"

requirements-completed: [SIMPLIFY-01, SIMPLIFY-02, SIMPLIFY-03, SIMPLIFY-04, SIMPLIFY-05, SIMPLIFY-06, SIMPLIFY-07, SIMPLIFY-08, SIMPLIFY-09, SIMPLIFY-10]

duration: 4min
completed: 2026-03-14
---

# Phase 06 Plan 01: Remove Check-in Flow Summary

**Complete removal of check-in UI, hooks, and store state; streak rewritten to query wins.completed directly**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T18:50:22Z
- **Completed:** 2026-03-14T18:54:15Z
- **Tasks:** 2
- **Files modified:** 19 (11 deleted, 8 modified)

## Accomplishments
- Deleted 8 check-in files (3 components, 3 test files, 1 hook, 1 hook test)
- Cleaned TodayPage: removed all check-in imports, state, effects, computed vars, and UI elements
- Rewrote useStreak to query wins.completed directly instead of joining through check_ins table
- Simplified DayDetail timeline: removed note expansion UI (AnimatePresence, ChevronDown/Up, useState)
- Updated DevToolsPanel to seed wins with completed:true instead of separate check_ins insert
- Updated Edge Function evening push message from "check-in" to "reflect on your day"

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete check-in files and clean TodayPage + uiStore** - `aeea562` (feat)
2. **Task 2: Rewrite useStreak, clean data layer, update DevTools and Edge Function** - `b7aecce` (feat)

## Files Created/Modified
- `src/components/checkin/*` - 6 files deleted (CheckInOverlay, MorningPrompt, EveningPrompt + tests)
- `src/hooks/useCheckin.js` + test - Deleted
- `src/pages/TodayPage.jsx` - Removed all check-in imports, state, effects, UI
- `src/pages/TodayPage.test.jsx` - Simplified mocks and assertions
- `src/stores/uiStore.js` - Removed Phase 3 check-in state
- `src/hooks/useStreak.js` - Query wins.completed instead of check_ins
- `src/hooks/useStreak.test.js` - Updated mock data to flat win_date shape
- `src/hooks/useHistory.js` - Removed check_ins join from select
- `src/hooks/useHistory.test.js` - Removed check_ins from fixtures
- `src/components/history/DayDetail.jsx` - Removed note expansion, AnimatePresence, state
- `src/components/history/DayDetail.test.jsx` - Removed check_ins from fixtures
- `src/components/dev/DevToolsPanel.jsx` - Seeds wins.completed=true, no check_ins insert
- `supabase/functions/send-push/index.ts` - Evening message updated

## Decisions Made
- Streak now queries wins.completed=true directly, eliminating check_ins table dependency
- Two comment-only references to check_ins preserved (DevToolsPanel FK cascade note, test file historical context)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Codebase clean of check-in references, ready for Phase 06-02 (Journal FAB button)
- check_ins table still exists in DB (migration to drop it can be done separately)

---
*Phase: 06-ui-simplification-remove-check-in-flow-journal-fab-button-with-nothing-design*
*Completed: 2026-03-14*
