---
phase: 03-daily-loop-closure
plan: 01
subsystem: testing
tags: [vitest, react-testing-library, tdd, wave-0, checkin, streak, notifications]

# Dependency graph
requires:
  - phase: 02-win-logging-focus-tracking
    provides: established vitest + @testing-library/user-event test patterns, useWins/WinInputOverlay patterns to replicate
provides:
  - 6 Wave 0 TDD test stubs defining behavioral contracts for CHECKIN-01 through CHECKIN-04 and STREAK-01
  - CheckInOverlay test contract (step flow, yes/no path, reflection field, completion tally)
  - MorningPrompt + EveningPrompt test contracts (visibility gating, button callbacks)
  - useCheckin test contract (submitCheckin Supabase insert, hasCheckedInToday query)
  - useStreak test contract (0/1/N streak, gap breaking, timezone correctness via en-CA)
  - notifications stub contract (scheduleMorningReminder + scheduleEveningReminder callable)
affects:
  - 03-02 (Wave 1: useStreak, useCheckin, notifications must pass these tests)
  - 03-03 (Wave 2: CheckInOverlay must pass these tests)
  - 03-04 (Wave 2: MorningPrompt + EveningPrompt must pass these tests)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Wave 0 TDD stub pattern — import source file that does not exist yet; vitest fails with module-not-found confirming RED
    - Hook test pattern — vi.mock('@/lib/supabase') with factory, renderHook + act/waitFor, dynamic import inside it() for mocked module access
    - Component test pattern — vi.mock('@/lib/supabase'), render with props, userEvent.setup(), screen queries

key-files:
  created:
    - src/components/checkin/CheckInOverlay.test.jsx
    - src/components/checkin/MorningPrompt.test.jsx
    - src/components/checkin/EveningPrompt.test.jsx
    - src/hooks/useCheckin.test.js
    - src/hooks/useStreak.test.js
    - src/lib/notifications.test.js
  modified: []

key-decisions:
  - "Wave 0 stubs intentionally RED — module-not-found is correct failure mode until Wave 1-2 source files are created"
  - "Streak tests use Intl.DateTimeFormat en-CA locally in test to mirror hook implementation — no .toISOString().slice(0,10)"
  - "useStreak query shape: check_ins joined with wins via win_id FK, returns { wins: { win_date } } — test mocks mirror this"
  - "notifications.test.js uses dynamic import() inside it() blocks — accepted pattern from Phase 01 per STATE.md decision"

patterns-established:
  - "Wave 0 stub pattern: create test file importing non-existent source — vitest flags as module-not-found establishing contract"
  - "en-CA date pattern: all date comparisons in tests use Intl.DateTimeFormat('en-CA') not ISO slice"

requirements-completed: [CHECKIN-01, CHECKIN-02, CHECKIN-03, CHECKIN-04, STREAK-01]

# Metrics
duration: 10min
completed: 2026-03-10
---

# Phase 3 Plan 01: Wave 0 Test Stubs Summary

**6 Wave 0 TDD stubs establishing behavioral contracts for check-in overlay, morning/evening prompts, streak hook, check-in hook, and notifications — all RED pending Wave 1-2 source creation**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-10T00:12:00Z
- **Completed:** 2026-03-10T00:22:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created `src/components/checkin/` directory with 3 test stubs (CheckInOverlay, MorningPrompt, EveningPrompt)
- Created `src/hooks/useCheckin.test.js` and `src/hooks/useStreak.test.js` stubs
- Created `src/lib/notifications.test.js` stub
- All 6 files collected by vitest and failing (RED state confirmed) — no tests pass

## Task Commits

1. **Task 1: Component test stubs (CheckInOverlay, MorningPrompt, EveningPrompt)** - `bdb3335` (test)
2. **Task 2: Hook/lib test stubs (useCheckin, useStreak, notifications)** - `2776031` (test, prior session)

## Files Created/Modified
- `src/components/checkin/CheckInOverlay.test.jsx` - CHECKIN-01 contract: step flow, yes/no path, reflection text field, completion tally screen
- `src/components/checkin/MorningPrompt.test.jsx` - CHECKIN-02 contract: show/hide on show prop, Log a win + Dismiss callbacks
- `src/components/checkin/EveningPrompt.test.jsx` - CHECKIN-03 contract: show/hide on show prop, Start check-in + Dismiss callbacks
- `src/hooks/useCheckin.test.js` - CHECKIN-01/03 contract: submitCheckin inserts to Supabase, hasCheckedInToday queries check_ins
- `src/hooks/useStreak.test.js` - STREAK-01 contract: 0/1/N streak count, gap detection, Intl.DateTimeFormat en-CA timezone correctness
- `src/lib/notifications.test.js` - CHECKIN-04 contract: scheduleMorningReminder + scheduleEveningReminder callable without throw

## Decisions Made
- Wave 0 stubs are intentionally RED — module-not-found confirms the source files don't exist yet
- Streak test uses `Intl.DateTimeFormat('en-CA')` in test fixture to mirror the hook contract (no UTC corruption)
- `notifications.test.js` uses dynamic `import('./notifications')` inside `it()` blocks — accepted pattern per STATE.md [01-01] decision

## Deviations from Plan

None — plan executed exactly as written. Task 2 files were already created by a prior session's partial execution (`2776031`); content matched the plan spec exactly so no changes were needed.

## Issues Encountered
- `useStreak.js` and `useCheckin.js` source files found untracked (created by prior session running ahead of plan). These belong to Plan 02 (Wave 1) and are left untracked — they will be staged and committed in Plan 02.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 6 Wave 0 test contracts committed and RED
- Plan 02 (Wave 1) can now implement useStreak, useCheckin, and notifications against these contracts
- Plan 03/04 (Wave 2) can implement components against CheckInOverlay/MorningPrompt/EveningPrompt contracts
- Untracked `useStreak.js` and `useCheckin.js` are ready to be committed as part of Plan 02

## Self-Check: PASSED

- FOUND: src/components/checkin/CheckInOverlay.test.jsx
- FOUND: src/components/checkin/MorningPrompt.test.jsx
- FOUND: src/components/checkin/EveningPrompt.test.jsx
- FOUND: src/hooks/useCheckin.test.js
- FOUND: src/hooks/useStreak.test.js
- FOUND: src/lib/notifications.test.js
- FOUND: .planning/phases/03-daily-loop-closure/03-01-SUMMARY.md
- FOUND commit: bdb3335
- FOUND commit: 2776031

---
*Phase: 03-daily-loop-closure*
*Completed: 2026-03-10*
