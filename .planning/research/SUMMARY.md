# Project Research Summary

**Project:** wintrack v2.1 — Finance Redesign & UI Rehaul
**Domain:** Personal finance ledger — continuous timeline, budget tracking, recurring debt, fixed sidebar
**Researched:** 2026-03-23
**Confidence:** HIGH

## Executive Summary

wintrack v2.1 is a finance ledger redesign that replaces the existing month-navigation pattern (MonthBarrel) with a continuous scrollable timeline, adds per-category budget spending caps, recurring debt tracking with flexible payment logging, and a fixed right sidebar showing live balance and year projections. The research confirms this can be built entirely within the existing stack — zero new npm packages are required. The only additions are four shadcn/ui component scaffolds (Accordion, Collapsible, ScrollArea, Separator) that use Radix primitives already installed at `radix-ui ^1.4.3`, plus four new Supabase tables and a CSS brand color token.

The recommended approach is a dependency-first build order: database schema and hooks before UI components, layout skeleton before data content, current month before past months. The most consequential architectural change is replacing the single-month `useFinance` hook with a `useLedgerMonths` batch hook that fetches the current month (with upsert) and past months (read-only, no upsert) in a single coordinated request. Past month sections render as collapsed summaries and mount their sub-hooks lazily only when expanded, avoiding the 12-RPC fan-out that would otherwise serialize at the database level.

The two highest-risk areas are the multi-month data loading strategy (which must be a single batch RPC, not per-section calls) and the balance carry-forward chain (which corrupts silently when past months are edited without cascading `starting_balance` updates). Both must be designed at the schema and hook level before any UI work begins. The CSS accent color change (`#7CF5A5`) carries a separate risk: it must use a new `--brand` token and must never overwrite the existing `--accent` token, which shadcn/ui uses internally for hover states throughout the component library.

---

## Key Findings

### Recommended Stack

The existing stack handles every v2.1 requirement. No new runtime packages. Four shadcn CLI scaffolds pull Radix components already installed: `bunx shadcn@latest add accordion collapsible scroll-area separator`. The ledger layout uses CSS Grid with independent overflow columns — no layout library needed. The accent color uses the existing `@theme inline` pattern in `index.css`.

**Core technologies:**
- Radix Accordion (via shadcn, already installed): collapsible month sections with keyboard nav and WAI-ARIA — `type="multiple"`, `defaultValue={[currentMonth]}`
- CSS Grid with `position: sticky` inside flex columns: two-panel finance layout, no JavaScript overhead, mobile collapse via `hidden lg:flex`
- Supabase additive migration `016_debts_and_budgets.sql`: four new tables in one atomic migration — no changes to existing schema except an optional `category` column on `bill_templates`
- Tailwind v4 `@theme inline`: `--color-brand: var(--brand)` generates all `bg-brand` / `text-brand` / `border-brand` utilities — must use `oklch()` not raw hex for opacity modifier support (`bg-brand/50`)

### Expected Features

Based on competitor analysis of YNAB, Monarch Money, Copilot Money, Kualto, and Undebt.it:

