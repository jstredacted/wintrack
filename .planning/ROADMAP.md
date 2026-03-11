# Roadmap: wintrack

## Overview

wintrack ships the daily discipline loop in four phases. Phase 1 lays the data foundation — schema, RLS, theme system, and date utilities that every subsequent phase depends on. Phase 2 delivers the primary product act: declaring wins through a Typeform-style full-screen flow, with per-win focus tracking built in. Phase 3 closes the daily loop: evening check-in, in-app prompts, and streak tracking. Phase 4 completes v1 with journal and visual history — the retrospective layer that makes the discipline loop meaningful over time.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Supabase schema, RLS, theme system, and date utilities — infrastructure every phase depends on (completed 2026-03-09)
- [x] **Phase 2: Win Logging & Focus Tracking** - Full-screen Typeform-style win input, win management, and per-win stopwatch (completed 2026-03-09)
- [x] **Phase 3: Daily Loop Closure** - Evening check-in, in-app prompts, and streak counter (completed 2026-03-09)
- [x] **Phase 4: History & Journal** - Journal entries, past-day browsing, and visual completion history (completed 2026-03-10)
- [x] **Phase 5: UX Polish** - Fluid typography, TimerFocusOverlay, JournalEditorOverlay, DayStrip, and dual-streak header (completed 2026-03-10)
- [x] **Phase 6: Animations, Micro-interactions & Overlay Fixes** - Full-app press feedback, overlay animation fixes, StreakCelebration, HistoryPage crossfade (completed 2026-03-11)

## Phase Details

### Phase 1: Foundation
**Goal**: The data layer and design system are in place so all feature phases can build on a stable, correct base
**Depends on**: Nothing (first phase)
**Requirements**: SHELL-01, SHELL-02
**Success Criteria** (what must be TRUE):
  1. User can toggle between dark and light mode and the preference persists across page reloads
  2. App renders with the Nothing Phone-inspired black/white design language — dot grid patterns, monospaced type, no color accents — in both dark and light modes
  3. Supabase schema exists with all three tables (wins, check_ins, journal_entries) including timer columns, and RLS is enabled before any application code runs
  4. A date utility (getLocalDateString) is in place that uses the browser's local timezone — not UTC — preventing streak boundary corruption
**Plans**: 5 plans

Plans:
- [x] 01-01-PLAN.md — Vitest setup and test stubs (Wave 0)
- [x] 01-02-PLAN.md — Supabase schema, JWT script, client, and date utility
- [x] 01-03-PLAN.md — React Router app shell with routing, layout, and pages
- [x] 01-04-PLAN.md — Design system: Geist Mono, dot grid, dark mode toggle
- [x] 01-05-PLAN.md — Visual acceptance checkpoint

### Phase 2: Win Logging & Focus Tracking
**Goal**: Users can declare their daily wins through a focused, frictionless input flow and track focused time per win
**Depends on**: Phase 1
**Requirements**: WIN-01, WIN-02, WIN-03, WIN-04, TIMER-01, TIMER-02, TIMER-03
**Success Criteria** (what must be TRUE):
  1. User can create a win using a full-screen step-by-step flow where the screen transitions to the next prompt on each submission — keyboard and mouse both work
  2. User can edit the text of an existing win and delete a win from today's list
  3. User can roll incomplete wins from yesterday into today — a confirmation step is shown before rolls occur
  4. User can start, stop, and pause a stopwatch on any win; the elapsed time shown on the win card is correct after a page refresh and after the tab has been in the background
  5. Today's view shows total focused time summed across all wins for the day
**Plans**: 5 plans

Plans:
- [x] 02-01-PLAN.md — Install motion + zustand, create all test stubs (Wave 1)
- [x] 02-02-PLAN.md — useStopwatch hook, useWins data hook, Zustand uiStore (Wave 2)
- [x] 02-03-PLAN.md — WinInputOverlay + WinList (Wave 3, parallel with 02-03)
- [x] 02-04-PLAN.md — WinCard + RollForwardPrompt (Wave 3, parallel with 02-04)
- [x] 02-05-PLAN.md — TotalFocusTime + wire TodayPage + visual checkpoint (Wave 4)

### Phase 3: Daily Loop Closure
**Goal**: The accountability loop closes each night — check-in captures completion, in-app prompts appear at the right times, and the streak counter reflects consecutive days of follow-through
**Depends on**: Phase 2
**Requirements**: CHECKIN-01, CHECKIN-02, CHECKIN-03, CHECKIN-04, STREAK-01
**Success Criteria** (what must be TRUE):
  1. User can complete an evening check-in that steps through each win with a yes/no and an optional reflection note, and win statuses are saved on completion
  2. App displays a morning prompt at 9am if no wins have been logged for today, and an evening prompt at 9pm if check-in has not been completed
  3. App shows browser push notification stubs for the 9am and 9pm times with documented path to v2 implementation (no actual push delivery in v1)
  4. Streak counter increments on days where at least one win is marked complete, displays correctly on the today view, and does not corrupt across timezone boundaries
**Plans**: 5 plans

