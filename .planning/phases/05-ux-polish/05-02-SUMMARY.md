---
phase: 05-ux-polish
plan: 02
subsystem: ui
tags: [react, hooks, supabase, tailwind, css, layout, typography]

# Dependency graph
requires:
  - phase: 05-01
    provides: Wave 0 RED stubs for Header, DayStrip, TimerFocusOverlay, JournalEditorOverlay
provides:
  - useStreak returns { streak, journalStreak, loading } — prerequisite for Header dual-streak display
  - AppShell wraps Outlet in max-w-[600px] mx-auto — global layout constraint
  - index.css clamp() fluid typography tokens (--font-size-fluid-base, --font-size-fluid-sm)
  - WinCard borderless root with size={18} icons — Wave 2+ visual baseline
affects:
  - 05-03-header-and-streaks (needs journalStreak from useStreak)
  - 05-04-timer-focus-overlay (layout baseline set)
  - 05-05-journal-editor-overlay (layout baseline set)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Fluid clamp() font sizes as CSS custom properties in @theme inline, applied via @layer base
    - max-w-[600px] mx-auto wrapper inside main for page width constraint
    - journalStreak computed with same consecutive-day algorithm as wins streak, using getLocalDateString

key-files:
  created: []
  modified:
    - src/hooks/useStreak.js
    - src/components/layout/AppShell.jsx
    - src/index.css
    - src/components/wins/WinCard.jsx

key-decisions:
  - "journalStreak guards against missing/invalid created_at fields — defensive filter before Date construction"
  - "Fluid font sizes defined as @theme inline CSS vars and applied via @layer base .font-mono rule — Tailwind v4 compatible pattern"
  - "AppShell max-w container wraps only Outlet, not Header/BottomTabBar — full-width chrome, constrained content"

patterns-established:
  - "Fluid typography: define clamp() vars in @theme inline, apply in @layer base — not inline Tailwind classes"
  - "Layout constraint: single max-w wrapper in AppShell main, not per-page padding"

requirements-completed: []

# Metrics
duration: 8min
completed: 2026-03-10
---

# Phase 5 Plan 02: Global Layout Tokens + useStreak journalStreak Summary

**journalStreak added to useStreak hook, AppShell content constrained to 600px, clamp() fluid type tokens defined, WinCard borders removed and icons standardized to size={18}**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-10T03:06:00Z
- **Completed:** 2026-03-10T03:14:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Extended useStreak to query journal_entries and compute journalStreak via same consecutive-day algorithm as wins streak — enables Header dual-streak display in Wave 2
- Added global 600px max-width constraint to AppShell main content area, plus clamp() fluid typography custom properties in @theme inline
- Removed border-border from WinCard root and standardized all Lucide icon sizes to 18px

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend useStreak to return journalStreak** - `e5fe040` (feat)
2. **Task 2: Global layout container + clamp typography + borderless WinCard** - `cdd8743` (feat)

## Files Created/Modified

- `src/hooks/useStreak.js` — Added journalStreak state, second Supabase query for journal_entries, defensive created_at filter, updated return value
- `src/components/layout/AppShell.jsx` — Added max-w-[600px] mx-auto wrapper div around Outlet
- `src/index.css` — Added --font-size-fluid-base and --font-size-fluid-sm to @theme inline; added .font-mono fluid size rule in @layer base
- `src/components/wins/WinCard.jsx` — Removed border border-border from root div; updated all icon sizes from 14 to 18

## Decisions Made

- Guarded journal `created_at` mapping against undefined/invalid Date values — when existing useStreak tests use `mockReturnValue` (not `mockReturnValueOnce`), both Supabase calls receive the same check_ins mock which lacks `created_at`. Filter prevents Invalid Date exceptions and keeps pre-existing tests GREEN.
- Fluid font sizes applied via `@layer base .font-mono` rule rather than per-element Tailwind classes — establishes a global baseline that all font-mono elements inherit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added created_at validation guard in journal date mapping**
- **Found during:** Task 1 (implement journalStreak in useStreak)
- **Issue:** Pre-existing useStreak tests use `mockReturnValue` (persistent, not Once), so both Supabase from() calls receive the check_ins mock. Journal rows then lack `created_at`, causing `new Date(undefined)` = Invalid Date, which throws in `getLocalDateString` and hangs loading.
- **Fix:** Added `.filter(row => row.created_at)` and NaN guard before calling `getLocalDateString` on journal rows
- **Files modified:** src/hooks/useStreak.js
- **Verification:** All 8 useStreak tests GREEN (5 existing + 3 new journalStreak)
- **Committed in:** e5fe040 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing input validation)
**Impact on plan:** Required for correctness — test suite and real usage both benefit from the guard. No scope creep.

## Issues Encountered

None — plan logic was clear. The only issue was the mock interaction in tests, handled via Rule 2 auto-fix above.

## Next Phase Readiness

- useStreak now returns `{ streak, journalStreak, loading }` — Header can destructure journalStreak directly
- AppShell layout constraint is in place — Wave 2 page work builds on correct baseline
- WinCard visual baseline set — borderless cards with 18px icons ready for Wave 2 acceptance checkpoint

---
*Phase: 05-ux-polish*
*Completed: 2026-03-10*

## Self-Check: PASSED

- src/hooks/useStreak.js: FOUND
- src/components/layout/AppShell.jsx: FOUND
- src/index.css: FOUND
- src/components/wins/WinCard.jsx: FOUND
- .planning/phases/05-ux-polish/05-02-SUMMARY.md: FOUND
- Commit e5fe040: FOUND
- Commit cdd8743: FOUND