**Must have (table stakes — v2.1 ships with these):**
- Continuous scrollable timeline replacing MonthBarrel navigation — central UX shift
- Collapsible past-month sections (accordion, default-closed, read-only on expand)
- Four distinct expense categories: fixed monthly, recurring debts, one-off, budget envelopes
- Budget spending caps with per-category quick-log expense entry
- Recurring debt tracking: name, remaining balance, minimum payment, flexible payment logging
- Balance carry-forward (closing balance feeds next month's opening balance)
- Fixed sidebar on desktop: current balance, projected end-of-month balance
- App-wide `#7CF5A5` accent color pass

**Should have (ship with v2.1 if time permits):**
- Projected end-of-month balance formula: `current_balance + remaining_income - unpaid_bills - remaining_debt_minimums`
- Year overview compact table in sidebar (reuse existing data, new render location)
- Debt balance progress bar within each debt card (remaining / original)

**Defer to v2.2+:**
- Debt payoff date projection — requires interest rate input, misleading when reality diverges from model
- Budget rollover between months — state machine complexity, violates clean monthly resets
- Financial journal entries surfaced within timeline month sections
- Export/import of ledger data

### Architecture Approach

FinancePage is fully rewritten as a two-column flex layout: scrollable ledger column and sticky sidebar. FinancePage manages its own scroll context using `h-full overflow-hidden` on its outer div with `overflow-y-auto` only on the ledger column — AppShell's `<main>` scroll stays intact for other pages. Each MonthSection mounts its own sub-hooks (`useBills`, `useDebts`, `useBudgetExpenses`, `useOneOffIncome`) and receives only a `monthId` prop, avoiding prop-drilling through the timeline. The module-level `monthCache` is replaced with a Zustand `financeStore` keyed by `YYYY-MM` so writes are reflected immediately across all consumers including the sidebar.

**Major components (new):**
1. `LedgerTimeline` — scrollable container of MonthSection accordion items, renders current + N past months
2. `MonthSection` — single month with collapsed summary row (past) or expanded four-section view (current/opened)
3. `FinanceSidebar` — fixed right panel: balance, projected EOM balance, YearOverviewTable
4. `RecurringDebtsSection` — debt cards with remaining balance display and per-month payment log
5. `BudgetsSection` — budget caps with inline quick-log expense entry popover
6. `useLedgerMonths(count)` — batch multi-month loader; calls ensure/populate only for current month, fetches past months read-only

**Reused unchanged:** `useBills`, `useBalanceHistory`, `useOneOffIncome`, `useExchangeRate`, `useYearOverview`, `BalanceDisplay`, `BalanceHistoryModal`, `BalanceSparkline`, `IncomeChecklistCard`, all non-finance components and hooks, all existing Supabase RPCs.

### Critical Pitfalls

1. **12-RPC fan-out on ledger load** — calling `useFinance` or `ensure_month_exists` per visible month fires 12 simultaneous RPCs that serialize at the DB level, causing 800ms+ load times. Avoid by writing a single `initialize_ledger` RPC that creates missing months in one transaction. Only call populate RPCs for the current month. Past months are read-only fetches.

2. **Balance chain corruption on past-month edits** — `starting_balance` is written once at month creation and never updated. Editing a past month's balance leaves all subsequent months with stale opening balances silently. Avoid by either cascading the update one month forward in `apply_balance_override`, or always computing `starting_balance` from `previous_month.current_balance` at display time (recommended for a continuous ledger).

3. **Module-level `monthCache` serves stale data in multi-month view** — the current per-month cache invalidation assumes one active month. With 12 months mounted, a write to March only invalidates March's cache entry while the sidebar may still read stale March data. Replace with a Zustand `financeStore` keyed by `YYYY-MM` that all consumers subscribe to reactively.

4. **`--accent` token overwrite breaks shadcn hover states** — shadcn/ui Nova preset uses `--accent` for all `hover:bg-accent` states across Button, DropdownMenu, Select, and NavigationMenu. Assigning `#7CF5A5` to `--accent` turns all hover states bright green. Introduce a new `--brand` token exclusively for product-specific coloring.

5. **`overflow-hidden` on two-column wrapper breaks `position: sticky`** — the existing FinancePage uses `overflow-hidden` for its horizontal slide container. This ancestor breaks sticky positioning. Remove `overflow-hidden` entirely from the new two-column wrapper; apply `overflow-y-auto` only to the ledger column.

---

## Implications for Roadmap

The research reveals a clear dependency graph. Data and layout must exist before content components. Past month behavior (read-only, collapsed) must be enforced in the data layer before the accordion UI is wired. The accent color sweep is non-functional and should be a final pass to avoid re-work as new components are built throughout earlier phases.

### Phase 1: Database & Type Foundation
**Rationale:** All new hooks and components depend on the schema. Schema must be additive and atomic. No UI work can proceed without generated types. CSS token defined early prevents any component being built with the wrong color pattern.
**Delivers:** Migration `016_debts_and_budgets.sql` (4 new tables with RLS), regenerated `database.types.ts`, extended `types/finance.ts` with Debt / Budget / BudgetExpense interfaces, `--brand` / `--color-brand` CSS token added to `index.css`.
**Addresses:** Recurring debt schema, budget schema, brand color token foundation.
**Avoids:** Partial migration risk (all 4 tables in one atomic migration), `--accent` overwrite pitfall (brand token defined correctly from the start with a separate name).

### Phase 2: Core Data Hooks
**Rationale:** All timeline components need hooks before they can render real data. Writing and testing hooks in isolation before UI complexity is added prevents bugs from being masked by rendering concerns.
**Delivers:** `useLedgerMonths(count)` (batch multi-month loader with Zustand store), `useDebts(monthId)`, `useBudgets()`, `useBudgetExpenses(monthId)`.
**Addresses:** Multi-month data loading without fan-out, balance carry-forward computation, Zustand store replacing module-level cache.
**Avoids:** 12-RPC fan-out pitfall, stale module cache pitfall. Balance chain integrity logic lives here and is tested in isolation.

### Phase 3: Layout Skeleton
**Rationale:** The two-column layout and AppShell scroll interaction must be confirmed working before sidebar and ledger content are built into it. Getting the container structure right first prevents rework when sticky positioning fails in an unexpected overflow context.
**Delivers:** FinancePage two-column flex skeleton (ledger column + sidebar column), `overflow-y-auto` only on ledger column, AppShell integration confirmed on desktop and mobile.
**Addresses:** Fixed sidebar layout (table stakes).
**Avoids:** `overflow-hidden` ancestor breaking sticky, AppShell `<main>` scroll conflict (use `h-full overflow-hidden` on FinancePage outer div), iOS Safari fixed-inside-overflow bug (use sticky not fixed).

### Phase 4: Finance Sidebar
**Rationale:** Sidebar depends on balance data from `useLedgerMonths` (Phase 2) and the layout skeleton (Phase 3). It reads existing data — no new mutations — so it is the safest first content to build after the layout is confirmed.
**Delivers:** `FinanceSidebar` with current balance, projected EOM balance, `YearOverviewTable` extracted from YearOverviewPage and rendered in the compact sidebar format.
**Uses:** CSS sticky within flex column, existing `useYearOverview` hook, existing `BalanceDisplay` and `BalanceSparkline` components.
**Implements:** Fixed sidebar architecture pattern with its own `overflow-y-auto`.

### Phase 5: Ledger Timeline — Current Month
**Rationale:** Build the current month fully before tackling multi-month collapse. This confirms all hooks and section components work together with real data before the past-months layer adds collapse state machine complexity.
**Delivers:** `LedgerTimeline` container, `MonthSection` (current, always expanded), `FixedBillsSection`, `IncomeSection`, `OneOffIncomeSection`, `RecurringDebtsSection` with payment log, `BudgetsSection` with quick-log inline entry.
**Addresses:** Four expense categories, budget spending caps with quick-log, recurring debt tracking with flexible payments, balance carry-forward display.
**Avoids:** Debt `remaining_balance` drift (atomic payment RPC, or computed-not-stored strategy decided in Phase 1 planning), budget expense race condition (disable log button during in-flight request, atomic RPC for balance update).

### Phase 6: Past Month Collapse
**Rationale:** Past month behavior — collapsed summary row, lazy sub-hook hydration, read-only enforcement — is a separate concern from rendering the current month correctly. Layering it on top of a working Phase 5 reduces risk.
**Delivers:** Multi-month accordion rendering in `LedgerTimeline`, collapsed past months showing single summary row (month name, ending balance, income total, expense total), lazy sub-hook mounting when user expands, past-month read-only enforcement at the query level.
**Addresses:** Collapsible past months (table stakes), balance chain integrity visible across months.
**Avoids:** DOM bloat (collapsed months render summary only, not full section trees), balance chain stale display (computed `starting_balance` from Phase 2 applies here).

### Phase 7: Accent Color Sweep
**Rationale:** Non-functional cosmetic pass. Doing it last avoids re-work as new components are added in Phases 3–6. All existing and new components receive the `--brand` treatment in a single coordinated pass with a full visual regression check.
**Delivers:** `text-brand` / `bg-brand` applied to nav active states, checkmarks, progress bar fills, current month indicator, balance numbers. Dark mode verification. Accessibility check confirming brand color is only used decoratively, never as text on light backgrounds (fails WCAG AA at 1.8:1 contrast on white).
**Avoids:** shadcn hover states turning green (`--accent` remains untouched throughout), OKLCH conversion verified (`oklch(0.88 0.14 154)` confirmed for `#7CF5A5`).

### Phase Ordering Rationale

- Schema precedes hooks (Phase 1 → 2): hooks depend on generated TypeScript types from the migration.
- Layout precedes content (Phase 3 → 4/5): sidebar and ledger content built into an unconfirmed scroll container creates rework when sticky positioning fails.
- Current month before past months (Phase 5 → 6): past month collapse adds state machine complexity (expanded/collapsed, lazy loading, read-only) that is easier to layer on a proven current-month view.
- Sidebar before ledger content (Phase 4 → 5): sidebar reads data only, no mutations, lower risk. Confirms data hooks work before complex section components depend on them.
- Accent sweep last (Phase 7): building all new components in existing monochrome style first, then a single color pass, avoids incremental re-work and allows the full regression check to happen once.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Core Hooks):** The `useLedgerMonths` batch RPC design has no direct precedent in the existing codebase. The `initialize_ledger_range` RPC logic needs careful design to handle the case where some months exist and some do not, without row-level lock contention across months for the same user.
- **Phase 5 (Recurring Debts):** The decision between stored `remaining_balance` (fast read, drift risk) and computed `remaining_balance` (always correct, minor query cost) must be finalized before the first debt payment RPC is written. Recommendation: computed is safer for a personal app with < 100 debts.

