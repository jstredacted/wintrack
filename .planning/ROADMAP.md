# Roadmap: wintrack

## Milestones

- ✅ **v1.0 Daily Discipline Loop** — Phases 1-7 (shipped 2026-03-16)
- 📋 **v2.0 Finance & Platform** — Phases 1-5 (planned)

## Phases

<details>
<summary>✅ v1.0 Daily Discipline Loop (Phases 1-7) — SHIPPED 2026-03-16</summary>

- [x] Phase 1: UX Revisions (5/5 plans) — completed 2026-03-13
- [x] Phase 2: Win Interactions & Timeline (2/2 plans) — completed 2026-03-14
- [x] Phase 3: Categories & Reporting (2/2 plans) — completed 2026-03-14
- [x] Phase 4: User Settings & Night Owl (3/3 plans) — completed 2026-03-14
- [x] Phase 5: Push Notifications (3/3 plans) — completed 2026-03-16
- [x] Phase 6: UI Simplification (2/2 plans) — completed 2026-03-16
- [x] Phase 7: Unified Daily View (1/1 plan) — completed 2026-03-16

Full details: .planning/milestones/v1.0-ROADMAP.md

</details>

### v2.0 Finance & Platform

- [x] **Phase 1: Dev Workflow & TypeScript Foundation** - Branch strategy, mobile dev server, TypeScript setup and migration (completed 2026-03-16)
- [ ] **Phase 2: PIN Authentication** - PIN gate with setup flow, session management, idle timeout
- [ ] **Phase 3: Finance Core** - Balance model, budget tracking, income streams, month navigation
- [ ] **Phase 4: Finance Extended** - Bills management, dashboard views, external balances
- [ ] **Phase 5: Journal Rich Text & Mobile** - Tiptap editor integration, responsive layout across all pages

## Phase Details

### Phase 1: Dev Workflow & TypeScript Foundation
**Goal**: Codebase runs in TypeScript with a proper branch strategy for dev vs production
**Depends on**: Nothing (first phase of v2.0)
**Requirements**: DW-01, DW-02, DW-03, TS-01, TS-02, TS-03, TS-04
**Success Criteria** (what must be TRUE):
  1. Running `bun run dev` serves the app with `--host` flag, accessible from phone on local network
  2. Dev tools panel only appears on the develop branch and is absent from main
  3. All .jsx/.js source files have been converted to .tsx/.ts and `tsc --noEmit` passes
  4. Supabase database types are generated and imported in hooks/services
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Dev workflow setup: develop branch, --host flag, TypeScript install, tsconfig, Supabase types, dev tools env gating, ESLint
- [ ] 01-02-PLAN.md — TypeScript migration: rename all 39 source files (.js/.jsx to .ts/.tsx) with type annotations
- [ ] 01-03-PLAN.md — Migration completion: rename test/config files, enable strict mode, fix type errors

### Phase 2: PIN Authentication
**Goal**: User's data is gated behind a PIN lock screen on every app load
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Success Criteria** (what must be TRUE):
  1. First-time user sees a PIN setup flow (enter + confirm) before accessing the app
  2. Returning user must enter their PIN on app load; incorrect PIN shows error and does not unlock
  3. App stays unlocked during active use but locks after 15 minutes of inactivity
  4. Static JWT environment variables are removed; PIN hash stored in Supabase replaces the old auth mechanism
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — Foundation: DB migration (pin_hash column), hashPin utility, pinStore, usePinAuth hook, useIdleTimer hook, CSS keyframes
- [ ] 02-02-PLAN.md — UI + integration: PinDots, PinScreen, PinSetup components, PinGate layout route, router wiring, blur overlay

### Phase 3: Finance Core
**Goal**: User can track their current balance, set a monthly budget, configure income sources, and navigate between months
**Depends on**: Phase 2
**Requirements**: BAL-01, BAL-02, BAL-03, BAL-04, BAL-05, BUD-01, BUD-02, INC-01, INC-02, INC-03, INC-04, INC-05, INC-06, FIN-01
**Success Criteria** (what must be TRUE):
  1. User sees their current balance on the Finance page and can manually override it at any time
  2. User can configure income sources (name, amount, currency, conversion method, payday) in Settings and toggle them as received per month
  3. Receiving income auto-adds net PHP amount to balance (USD sources show converted amount after Wise/PayPal fees)
  4. User can set a monthly budget limit and sees a progress visualization showing paid expenses vs budget
  5. MonthStrip navigation lets user move between months; current balance carries forward as next month's starting point
**Plans**: 4 plans

Plans:
- [ ] 03-01-PLAN.md — DB migrations, RPC functions, TypeScript types, currency and month utilities
- [ ] 03-02-PLAN.md — React hooks: useFinance, useExchangeRate, useIncomeConfig with unit tests
- [ ] 03-03-PLAN.md — Finance page UI: MonthStrip, BalanceHero, BudgetGauge, IncomeCard, route wiring
- [ ] 03-04-PLAN.md — Income Sources Settings section + visual verification checkpoint

### Phase 4: Finance Extended
**Goal**: User can manage bills with recurrence, view financial dashboards, and track external investment balances
**Depends on**: Phase 3
**Requirements**: BILL-01, BILL-02, BILL-03, BILL-04, BILL-05, BILL-06, BILL-07, FIN-02, FIN-03, FIN-04, FIN-05, EXT-01, EXT-02, EXT-03
**Success Criteria** (what must be TRUE):
  1. User can add bills with recurrence rules (one-time, recurring N months, ongoing) and toggle them as paid (deducting from balance)
  2. Recurring/ongoing bills auto-appear each month; one-time bills disappear after payment; unpaid bills highlight by due date urgency
  3. Current month shows a waterfall view of balance cascading as each bill is paid; past months are read-only; future months show projections
  4. Year overview displays 12 months with balance trajectory, total income, and total expenses
  5. User can enter Polymarket Bot and SOL DCA balances which display alongside cash balance for a total net worth view
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

### Phase 5: Journal Rich Text & Mobile
**Goal**: Journal entries support rich formatting and all pages work well on mobile devices
**Depends on**: Phase 4
**Requirements**: JRNL-01, JRNL-02, JRNL-03, JRNL-04, MOB-01, MOB-02, MOB-03, MOB-04, MOB-05, MOB-06, MOB-07
**Success Criteria** (what must be TRUE):
  1. User can format journal entries with bold, italic, lists, and headings using keyboard shortcuts (no visible toolbar)
  2. Existing plain-text journal entries render correctly without data loss after Tiptap migration
  3. SideNav collapses to a bottom tab bar on mobile widths; all pages are usable on 430px width with no horizontal scroll
  4. All interactive elements meet 44x44px touch targets; finance pages use stacked layout on mobile
  5. DayStrip centers the selected day with proper carousel scrolling on touch devices
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-7 | v1.0 | 18/18 | Complete | 2026-03-16 |
| 1. Dev Workflow & TS Foundation | 3/3 | Complete   | 2026-03-16 | - |
| 2. PIN Authentication | v2.0 | 1/2 | In Progress | - |
| 3. Finance Core | v2.0 | 0/4 | Not started | - |
| 4. Finance Extended | v2.0 | 0/TBD | Not started | - |
| 5. Journal Rich Text & Mobile | v2.0 | 0/TBD | Not started | - |
