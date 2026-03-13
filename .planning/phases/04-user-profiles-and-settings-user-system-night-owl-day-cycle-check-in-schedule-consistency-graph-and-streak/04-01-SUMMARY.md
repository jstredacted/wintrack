---
phase: 04-user-profiles-and-settings
plan: 01
subsystem: settings-infrastructure
tags: [settings, night-owl, zustand, supabase, localStorage]
dependency_graph:
  requires: []
  provides: [useSettingsStore, useSettings, getLocalDateString-dayStartHour]
  affects: [streak-calculation, check-in-schedule, day-boundary]
tech_stack:
  added: []
  patterns: [zustand-localStorage-cache, supabase-upsert-defaults]
key_files:
  created:
    - supabase/migrations/005_user_settings.sql
    - src/stores/settingsStore.js
    - src/stores/settingsStore.test.js
    - src/hooks/useSettings.js
    - src/hooks/useSettings.test.js
  modified:
    - src/lib/utils/date.js
    - src/lib/utils/date.test.js
decisions:
  - "settingsStore uses create((set) => ...) pattern matching uiStore.js"
  - "useSettings upserts defaults when no Supabase row exists — ensures row always present"
  - "getLocalDateString uses setDate for DST-safe day rollback — not millisecond subtraction"
metrics:
  duration: 2min
  completed: "2026-03-13T17:33:00Z"
---

# Phase 04 Plan 01: Settings Infrastructure Summary

Zustand settings store with localStorage cache, Supabase persistence hook with auto-upsert defaults, and night-owl-aware getLocalDateString using DST-safe day rollback.

## What Was Built

### Task 1: DB migration + settingsStore + useSettings hook
- **Migration**: `005_user_settings.sql` with `day_start_hour` (0-6), `morning_prompt_hour` (5-14), `evening_prompt_hour` (17-23) CHECK constraints, RLS per-operation policies
- **settingsStore**: Zustand store reads from `wintrack-settings` localStorage key on init, `setSettings` writes cache + updates state, defaults `{dayStartHour: 0, morningPromptHour: 9, eveningPromptHour: 21}`
- **useSettings hook**: Fetches from Supabase on mount, upserts defaults if no row, `saveSettings(partial)` merges and persists
- **Commit**: `a179d4b`

### Task 2: Enhanced getLocalDateString with night-owl offset
- Added optional `dayStartHour` parameter (default 0, fully backward compatible)
- When `dayStartHour > 0` and current hour < offset, returns previous calendar date
- Uses `setDate(getDate() - 1)` for DST safety
- 7 new test cases covering offset=0/4/6 at various times
- **Commit**: `b30fc1d`

## Test Results

- 26 test files, 143 tests, all passing
- New: 3 settingsStore tests, 3 useSettings tests, 7 date offset tests (13 new total)
- Zero regressions

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

1. **settingsStore pattern**: `create((set) => ...)` single-parens matching uiStore.js (Zustand v5 without middleware)
2. **Auto-upsert defaults**: useSettings inserts default row on first load when no Supabase row exists
3. **DST-safe rollback**: `adjusted.setDate(adjusted.getDate() - 1)` not millisecond subtraction