Phases with standard patterns (can skip research-phase):
- **Phase 1 (Schema):** Additive migration pattern is established across 15 prior migrations. RLS and `search_path` conventions are directly replicable.
- **Phase 3 (Layout):** CSS Grid two-column sticky sidebar is a well-documented pattern with exact code confirmed in ARCHITECTURE.md.
- **Phase 4 (Sidebar):** Reuses existing `useYearOverview` and `BalanceDisplay` — component extraction, no new data patterns.
- **Phase 7 (Accent Color):** Token pattern fully specified in both STACK.md and ARCHITECTURE.md with exact CSS values and propagation strategy.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Based on direct codebase inspection; zero new packages required; Radix dependency confirmed installed; CSS token pattern confirmed in existing `index.css` |
| Features | MEDIUM | Drawn from competitor analysis (YNAB, Monarch, Copilot, Undebt.it); no direct user research; feature set reflects standard ledger patterns with appropriate scope limits |
| Architecture | HIGH | Directly derived from codebase inspection of 12,891 LOC; all patterns grounded in what already exists; anti-patterns identified from actual code paths |
| Pitfalls | HIGH | Each pitfall traced to a specific file and line number in the existing codebase; not speculative — these are verified failure modes |

**Overall confidence:** HIGH

### Gaps to Address

