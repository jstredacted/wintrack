# Roadmap: wintrack

## Overview

wintrack ships the daily discipline loop in four phases. Phase 1 lays the data foundation — schema, RLS, theme system, and date utilities that every subsequent phase depends on. Phase 2 delivers the primary product act: declaring wins through a Typeform-style full-screen flow, with per-win focus tracking built in. Phase 3 closes the daily loop: evening check-in, in-app prompts, and streak tracking. Phase 4 completes v1 with journal and visual history — the retrospective layer that makes the discipline loop meaningful over time.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Supabase schema, RLS, theme system, and date utilities — infrastructure every phase depends on (completed 2026-03-09)
- [ ] **Phase 2: Win Logging & Focus Tracking** - Full-screen Typeform-style win input, win management, and per-win stopwatch
- [ ] **Phase 3: Daily Loop Closure** - Evening check-in, in-app prompts, and streak counter
- [ ] **Phase 4: History & Journal** - Journal entries, past-day browsing, and visual completion history

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
- [ ] 01-02-PLAN.md — Supabase schema, JWT script, client, and date utility
- [ ] 01-03-PLAN.md — React Router app shell with routing, layout, and pages
- [ ] 01-04-PLAN.md — Design system: Geist Mono, dot grid, dark mode toggle
- [ ] 01-05-PLAN.md — Visual acceptance checkpoint

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
**Plans**: TBD

### Phase 3: Daily Loop Closure
**Goal**: The accountability loop closes each night — check-in captures completion, in-app prompts appear at the right times, and the streak counter reflects consecutive days of follow-through
**Depends on**: Phase 2
**Requirements**: CHECKIN-01, CHECKIN-02, CHECKIN-03, CHECKIN-04, STREAK-01
**Success Criteria** (what must be TRUE):
  1. User can complete an evening check-in that steps through each win with a yes/no and an optional reflection note, and win statuses are saved on completion
  2. App displays a morning prompt at 9am if no wins have been logged for today, and an evening prompt at 9pm if check-in has not been completed
  3. App shows browser push notification stubs for the 9am and 9pm times with documented path to v2 implementation (no actual push delivery in v1)
  4. Streak counter increments on days where at least one win is marked complete, displays correctly on the today view, and does not corrupt across timezone boundaries
**Plans**: TBD

### Phase 4: History & Journal
**Goal**: Users can reflect on their discipline over time — browsing past wins, reviewing completion patterns, and writing daily journal entries
**Depends on**: Phase 3
**Requirements**: JOURNAL-01, JOURNAL-02, JOURNAL-03, HISTORY-01, HISTORY-02
**Success Criteria** (what must be TRUE):
  1. User can write a daily journal entry with a title and body, edit it later, and delete it
  2. User can browse past journal entries in a list view sorted by date
  3. User can browse any past day's wins and see whether each win was marked complete or incomplete
  4. App shows a visual calendar or heatmap where days with at least one completed win are visually distinguished from days without
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 5/5 | Complete    | 2026-03-09 |
| 2. Win Logging & Focus Tracking | 0/TBD | Not started | - |
| 3. Daily Loop Closure | 0/TBD | Not started | - |
| 4. History & Journal | 0/TBD | Not started | - |
