---
phase: 04-history-and-journal
plan: 01
subsystem: testing
tags: [vitest, react-testing-library, tdd, wave0, hooks, journal, history, heatmap]

# Dependency graph
requires:
  - phase: 03-daily-loop-closure
    provides: "Established Supabase thenable mock builder pattern and vi.mock factory form"
  - phase: 02-win-logging-focus-tracking
    provides: "userEvent, @testing-library/react, jsdom test environment"
provides:
  - "7 Wave 0 TDD test stub files defining behavioral contracts for Phase 4"
  - "useJournal.test.js: addEntry, editEntry (with updated_at), deleteEntry, initial state"
  - "useHistory.test.js: completionMap building, fetchWinsForDate, loading state"
  - "JournalEntryForm.test.jsx: title input, body textarea, disabled Save, onSubmit, edit mode"
  - "JournalEntryCard.test.jsx: renders title, edit/delete buttons, onDelete, edit-mode guard"
  - "JournalPage.test.jsx: entry list sorted DESC, empty state, create button"
  - "DayDetail.test.jsx: win titles, Completed/Incomplete badges, empty state"
  - "Heatmap.test.jsx: cell count, bg-foreground/bg-border completed vs incomplete"
affects: [04-02, 04-03, 04-04, 04-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Thenable chainable Supabase mock builder for Phase 4 hooks (mirrors Phase 3 pattern)"
    - "vi.mock factory form prevents supabase accessToken init error"
    - "Component test stubs use module-not-found RED as validation signal until Wave 2"

key-files:
  created:
    - src/hooks/useJournal.test.js
    - src/hooks/useHistory.test.js
    - src/components/journal/JournalEntryForm.test.jsx
    - src/components/journal/JournalEntryCard.test.jsx
    - src/pages/JournalPage.test.jsx
    - src/components/history/DayDetail.test.jsx
    - src/components/history/Heatmap.test.jsx
  modified: []

key-decisions:
  - "Wave 0 stubs intentionally RED — module-not-found for components not yet created, assertion failures for JournalPage (placeholder stub exists from Phase 1 routing setup)"
  - "Heatmap test uses data-testid='heatmap-cell' to count cells and check className for bg-foreground/bg-border"
  - "JournalPage test mocks useJournal hook via vi.mock('@/hooks/useJournal') for controlled test data"
  - "editEntry test asserts updated_at is included in update payload — no DB trigger exists, client must set it"
  - "completionMap test uses multiple cases: true (has completed check_in), false (all incomplete), empty (no data)"

patterns-established:
  - "buildJournalMock/buildHistoryMock: chainable mock builder with then/catch + all query methods as mockReturnValue(mock)"
  - "JournalPage.test.jsx imports useJournal mock at @/hooks/useJournal (not relative) for module mock isolation"

requirements-completed: [JOURNAL-01, JOURNAL-02, JOURNAL-03, HISTORY-01, HISTORY-02]

# Metrics
duration: 4min
completed: 2026-03-10
---

# Phase 4 Plan 01: Wave 0 Test Stubs Summary

**7 TDD Wave 0 test stubs defining behavioral contracts for journal CRUD, history completionMap, and heatmap cell rendering — all fail RED until Wave 2 components are created**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-09T17:20:58Z
- **Completed:** 2026-03-09T17:24:38Z
- **Tasks:** 2
- **Files modified:** 7 created

## Accomplishments

- Created 2 hook test stubs (useJournal, useHistory) with full CRUD and completionMap behavioral contracts
- Created 5 component/page test stubs (JournalEntryForm, JournalEntryCard, JournalPage, DayDetail, Heatmap)
- All prior phase tests remain GREEN (15 passing test files, 74 tests unaffected)
- Heatmap tests use data-testid="heatmap-cell" and className checks for bg-foreground/bg-border — giving Wave 2 precise implementation targets

## Task Commits

Each task was committed atomically:

1. **Task 1: Hook test stubs — useJournal and useHistory** - `183e0d0` (test)
2. **Task 2: Component and page test stubs** - `138f827` (test)

## Files Created/Modified

- `src/hooks/useJournal.test.js` — addEntry, editEntry (updated_at required), deleteEntry, initial state
- `src/hooks/useHistory.test.js` — completionMap true/false/empty, fetchWinsForDate with .eq('win_date', date)
- `src/components/journal/JournalEntryForm.test.jsx` — title input, body textarea, disabled Save on empty title, onSubmit, edit mode pre-fill
- `src/components/journal/JournalEntryCard.test.jsx` — renders title, edit/delete buttons, onDelete with entry.id, delete hidden when editingId===entry.id
- `src/pages/JournalPage.test.jsx` — entry list, sort order, empty state, new entry button
- `src/components/history/DayDetail.test.jsx` — win titles, Completed/Incomplete badges, empty state, date display
- `src/components/history/Heatmap.test.jsx` — 84 cells default, N cells for N days prop, bg-foreground/bg-border classes

## Decisions Made

- JournalPage.jsx already existed as an empty routing placeholder from Phase 1 — tests fail with assertion errors (not module-not-found), which is still correct RED state
- Heatmap test uses `data-testid="heatmap-cell"` on each cell div — this must be added in Wave 2 implementation
- JournalPage mock uses `@/hooks/useJournal` path (not relative `./useJournal`) to match how the page will import the hook
- editEntry stub asserts `updated_at` is included in update payload — key enforcement of the "no DB trigger" pitfall documented in RESEARCH.md

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — all patterns were direct mirrors of Phase 3 Wave 0 stubs (useStreak.test.js, CheckInOverlay.test.jsx). The thenable chainable mock builder was copy-adapted from buildStreakMock.

## Next Phase Readiness

- Wave 0 stubs establish behavioral contracts — Wave 1 (04-02) implements useJournal and useHistory hooks
- Wave 2 (04-03, 04-04) implements components — test stubs provide immediate verify commands
- Heatmap test expects `data-testid="heatmap-cell"` — implementation must include this attribute

---
*Phase: 04-history-and-journal*
*Completed: 2026-03-10*

## Self-Check: PASSED

- All 7 test files exist at specified paths: FOUND
- Task commits exist: 183e0d0 (Task 1), 138f827 (Task 2) — FOUND
