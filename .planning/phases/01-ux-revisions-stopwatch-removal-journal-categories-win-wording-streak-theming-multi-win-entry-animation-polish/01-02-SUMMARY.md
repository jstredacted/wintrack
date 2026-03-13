---
phase: 01-ux-revisions
plan: 02
subsystem: ui
tags: [react, overlay, multi-win, intentions, wording]

# Dependency graph
requires:
  - phase: 01-ux-revisions plan 01
    provides: WinInputOverlay without stopwatch (clean base for multi-win changes)
provides:
  - WinInputOverlay supporting multi-win entry — stays open after each submit, shows submitted list, Done/Escape closes
  - TodayPage with intention-oriented wording ("Set intentions" button)
  - onDone prop contract on WinInputOverlay for caller-controlled close
affects:
  - Any future plan that renders WinInputOverlay (must pass onDone or rely on onClose fallback)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Multi-win entry overlay: submit keeps open, re-focus input, accumulate list, Done/Escape closes"
    - "onDone prop falls back to onClose for backward compatibility"
    - "Reset submitted list on open=true via useEffect"

key-files:
  created: []
  modified:
    - src/components/wins/WinInputOverlay.jsx
    - src/pages/TodayPage.jsx

key-decisions:
  - "onDone prop falls back to onClose when not provided — backward compatible with existing tests and callers"
  - "submittedTitles reset on open=true useEffect — fresh session each time overlay opens"
  - "Escape key calls handleDone (onDone ?? onClose) — consistent with Done button behavior"
  - "Each win saved to DB immediately via onSubmit — no batch; individual saves maintain existing data contract"

patterns-established:
  - "Multi-win overlay: onSubmit saves single title, list accumulates locally, onDone dismisses all"

requirements-completed: [UX-03, UX-04]

# Metrics
duration: 1min
completed: 2026-03-13
---

# Phase 01 Plan 02: Win Wording and Multi-Win Entry Summary

**Multi-win entry overlay with intention-oriented wording — stays open per submit, shows accumulated list, Done/Escape closes; button renamed "Set intentions"**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-13T23:14:57Z
- **Completed:** 2026-03-13T23:15:59Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- WinInputOverlay now supports multi-win entry — submitting a title keeps the overlay open, appends the title to a visible list, resets and re-focuses the input
- Done button appears after first submission; Escape key also dismisses via onDone
- TodayPage button and aria-label updated from "Log a win" to "Set intentions"
- onDone prop wired in TodayPage; onSubmit handler no longer calls closeInputOverlay

## Task Commits

Each task was committed atomically:

1. **Task 1: Add multi-win support to WinInputOverlay** - `5ab63af` (feat)
2. **Task 2: Update TodayPage wording and wire onDone** - `e2580e2` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/components/wins/WinInputOverlay.jsx` - Multi-win support: onDone prop, submittedTitles state, Done button, submitted list, reset/re-focus on submit
- `src/pages/TodayPage.jsx` - "Set intentions" wording, onDone wiring, onSubmit no longer closes overlay

## Decisions Made
- onDone falls back to onClose when not provided — all 5 existing WinInputOverlay tests continue passing without modification
- Each title saved to DB immediately via onSubmit (not batched) — preserves existing data contract, no DB changes needed
- submittedTitles reset inside the `open` useEffect rather than a separate effect — single effect handles all open-state transitions cleanly

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Multi-win overlay complete; ready for streak theming (01-03) or any plan that renders WinInputOverlay
- onDone contract established — callers should prefer onDone over onClose for intentional close (onClose remains as fallback)

---
*Phase: 01-ux-revisions*
*Completed: 2026-03-13*
