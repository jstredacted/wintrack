---
phase: 06-animations-micro-interactions-and-overlay-fixes
plan: 02
subsystem: ui
tags: [react, animation, css, motion, tailwind]

# Dependency graph
requires:
  - phase: 06-01
    provides: TimerFocusOverlay add-slot and TodayPage timer integration
provides:
  - TodayPage AnimatePresence without mode='wait' — cross-fade prevents blank gap on timer open
  - index.css .journal-overlay-exit at 0.22s cubic-bezier(0.4, 0, 1, 1) — snappier dismiss
affects:
  - 06-03
  - 06-04

# Tech tracking
tech-stack:
  added: []
  patterns:
    - AnimatePresence without mode='wait' for cross-fade transitions — prevents blank gap when state briefly re-flips

key-files:
  created: []
  modified:
    - src/pages/TodayPage.jsx
    - src/index.css

key-decisions:
  - "AnimatePresence cross-fade (no mode prop) vs mode='wait' — removes blank gap when timer open triggers brief loading re-flip"
  - "Journal exit easing: 0.22s cubic-bezier(0.4,0,1,1) ease-in vs 0.3s spring — snappier dismiss without changing entry"

patterns-established:
  - "Asymmetric overlay animation: slower spring entry (0.35s) + faster ease-in exit (0.22s) for decisive dismiss feel"

requirements-completed: [FIX-02, FIX-04]

# Metrics
duration: 2min
completed: 2026-03-10
---

# Phase 6 Plan 02: AnimatePresence cross-fade and journal exit easing Summary

**Removed `mode="wait"` from TodayPage content AnimatePresence and tuned journal overlay exit from 0.3s spring to 0.22s ease-in for snappier dismiss**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-10T14:15:25Z
- **Completed:** 2026-03-10T14:16:34Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- TodayPage AnimatePresence now uses cross-fade (no `mode` prop) — eliminates blank gap when timer overlay opens and briefly flips `loading` state
- Journal overlay exit uses `0.22s cubic-bezier(0.4, 0, 1, 1)` — 27% faster and uses ease-in curve, feels decisive vs the entry spring

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix FIX-02 — remove mode="wait" from TodayPage AnimatePresence** - `7df6c2c` (fix)
2. **Task 2: Fix FIX-04 — tune journal exit easing in index.css** - `b7df15b` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/pages/TodayPage.jsx` - Removed `mode="wait"` from AnimatePresence wrapping loading/content transition
- `src/index.css` - Changed `.journal-overlay-exit` from `0.3s cubic-bezier(0.32, 0.72, 0, 1)` to `0.22s cubic-bezier(0.4, 0, 1, 1)`

## Decisions Made
- `mode="wait"` forces sequential exit-then-enter; removing it allows cross-fade which prevents blank gap when a brief `loading` re-flip occurs (e.g. when timer start triggers state updates)
- Journal exit kept intentionally asymmetric from entry: entry stays at 0.35s spring (feels welcoming), exit at 0.22s ease-in (feels responsive and decisive)

## Deviations from Plan

None - plan executed exactly as written.

**Note on pre-existing test failure:** `JournalEditorOverlay.test.jsx` "shows Saving... on Save button while async onSave is pending" was already failing before this plan's changes (verified by stash test). This is out of scope and logged to deferred-items.

## Issues Encountered
- Pre-existing test failure in `JournalEditorOverlay.test.jsx` (Saving... button state test). Confirmed pre-existing via git stash verification. Not introduced by this plan.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both surgical fixes are complete; no impact on any other component
- Phase 6 Plans 03+ can proceed: animation micro-interactions for WinCard, DayStrip, header elements

## Self-Check: PASSED

- src/pages/TodayPage.jsx — FOUND
- src/index.css — FOUND
- 06-02-SUMMARY.md — FOUND
- Commit 7df6c2c — FOUND
- Commit b7df15b — FOUND

---
*Phase: 06-animations-micro-interactions-and-overlay-fixes*
*Completed: 2026-03-10*
