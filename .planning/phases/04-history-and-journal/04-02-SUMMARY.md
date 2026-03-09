---
phase: 04-history-and-journal
plan: 02
subsystem: hooks
tags: [react, supabase, hooks, journal, history, tdd]

requires:
  - phase: 04-01
    provides: Wave 0 test stubs for useJournal and useHistory

provides:
  - useJournal hook with full CRUD (addEntry, editEntry, deleteEntry) + loading state
  - useHistory hook with completionMap building + fetchWinsForDate
  - 17 passing tests covering both hooks

affects:
  - 04-03 (JournalPage + journal components depend on useJournal)
  - 04-04 (HistoryPage + Heatmap + DayDetail depend on useHistory)

tech-stack:
  added: []
  patterns:
    - "Thenable chainable Supabase mock builder for multi-call tests (mockReturnValueOnce)"
    - "Optimistic state update for edit/delete before async Supabase call"
    - "completionMap true-wins: if any check_in.completed=true on a date, the date is true"

key-files:
  created:
    - src/hooks/useJournal.js
    - src/hooks/useHistory.js
  modified: []

key-decisions:
  - "editEntry always sends updated_at: new Date().toISOString() in the Supabase update payload — no DB trigger runs on UPDATE for journal_entries"
  - "completionMap uses wins → check_ins FK join direction (not check_ins → wins) — wins table has win_date, check_ins does not"
  - "fetchWinsForDate returns data ?? [] — never throws, safe to call before completionMap resolves"
  - "addEntry is NOT optimistic — waits for Supabase .select().single() response before adding real row (no local ID conflict risk)"

patterns-established:
  - "Hook test stubs use vi.mock factory form with thenable mock builder + mockReturnValueOnce for multi-call sequences"
  - "editEntry optimistic: setEntries before await supabase.update(); no rollback needed for non-critical journal edits"

requirements-completed:
  - JOURNAL-01
  - JOURNAL-02
  - HISTORY-01
  - HISTORY-02

duration: 3min
completed: 2026-03-09
---

# Phase 4 Plan 02: Data Hooks Summary

**useJournal (full CRUD with optimistic updates) and useHistory (completionMap + fetchWinsForDate) implemented via TDD — 17 tests GREEN**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-09T17:21:16Z
- **Completed:** 2026-03-09T17:24:08Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `useJournal` hook: addEntry (server-confirmed insert), editEntry (optimistic + updated_at in payload), deleteEntry (optimistic remove), initial fetch ordered by created_at DESC
- `useHistory` hook: completionMap built from wins → check_ins FK join (true-wins semantics), fetchWinsForDate per-date query with check_ins shape
- Both hooks satisfy Wave 0 test stubs from 04-01: 17 tests GREEN, no regressions in prior 74 passing tests

## Task Commits

Each task was committed atomically:

1. **Task 1: useJournal hook** - `681632e` (feat)
2. **Task 2: useHistory hook** - `35e5704` (feat)

## Files Created/Modified

- `src/hooks/useJournal.js` - Journal CRUD hook: entries, loading, addEntry, editEntry (with updated_at), deleteEntry
- `src/hooks/useHistory.js` - History data hook: completionMap, loading, fetchWinsForDate

## Decisions Made

- `editEntry` always includes `updated_at: new Date().toISOString()` in the Supabase update payload. Supabase `DEFAULT now()` only fires on INSERT — there is no trigger for UPDATE on `journal_entries`.
- `completionMap` uses the wins → check_ins FK join direction (not check_ins → wins) because only `wins` has `win_date`. The `check_ins` table has no date column.
- `fetchWinsForDate` returns `data ?? []` to ensure it never throws when called before the completion map fetch resolves.
- `addEntry` is non-optimistic: waits for `.select().single()` before adding the row. Since there is no local ID conflict risk with journal entries, the simpler non-optimistic pattern was preferred.

## Deviations from Plan

None - plan executed exactly as written. The implementation code in the plan matched the test contracts precisely.

## Issues Encountered

None. The Wave 0 test stubs (created by 04-01) were confirmed RED (module-not-found) before implementation. Both hooks passed all tests on first implementation run.

Note: 5 Wave 2 component test files (JournalEntryCard, JournalEntryForm, JournalPage, DayDetail, Heatmap) remain RED — these are Wave 0 stubs created by 04-01 that require Wave 2 component implementations (04-03/04-04 scope). They were failing before this plan and are not regressions.

## Next Phase Readiness

- `useJournal` ready to be consumed by JournalPage (04-03) and JournalEntryForm/JournalEntryCard components
- `useHistory` ready for HistoryPage, Heatmap, and DayDetail components (04-04)
- No blockers for Wave 2

---
*Phase: 04-history-and-journal*
*Completed: 2026-03-09*
