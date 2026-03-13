# Roadmap: wintrack

## Milestones

- ✅ **v1.0 Daily Discipline Loop** — Phases 1-7 (shipped 2026-03-11)

## Phases

<details>
<summary>✅ v1.0 Daily Discipline Loop (Phases 1-7) — SHIPPED 2026-03-11</summary>

- [x] Phase 1: Foundation (5/5 plans) — completed 2026-03-09
- [x] Phase 2: Win Logging & Focus Tracking (5/5 plans) — completed 2026-03-09
- [x] Phase 3: Daily Loop Closure (5/5 plans) — completed 2026-03-09
- [x] Phase 4: History & Journal (5/5 plans) — completed 2026-03-10
- [x] Phase 5: UX Polish (5/5 plans) — completed 2026-03-10
- [x] Phase 6: Animations, Micro-interactions & Overlay Fixes (8/8 plans) — completed 2026-03-11
- [x] Phase 7: Cleanup & Contract Fixes (1/1 plans) — completed 2026-03-11

Full details: .planning/milestones/v1.0-ROADMAP.md

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | 5/5 | Complete   | 2026-03-13 | 2026-03-09 |
| 2. Win Logging & Focus Tracking | v1.0 | 5/5 | Complete | 2026-03-09 |
| 3. Daily Loop Closure | v1.0 | 5/5 | Complete | 2026-03-09 |
| 4. History & Journal | 1/3 | In Progress|  | 2026-03-10 |
| 5. UX Polish | v1.0 | 5/5 | Complete | 2026-03-10 |
| 6. Animations & Overlay Fixes | v1.0 | 8/8 | Complete | 2026-03-11 |
| 7. Cleanup & Contract Fixes | v1.0 | 1/1 | Complete | 2026-03-11 |

### Phase 1: UX revisions — stopwatch removal, journal categories, win wording, streak theming, multi-win entry, animation polish

**Goal:** Remove the stopwatch feature, add journal categories, update win entry wording to intention-oriented language, replace fire emoji with monochrome streak icon, make streak celebration persistent, add multi-win entry, and create dev tools for testing.
**Requirements**: [UX-01, UX-02, UX-03, UX-04, UX-05, UX-06, UX-07, UX-08]
**Depends on:** v1.0 (complete)
**Plans:** 5/5 plans complete

Plans:
- [ ] 01-01-PLAN.md — Stopwatch removal and DB migration
- [ ] 01-02-PLAN.md — Win wording change and multi-win entry
- [ ] 01-03-PLAN.md — Journal categories (DB + editor + card badges)
- [ ] 01-04-PLAN.md — Streak icon and celebration polish
- [ ] 01-05-PLAN.md — Dev tools panel for test data seeding

### Phase 2: Win item interactions and timeline display — inline strikethrough, timeline-style history view

**Goal:** Add inline win completion toggle with strikethrough styling on the Today page, and redesign the history DayDetail as a vertical dot-and-line timeline with colored accents for completion state.
**Requirements**: [INT-01, INT-02, INT-03, TIMELINE-01, TIMELINE-02]
**Depends on:** Phase 1
**Plans:** 2 plans

Plans:
- [ ] 02-01-PLAN.md — Inline strikethrough toggle (DB migration + useWins + WinCard)
- [ ] 02-02-PLAN.md — Timeline-style history DayDetail redesign

### Phase 3: Categories and reporting — item categorization dropdown, per-category completion counts

**Goal:** Add win categorization (work/personal/health) with a button-row selector in WinInputOverlay, category badges on WinCard and DayDetail timeline, and per-category completion counts on TodayPage.
**Requirements**: [CAT-01, CAT-02, CAT-03, CAT-04, CAT-05]
**Depends on:** Phase 2
**Plans:** 2 plans

Plans:
- [ ] 03-01-PLAN.md — DB migration, useWins category support, WinInputOverlay selector, TodayPage wiring
- [ ] 03-02-PLAN.md — WinCard and DayDetail badges, CategorySummary component, visual checkpoint

### Phase 4: User profiles and settings — user system, night owl day cycle, check-in schedule, consistency graph and streak

**Goal:** Build a user settings system with Supabase persistence and localStorage caching, implement night-owl day boundary offset (configurable dayStartHour shifts "today" for late-night users), make morning/evening prompt hours configurable, add a GitHub-style 84-day consistency heatmap, and create a Settings page accessible from SideNav.
**Requirements**: [SETTINGS-01, SETTINGS-02, NIGHTOWL-01, NIGHTOWL-02, NIGHTOWL-03, SCHEDULE-01, HEATMAP-01, SETTINGSUI-01]
**Depends on:** Phase 3
**Plans:** 1/3 plans executed

Plans:
- [ ] 04-01-PLAN.md — Settings infrastructure (DB migration, settingsStore, useSettings hook, night-owl getLocalDateString)
- [ ] 04-02-PLAN.md — Night owl threading (dayStartHour through useStreak, useWins, TodayPage, DayStrip, uiStore)
- [ ] 04-03-PLAN.md — Settings UI + consistency heatmap (SettingsPage, ConsistencyGraph, SideNav, routing)

### Phase 5: Push notifications — web push with service workers and cloud compute setup

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 4
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 5 to break down)

### Phase 6: UI simplification — remove check-in flow, journal FAB button with Nothing design

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 5
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 6 to break down)

### Phase 7: Unified daily view — merge Today and History pages with DayStrip carousel navigation

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 6
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 7 to break down)