- **Balance carry-forward strategy:** PITFALLS.md identifies two valid approaches — cascade `starting_balance` on override vs. always compute from `previous_month.current_balance` at display time. Must choose before Phase 2 hooks are written. Recommendation: always-computed is safer for a continuous ledger where users can edit any past month.
- **`remaining_balance` storage for debts:** Stored column (fast, drift risk on payment edits/reverts) vs. computed join (always correct, minor query cost for < 100 debts). Must decide before Phase 5 RPC is written. Recommendation: computed, eliminates an entire class of consistency bugs.
- **Projected EOM balance formula scope:** FEATURES.md defines it as `current_balance + remaining_expected_income - unpaid_fixed_bills - remaining_budget_caps`. Must also account for debt minimum payments. Finalize formula during Phase 4 planning.
- **AppShell `<main>` overflow:** ARCHITECTURE.md confirms two options. Option 2 — keep `overflow-y-auto` on `<main>`, use `h-full overflow-hidden` on FinancePage outer div — is recommended and must be confirmed working on all viewport sizes in Phase 3 before committing.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `src/` (12,891 LOC TypeScript) — architecture patterns, hook structure, CSS token set
- `supabase/migrations/001–015` — schema baseline, established RLS patterns, RPC conventions
- `src/index.css` — `@theme inline` pattern, `--accent` token usage, existing OKLCH color values
- [Tailwind CSS v4 — Theme Variables](https://tailwindcss.com/docs/theme) — `@theme inline` color variable mapping and utility generation
- [Radix UI Accordion](https://www.radix-ui.com/primitives/docs/components/accordion) — `type="multiple"`, keyboard navigation, height animation
- [shadcn/ui component docs](https://ui.shadcn.com/docs/components) — Accordion, Collapsible, ScrollArea install commands and API

### Secondary (MEDIUM confidence)
- YNAB, Monarch Money, Copilot Money — feature expectations and UX patterns for ledger-style finance views
- [Kualto](https://www.kualto.com/) — cash flow projection sidebar patterns
- [Undebt.it](https://undebt.it/) — flexible payment (debt snowflake) UX, remaining balance display
- CSS-Tricks / MDN — sticky sidebar with independent overflow columns

### Tertiary (LOW confidence)
- Debt payoff app UX patterns (InCharge, Debt Payoff Planner) — payment logging interaction details; specific implementation choices need validation during Phase 5 planning

---
*Research completed: 2026-03-23*
*Ready for roadmap: yes*
