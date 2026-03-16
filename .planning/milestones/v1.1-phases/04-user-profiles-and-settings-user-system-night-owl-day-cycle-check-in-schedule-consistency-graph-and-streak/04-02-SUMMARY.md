---
phase: 04-user-profiles-and-settings
plan: 02
subsystem: ui
tags: [react, zustand, night-owl, settings, hooks]

requires:
  - phase: 04-user-profiles-and-settings plan 01
    provides: settingsStore with dayStartHour, useSettings hook, getLocalDateString with offset
provides:
  - dayStartHour threaded through useStreak, useWins, useHistory, uiStore
  - TodayPage, DayStrip, HistoryPage use configurable day boundary
  - Prompt hours from settings replace hardcoded 9/21 in TodayPage
affects: [05-push-notifications, 06-ui-simplification, 07-unified-daily-view]

tech-stack:
  added: []
  patterns: [useSettingsStore selector pattern for dayStartHour across hooks]

key-files:
  created: []
  modified:
    - src/hooks/useStreak.js
    - src/hooks/useWins.js
    - src/hooks/useHistory.js
    - src/pages/TodayPage.jsx
    - src/stores/uiStore.js
    - src/components/history/DayStrip.jsx
    - src/pages/HistoryPage.jsx

key-decisions:
  - "useSettingsStore selector used directly in hooks and components — avoids prop drilling dayStartHour"
  - "Prompt hours read from settings in TodayPage greeting/prompt logic — no more hardcoded >= 9 or >= 21"

patterns-established:
  - "Settings threading: import useSettingsStore, select dayStartHour, pass to getLocalDateString"

requirements-completed: [NIGHTOWL-02, NIGHTOWL-03, SCHEDULE-01]

duration: 13min
completed: 2026-03-14
---

# Plan 04-02: Thread Night-Owl Offset Summary

**dayStartHour from settings threaded through all date-dependent hooks, pages, and components**

## Performance

- **Duration:** 13 min
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Every getLocalDateString call in production code now passes dayStartHour from settings
- TodayPage prompt logic uses configurable morningPromptHour/eveningPromptHour instead of hardcoded 9/21
- DayStrip, HistoryPage, and uiStore all respect night-owl day boundary

## Task Commits

1. **Task 1: Thread dayStartHour through hooks and uiStore** - `897b852` (feat)
2. **Task 2: Thread settings through TodayPage, DayStrip, HistoryPage** - `1005876` (feat)

## Files Created/Modified
- `src/hooks/useStreak.js` - dayStartHour passed to getLocalDateString in streak calculation
- `src/hooks/useWins.js` - dayStartHour for win date grouping
- `src/hooks/useHistory.js` - dayStartHour for completion map date keys
- `src/pages/TodayPage.jsx` - configurable prompt hours, dayStartHour for greeting/date
- `src/stores/uiStore.js` - dayStartHour for selectedDate initialization
- `src/components/history/DayStrip.jsx` - dayStartHour for cell date generation
- `src/pages/HistoryPage.jsx` - dayStartHour for date display

## Decisions Made
- Used useSettingsStore selector directly in hooks rather than prop drilling — cleaner, consistent with existing Zustand patterns
- Removed hardcoded hour checks (>= 9, >= 21) in favor of settings-driven values

## Deviations from Plan
None - plan executed as written

## Issues Encountered
None

## User Setup Required
None

## Next Phase Readiness
- All date-dependent code paths now respect night-owl settings
- Ready for Settings UI (04-03) to let users configure these values

---
*Phase: 04-user-profiles-and-settings*
*Completed: 2026-03-14*
