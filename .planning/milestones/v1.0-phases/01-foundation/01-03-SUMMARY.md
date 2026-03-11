---
phase: 01-foundation
plan: "03"
subsystem: ui
tags: [react-router, routing, layout, navigation, spa]

# Dependency graph
requires:
  - phase: 01-02
    provides: getLocalDateString() utility used in TodayPage
  - phase: 01-04
    provides: ThemeToggle component imported in Header
provides:
  - React Router v7 three-route SPA (/, /history, /journal)
  - AppShell layout with sticky header and fixed bottom tab bar
  - TodayPage empty state displaying local date
  - HistoryPage and JournalPage placeholder screens
affects: [02-wins, 03-checkin, 04-analytics]

# Tech tracking
tech-stack:
  added: [react-router@7]
  patterns: [createBrowserRouter with Component key, AppShell layout route, NavLink active-state via isActive callback]

key-files:
  created:
    - src/App.jsx
    - src/components/layout/AppShell.jsx
    - src/components/layout/Header.jsx
    - src/components/layout/BottomTabBar.jsx
    - src/pages/TodayPage.jsx
    - src/pages/HistoryPage.jsx
    - src/pages/JournalPage.jsx
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Import from 'react-router' (not 'react-router-dom') — v7 consolidated the packages"
  - "NavLink 'end' prop on '/' tab prevents Today from matching /history and /journal"
  - "Bottom tab bar uses env(safe-area-inset-bottom) via inline style for iOS notch support"
  - "Header imports ThemeToggle defensively — plan 03 and 04 run in same wave so import resolves at build time"

patterns-established:
  - "Layout route pattern: AppShell as Component with children rendered via <Outlet />"
  - "TABS config array drives BottomTabBar — adding a route means adding one object to TABS"
  - "Page empty states use min-h-[calc(100svh-7rem)] to account for 48px header + 56px tab bar"
  - "All layout components live in src/components/layout/, theme components in src/components/theme/"

requirements-completed: [SHELL-01, SHELL-02]

# Metrics
duration: 2min
completed: 2026-03-09
---

# Phase 1 Plan 03: App Shell and Routing Summary

**React Router v7 three-route SPA with AppShell layout, sticky header, bottom tab navigation, and Today empty state showing local date**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-09T13:10:25Z
- **Completed:** 2026-03-09T13:12:08Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Installed react-router v7 and wired three-route SPA (/, /history, /journal) using createBrowserRouter
- Created AppShell layout route with sticky Header (wintrack wordmark + ThemeToggle) and fixed BottomTabBar (NavLink active-state, safe-area inset)
- Created TodayPage empty state with local date display via getLocalDateString(), plus HistoryPage and JournalPage placeholders

## Task Commits

Each task was committed atomically:

1. **Task 1: Install react-router and create routing + layout shell** - `49e038d` (feat)
2. **Task 2: Create page components with placeholder content** - `09c33b3` (feat)

## Files Created/Modified

- `src/App.jsx` - React Router v7 createBrowserRouter config with AppShell layout route and 3 child routes
- `src/components/layout/AppShell.jsx` - Root layout: Header, Outlet, BottomTabBar
- `src/components/layout/Header.jsx` - Sticky header with wintrack wordmark and ThemeToggle
- `src/components/layout/BottomTabBar.jsx` - Fixed bottom nav with Today/History/Journal NavLinks and active styling
- `src/pages/TodayPage.jsx` - Today empty state: local date + "No wins logged yet"
- `src/pages/HistoryPage.jsx` - Placeholder: "Past wins will appear here"
- `src/pages/JournalPage.jsx` - Placeholder: "Daily entries will appear here"
- `package.json` / `package-lock.json` - Added react-router dependency

## Decisions Made

- Import from `react-router` not `react-router-dom` — v7 consolidated the packages into one
- Used `Component:` key (not `element:`) in router config — required for React Router v7 route objects
- `end` prop on the Today NavLink prevents `/` from matching on /history and /journal routes
- Header imports ThemeToggle directly since Plan 04 (ThemeToggle) runs in the same wave and both were already built

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- App shell is fully established — feature phases (2-4) replace page content without touching routing or layout
- Three routes render into persistent layout; bottom tab bar switches between them
- TodayPage respects the Plan 02 getLocalDateString() contract — ready for wins integration
