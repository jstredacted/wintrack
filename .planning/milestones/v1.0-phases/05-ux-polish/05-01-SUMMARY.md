---
phase: 05-ux-polish
plan: 01
subsystem: testing
tags: [vitest, react-testing-library, tdd, red-stubs]

# Dependency graph
requires:
  - phase: 04-history-and-journal
    provides: existing useStreak hook, WinCard component, Header component, history components
provides:
  - RED test stubs for TimerFocusOverlay, JournalEditorOverlay, DayStrip (module-not-found failures)
  - RED assertion stubs for Header dual-streak display, useStreak journalStreak, WinCard border removal
affects:
  - 05-02 (useStreak extension must satisfy journalStreak tests)
  - 05-03 (TimerFocusOverlay implementation must pass stubs)
  - 05-04 (JournalEditorOverlay implementation must pass stubs)
  - 05-05 (DayStrip, Header dual-streak must pass stubs)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Wave 0 TDD stubs with module-not-found as RED state for new components
    - Assertion-error RED state for extensions to existing components
    - mockReturnValueOnce chaining for multi-query hooks (journalStreak tests)

key-files:
  created:
    - src/components/wins/TimerFocusOverlay.test.jsx
    - src/components/journal/JournalEditorOverlay.test.jsx
    - src/components/history/DayStrip.test.jsx
    - src/components/layout/Header.test.jsx
  modified:
    - src/hooks/useStreak.test.js
    - src/components/wins/WinCard.test.jsx

key-decisions:
  - "Wave 0 stubs use module-not-found as RED state for new components — consistent with Phase 3 and 4 Wave 0 approach"
  - "useStreak journalStreak tests use mockReturnValueOnce chaining — first call for wins streak query, second for journal_entries query"
  - "DayStrip uses data-completed attribute for accessibility + test queryability"

patterns-established:
  - "mockReturnValueOnce for multi-query hook tests: first call wins streak, second call journal streak"
  - "Header dual-streak: title attribute used as test query anchor (getByTitle)"

requirements-completed: []

# Metrics
duration: 5min
completed: 2026-03-10
---

# Phase 5 Plan 01: UX Polish — Wave 0 TDD Stubs Summary

**6 RED test files establishing behavioral contracts for all Phase 5 components: TimerFocusOverlay, JournalEditorOverlay, DayStrip (module-not-found), Header dual streaks, useStreak journalStreak, WinCard border removal (assertion failures)**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-10T03:03:00Z
- **Completed:** 2026-03-10T03:08:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Created 4 new test files (TimerFocusOverlay, JournalEditorOverlay, DayStrip, Header) with module-not-found or assertion RED failures
- Extended useStreak.test.js with 3 new journalStreak describe block tests using mockReturnValueOnce chaining
- Extended WinCard.test.jsx with 1 border-border removal assertion test
- Full suite: 7 new tests RED, 110 existing tests remain GREEN — no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create RED stubs for TimerFocusOverlay, JournalEditorOverlay, DayStrip** - `a615106` (test)
2. **Task 2: Create Header.test.jsx and extend useStreak.test.js and WinCard.test.jsx** - `99494c0` (test)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `src/components/wins/TimerFocusOverlay.test.jsx` - open/close/bento-cells/max-3 behavioral contracts
- `src/components/journal/JournalEditorOverlay.test.jsx` - open/close/word-count/summary-screen/Escape contracts
- `src/components/history/DayStrip.test.jsx` - N-cells/data-completed/click-handler contracts
- `src/components/layout/Header.test.jsx` - dual streak display (wins + journal) via title attributes
- `src/hooks/useStreak.test.js` - extended with journalStreak describe block (3 tests)
- `src/components/wins/WinCard.test.jsx` - extended with border-border removal assertion test

## Decisions Made

- Wave 0 stubs use module-not-found as RED state — consistent with Phase 3 and 4 Wave 0 approach
- `mockReturnValueOnce` chaining for multi-query hooks: first call for wins streak, second for journal_entries query
- `data-completed` attribute on DayStrip buttons enables both accessibility and test queryability
- Header uses `title` attribute as test query anchor (`getByTitle(/wins streak/i)`) — avoids tight coupling to text content

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — all test files failed for exactly the right reasons (module-not-found for new components, assertion errors for existing component extensions).

## Next Phase Readiness

- All behavioral contracts established for Phase 5 implementation waves
- Wave 1 (05-02): useStreak journalStreak extension — 3 failing tests ready
- Wave 2 (05-03): TimerFocusOverlay implementation — 4 failing tests ready
- Wave 2 (05-04): JournalEditorOverlay implementation — 5 failing tests ready
- Wave 3 (05-05): DayStrip + Header dual streaks — 6 failing tests ready
- WinCard border removal (05-05 or earlier) — 1 failing test ready

---
*Phase: 05-ux-polish*
*Completed: 2026-03-10*