Plans:
- [x] 03-01-PLAN.md — Wave 0 test stubs: all 6 test files for CHECKIN-01 through STREAK-01
- [x] 03-02-PLAN.md — useStreak, useCheckin, notifications.js, uiStore extension (Wave 1)
- [x] 03-03-PLAN.md — CheckInOverlay component (Wave 2, parallel with 03-04)
- [x] 03-04-PLAN.md — MorningPrompt + EveningPrompt components (Wave 2, parallel with 03-03)
- [x] 03-05-PLAN.md — Wire Header + TodayPage + visual acceptance checkpoint (Wave 3)

### Phase 4: History & Journal
**Goal**: Users can reflect on their discipline over time — browsing past wins, reviewing completion patterns, and writing daily journal entries
**Depends on**: Phase 3
**Requirements**: JOURNAL-01, JOURNAL-02, JOURNAL-03, HISTORY-01, HISTORY-02
**Success Criteria** (what must be TRUE):
  1. User can write a daily journal entry with a title and body, edit it later, and delete it
  2. User can browse past journal entries in a list view sorted by date
  3. User can browse any past day's wins and see whether each win was marked complete or incomplete
  4. App shows a visual calendar or heatmap where days with at least one completed win are visually distinguished from days without
**Plans**: 5 plans

Plans:
- [x] 04-01-PLAN.md — Wave 0 test stubs: all 7 test files for JOURNAL-01 through HISTORY-02
- [x] 04-02-PLAN.md — useJournal hook + useHistory hook (Wave 1)
- [x] 04-03-PLAN.md — Journal components + JournalPage (Wave 2, parallel with 04-04)
- [x] 04-04-PLAN.md — History components + HistoryPage (Wave 2, parallel with 04-03)
- [x] 04-05-PLAN.md — Full suite gate + visual acceptance checkpoint (Wave 3)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 5/5 | Complete    | 2026-03-09 |
| 2. Win Logging & Focus Tracking | 5/5 | Complete   | 2026-03-09 |
| 3. Daily Loop Closure | 5/5 | Complete   | 2026-03-09 |
| 4. History & Journal | 5/5 | Complete   | 2026-03-10 |
| 5. UX Polish | 5/5 | Complete   | 2026-03-10 |
| 6. Animations, Micro-interactions & Overlay Fixes | 8/8 | Complete | 2026-03-11 |
| 7. Cleanup & Contract Fixes | 1/1 | Complete | 2026-03-11 |

### Phase 5: UX Polish

**Goal:** All major surfaces are polished to a cohesive, high-quality finish — fluid typography, focused timer overlay, immersive journal editor, intuitive day-strip history, and dual streak tracking in the header
**Requirements**: (polish pass — no new v1 requirement IDs)
**Depends on:** Phase 4
**Plans:** 5/5 plans executed

Plans:
- [x] 05-01-PLAN.md — Wave 0 RED test stubs for all new Phase 5 components
- [x] 05-02-PLAN.md — Global layout container, clamp() typography, useStreak journalStreak, borderless WinCard
- [x] 05-03-PLAN.md — TimerFocusOverlay full-screen bento + TotalFocusTime count-up animation
- [x] 05-04-PLAN.md — JournalEditorOverlay full-screen slide-up editor with word count + summary
- [x] 05-05-PLAN.md — DayStrip replaces Heatmap, greeting header, dual-streak Header + visual acceptance

### Phase 6: Animations, micro-interactions, and overlay fixes

**Goal:** All original UX friction bugs are resolved, every interactive element across the app has tactile press feedback, and list/content transitions replace snapping with smooth animation — a cohesive, polished feel throughout
**Requirements**: FIX-01, FIX-02, FIX-03, FIX-04, FIX-05
**Depends on:** Phase 5
**Plans:** 8/8 plans complete

Plans:
- [x] 06-01-PLAN.md — Wave 0 stubs + FIX-01: remove 4-win cap, TodayPage.test.jsx, saving-state stub (Wave 1)
- [x] 06-02-PLAN.md — FIX-02 + FIX-04: TodayPage AnimatePresence flash fix + journal exit easing (Wave 2, parallel)
- [x] 06-03-PLAN.md — FIX-03 + FIX-05: journal save crossfade + saving state + active:scale (Wave 2, parallel)
- [x] 06-04-PLAN.md — NEW-BUG-01: StreakCelebration state-machine refactor — fix broken animation + add exit (Wave 2, parallel)
- [x] 06-05-PLAN.md — Press feedback: WinCard, TimerFocusOverlay, RollForwardPrompt, TodayPage buttons (Wave 2, parallel)
- [x] 06-06-PLAN.md — Press feedback: CheckInOverlay, MorningPrompt, EveningPrompt, SideNav, Journal surfaces (Wave 2, parallel)
- [x] 06-07-PLAN.md — Animations: DayStrip press feedback, DayDetail note height animation, HistoryPage date crossfade (Wave 2, parallel)
- [x] 06-08-PLAN.md — Visual acceptance checkpoint (Wave 3)

### Phase 7: Cleanup & Contract Fixes

**Goal:** Remove dead code left over from Phase 5's component replacements, fix the useHistory env consistency gap, forward the missing editingId prop in JournalPage, and backfill Phase 5 documentation artifacts
**Requirements**: (gap closure — no new v1 requirement IDs)
**Gap Closure:** Closes audit tech debt from v1.0-MILESTONE-AUDIT.md
**Depends on:** Phase 6
**Plans:** 1/1 plans executed

Plans:
- [x] 07-01-PLAN.md — Dead code removal, env fix, editingId prop forward, Phase 5 docs
