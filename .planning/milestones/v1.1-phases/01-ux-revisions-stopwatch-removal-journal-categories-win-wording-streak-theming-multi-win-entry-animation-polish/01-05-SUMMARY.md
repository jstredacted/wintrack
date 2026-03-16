---
phase: 01-ux-revisions
plan: 05
subsystem: ui
tags: [react, zustand, supabase, dev-tools, testing]

# Dependency graph
requires:
  - phase: 01-01
    provides: DB schema and supabase client with USER_ID/USER_JWT pattern
provides:
  - Dev tools panel accessible via Ctrl+Shift+D keyboard shortcut
  - Seed actions for wins, yesterday streak data, and journal entries
  - Clear today's data action for quick test reset
affects: [testing, 01-ux-revisions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "import.meta.env.DEV gate on component render and useEffect — zero production footprint"
    - "createPortal to document.body for overlay components"
    - "uiStore devToolsOpen boolean with toggleDevTools/closeDevTools actions"

key-files:
  created:
    - src/components/dev/DevToolsPanel.jsx
  modified:
    - src/stores/uiStore.js
    - src/components/layout/AppShell.jsx

key-decisions:
  - "Static import of DevToolsPanel in AppShell — tree-shaking removes it from production bundle via import.meta.env.DEV conditional render"
  - "clearToday deletes journal entries by created_at range (today's local date boundaries) not win_date — journal_entries has no win_date column"
  - "seedYesterdayComplete inserts check_ins referencing inserted win IDs — preserves FK constraint without CASCADE assumption"

patterns-established:
  - "Dev-only panels: static import + import.meta.env.DEV render gate, keyboard shortcut registered in useEffect with same DEV guard"

requirements-completed: [UX-08]

# Metrics
duration: 3min
completed: 2026-03-13
---

# Phase 01 Plan 05: Dev Tools Panel Summary

**Keyboard-triggered dev tools overlay (Ctrl+Shift+D) with Supabase seed actions for wins, streak data, and journal entries, gated to development mode only.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-13T15:15:04Z
- **Completed:** 2026-03-13T15:18:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- DevToolsPanel component with 4 seed actions (today wins, yesterday complete, journal entry, clear today) rendered as a portal overlay with monochrome font-mono styling
- Ctrl+Shift+D keyboard shortcut wired in AppShell, guarded behind import.meta.env.DEV so no listener or render cost in production
- uiStore extended with devToolsOpen, toggleDevTools, closeDevTools — all 117 existing tests continue to pass

## Task Commits

1. **Task 1: Create DevToolsPanel component** - `057e2b6` (feat)
2. **Task 2: Wire DevToolsPanel in AppShell with keyboard shortcut** - `bad8e84` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/dev/DevToolsPanel.jsx` - Portal overlay with 4 seed/clear actions, monochrome styling, backdrop dismiss
- `src/stores/uiStore.js` - Added devToolsOpen state, toggleDevTools, closeDevTools actions
- `src/components/layout/AppShell.jsx` - Added useEffect keyboard shortcut, conditional DevToolsPanel render, useUIStore destructures

## Decisions Made

- Static import of DevToolsPanel (not dynamic) — Vite/Rollup tree-shakes unreachable branches behind `import.meta.env.DEV` constant, so panel code doesn't appear in production bundle
- `clearToday` deletes journal entries by `created_at` timestamp range for today's local date boundaries, not win_date, because `journal_entries` has no `win_date` column
- `seedYesterdayComplete` explicitly maps inserted win IDs to check_in rows — safer than relying on CASCADE assumption at test-data time

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Dev tooling complete; can now rapidly seed data scenarios for testing multi-win entry, streak display, and journal category flows in subsequent plans
- No blockers

---
*Phase: 01-ux-revisions*
*Completed: 2026-03-13*
