---
phase: 05-journal-rich-text-and-mobile
plan: "01"
subsystem: history-and-wins
tags: [bugfix, dayStartHour, night-owl, heatmap, rollover]
dependency_graph:
  requires: []
  provides: [correct-daystrip-dates, nan-safe-heatmap, filtered-rollover]
  affects: [DayStrip, ConsistencyGraph, useWins]
tech_stack:
  added: []
  patterns: [Intl.DateTimeFormat en-CA for YYYY-MM-DD, Number() coercion for NaN safety, Supabase .eq filter chaining]
key_files:
  created: []
  modified:
    - src/components/history/DayStrip.tsx
    - src/components/history/DayStrip.test.tsx
    - src/components/history/ConsistencyGraph.tsx
    - src/components/history/ConsistencyGraph.test.tsx
    - src/hooks/useWins.ts
    - src/hooks/useWins.test.ts
decisions:
  - DayStrip derives all cell labels from logicalToday (offset-aware) rather than raw calendar Date, ensuring dateStr/dayAbbr/dateNum always agree
  - ConsistencyGraph uses Number(entry.completed) || 0 instead of direct addition to guard against undefined
  - yesterdayWins query adds .eq('completed', false) — server-side filter rather than client-side exclusion
metrics:
  duration: 8min
  completed_date: "2026-03-18"
  tasks_completed: 2
  files_modified: 6
---

# Phase 5 Plan 01: dayStartHour Bug Fixes Summary

Three surgical bug fixes ensuring correct behavior for night-owl users (dayStartHour > 0).

## What Was Built

**MOB-07 — DayStrip date label mismatch:** When `dayStartHour > 0` and the time was before the offset (e.g., 2:30 AM with `dayStartHour=3`), the raw calendar `Date` object `d` produced wrong labels. `dateStr` was correctly offset-adjusted but `dayAbbr` and `dateNum` showed the calendar day (today), creating a visible mismatch. Fixed by computing `logicalToday = getLocalDateString(new Date(), dayStartHour)` first, then building all cell dates backward from that offset-aware base.

**MOB-08 — ConsistencyGraph NaN wins count:** When `cell.entry.completed` was `undefined` (a partial object shape), direct addition produced `NaN`. Fixed with `Number(cell.entry.completed) || 0` guarding the accumulation. Also updated two existing tests that were using `.className.includes()` on SVG `<rect>` elements (which have `SVGAnimatedString`, not a plain string) — replaced with `data-intensity` attribute assertions.

**MOB-09 — Rollover including completed wins:** The `yesterdayWins` Supabase query had no filter on `completed`, so yesterday's already-done wins appeared in the rollover prompt. Added `.eq('completed', false)` to the query chain — server-side filter is cleaner than client-side exclusion.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Fix DayStrip date mismatch + ConsistencyGraph NaN | c002563 |
| 2 | Fix rollover prompt including completed wins | 311a1dd |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed pre-existing ConsistencyGraph test failures**
- **Found during:** Task 1 verification
- **Issue:** Two existing tests used `.className.includes()` on SVG `<rect>` elements. `SVGAnimatedString` is not a plain string so `.includes` throws `TypeError`. Tests were already broken before this plan.
- **Fix:** Updated assertions to use `data-intensity` attribute (already set by component) instead of className string matching.
- **Files modified:** `src/components/history/ConsistencyGraph.test.tsx`
- **Commit:** c002563

## Self-Check: PASSED
