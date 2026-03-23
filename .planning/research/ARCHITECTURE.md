# Architecture Research

**Domain:** Personal finance tracker — v2.1 continuous ledger, budgets, recurring debts, fixed sidebar, accent color
**Researched:** 2026-03-23
**Confidence:** HIGH — based on direct codebase inspection, not speculation

---

## Current Architecture (v2.0 baseline)

```
App.tsx (createBrowserRouter)
  PinGate (auth wrapper)
    AppShell
      SideNav (fixed-left 56px on desktop / bottom tab bar on mobile)
      <main className="ml-0 sm:ml-14 flex-1 overflow-y-auto">
        <Outlet />   ← TodayPage | JournalPage | FinancePage | SettingsPage

Stores:   uiStore (overlays, streak key, devtools)
          settingsStore (user prefs + localStorage cache)
          pinStore (auth state)

Finance hooks (all scoped to a single month at a time):
  useFinance(selectedMonth)      ← months row + monthly_income
  useBills(monthId)              ← monthly_bills + bill_templates
  useBalanceHistory(monthId)     ← balance_changes
  useOneOffIncome(monthId)       ← oneoff_income
  useExchangeRate()              ← live USD/PHP rate
  useYearOverview(year)          ← get_year_overview RPC
  useIncomeConfig()              ← income_sources settings

Finance page state: selectedMonth string ("YYYY-MM"), all hooks chained from it
Finance page shape: MonthBarrel header > horizontal slide (Overview | Cards)
```

---

## Schema State (v2.0 — what exists in Supabase today)

```
months              (id, user_id, year, month, starting_balance, current_balance, budget_limit)
income_sources      (id, user_id, name, amount, currency, conversion_method, payday_day, active)
monthly_income      (id, user_id, month_id→months, income_source_id→income_sources, expected_amount,
                     currency, conversion_method, exchange_rate, fee_amount, net_php, received, received_at)
bill_templates      (id, user_id, name, amount, due_day, recurrence_type, recurrence_count,
                     recurrence_end, start_month, active)
monthly_bills       (id, user_id, month_id→months, bill_template_id→bill_templates,
                     name, amount, due_day, paid, paid_at)
balance_changes     (id, user_id, month_id→months, old_balance, new_balance, delta, note, created_at)
oneoff_income       (id, user_id, month_id→months, amount, date, note, created_at, updated_at)

RPCs:
  ensure_month_exists(p_user_id, p_year, p_month)  → months row
  populate_monthly_income(p_user_id, p_month_id)   → upserts monthly_income
  populate_monthly_bills(p_user_id, p_month_id, p_year, p_month) → upserts monthly_bills
  apply_balance_override(p_month_id, p_new_balance, p_note) → updates + writes balance_changes
  apply_income_received(p_monthly_income_id, p_received, p_net_php, p_exchange_rate, p_fee_amount)
  apply_bill_paid(p_monthly_bill_id, p_paid)
  apply_oneoff_income(p_user_id, p_month_id, p_amount, p_date, p_note)
  delete_oneoff_income(p_oneoff_id)
  revert_balance_change(p_change_id)
  get_year_overview(p_user_id, p_year) → MonthSummary[]
```

---

## System Overview: v2.1 Target Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         AppShell                                │
│  ┌──────────┐  ┌──────────────────────────────────────────┐    │
│  │ SideNav  │  │              <Outlet />                   │    │
│  │ (56px)   │  │                                          │    │
│  │ fixed    │  │  FinancePage (v2.1 redesign)             │    │
│  │ left     │  │  ┌─────────────────┐ ┌────────────────┐  │    │
│  │          │  │  │  Ledger Panel   │ │  Finance       │  │    │
│  │          │  │  │  (scrollable    │ │  Sidebar       │  │    │
│  │          │  │  │  main content)  │ │  (fixed/sticky │  │    │
│  │          │  │  │                 │ │  right panel)  │  │    │
│  │          │  │  └─────────────────┘ └────────────────┘  │    │
│  └──────────┘  └──────────────────────────────────────────┘    │
│                                                                  │
│  Mobile: SideNav → bottom tab bar                               │
│          Sidebar → collapses to card at top                     │
└────────────────────────────────────────────────────────────────┘

Finance page layout (desktop):
  ml-14 (SideNav offset) + two-column: ledger | sidebar
  Ledger: overflow-y-auto, full height
  Sidebar: sticky top-0, fixed height, own scroll

Finance page layout (mobile):
  Sidebar card at top (balance + projected)
  Ledger sections stack below
```

---

## Component Responsibilities

| Component | Responsibility | New vs Modified |
|-----------|----------------|-----------------|
| `AppShell` | Shell layout wrapper | Unchanged |
| `SideNav` | Nav + streak + lock | Unchanged |
| `FinancePage` | Root orchestrator for all finance state | Full rewrite |
| `FinanceSidebar` | Fixed panel: balance, projections, year table | New |
| `LedgerTimeline` | Scrollable month sections container | New |
| `MonthSection` | Single month: collapsed (past) or expanded (current) | New |
| `FixedBillsSection` | Fixed monthly bills list with inline add/edit | New |
| `RecurringDebtsSection` | Debt tracker with payment log + remaining balance | New |
| `BudgetsSection` | Budget caps with quick-log expense input | New |
| `OneOffIncomeSection` | Ad-hoc income entries | Renamed/refactored from OneOffCard |
| `IncomeSection` | Income sources checklist | Refactored from IncomeChecklistCard |
| `BalanceDisplay` | Current balance + history indicator | Reused in sidebar |
| `BalanceHistoryModal` | Balance change audit trail | Reused as-is |
| `YearOverviewTable` | 12-month summary in sidebar | New (extract from YearOverviewPage) |
| `BudgetExpenseLog` | Quick-log inline form inside BudgetsSection | New |

---

## Recommended Project Structure

```
src/
├── components/
│   ├── finance/
│   │   ├── sidebar/
│   │   │   ├── FinanceSidebar.tsx       ← new
│   │   │   └── YearOverviewTable.tsx    ← new (extracted from YearOverviewPage)
│   │   ├── ledger/
│   │   │   ├── LedgerTimeline.tsx       ← new
│   │   │   ├── MonthSection.tsx         ← new
│   │   │   ├── FixedBillsSection.tsx    ← new (absorbs BillsCard.tsx)
│   │   │   ├── RecurringDebtsSection.tsx ← new
│   │   │   ├── BudgetsSection.tsx       ← new (absorbs BudgetProgressBar.tsx)
│   │   │   └── OneOffIncomeSection.tsx  ← refactored from OneOffCard.tsx
│   │   ├── BalanceDisplay.tsx           ← reused
│   │   ├── BalanceHistoryModal.tsx      ← reused
│   │   ├── IncomeChecklistCard.tsx      ← reused (or renamed IncomeSection)
│   │   └── BalanceSparkline.tsx         ← reused in sidebar
│   └── layout/
│       └── AppShell.tsx                 ← unchanged
├── hooks/
│   ├── useFinance.ts                    ← rewrite: multi-month ledger mode
│   ├── useBills.ts                      ← keep: add category filtering
│   ├── useDebts.ts                      ← new
│   ├── useBudgets.ts                    ← new
│   ├── useBudgetExpenses.ts             ← new
│   ├── useBalanceHistory.ts             ← reused
│   ├── useOneOffIncome.ts               ← reused
│   ├── useExchangeRate.ts               ← reused
│   └── useYearOverview.ts               ← reused
├── pages/
│   └── FinancePage.tsx                  ← full rewrite
└── types/
    └── finance.ts                       ← extend with Debt, Budget, BudgetExpense
```

### Structure Rationale

- **components/finance/sidebar/:** Sidebar panel is visually and logically separate from the ledger — its own subtree avoids coupling to per-month state.
- **components/finance/ledger/:** Groups all timeline/month-section components. Each MonthSection is self-contained: it receives a `monthId` and renders its own sections.
- **hooks/use*.ts flat pattern:** Consistent with existing codebase. Do not introduce a hooks/finance/ subfolder — the naming is clear enough.

---

## New Database Tables Required (v2.1)

### debt_templates
Recurring debt definitions (credit cards, loans, installments).

```sql
CREATE TABLE debt_templates (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL,
  name             text NOT NULL,
  total_amount     numeric(14,2) NOT NULL,   -- original principal
  remaining        numeric(14,2) NOT NULL,   -- updated after each payment
  min_payment      numeric(14,2),            -- optional minimum monthly payment
  due_day          int CHECK (due_day BETWEEN 1 AND 31),
  active           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
```

### debt_payments
Per-month payment log for each debt.

```sql
CREATE TABLE debt_payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL,
  debt_id         uuid NOT NULL REFERENCES debt_templates(id) ON DELETE CASCADE,
  month_id        uuid NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  amount          numeric(14,2) NOT NULL,
  paid_at         timestamptz NOT NULL DEFAULT now(),
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (debt_id, month_id)     -- one payment entry per debt per month
);
```

### budget_categories
Named budget caps with optional monthly reset.

```sql
CREATE TABLE budget_categories (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL,
  name             text NOT NULL,
  monthly_cap      numeric(14,2) NOT NULL,
  active           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
```

### budget_expenses
Individual expense entries logged against a budget.

```sql
CREATE TABLE budget_expenses (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL,
  budget_id        uuid NOT NULL REFERENCES budget_categories(id) ON DELETE CASCADE,
  month_id         uuid NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  amount           numeric(14,2) NOT NULL CHECK (amount > 0),
  note             text,
  expense_date     date NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);
```

### Migration strategy
- New tables are additive — no changes to existing `months`, `bill_templates`, `monthly_bills`, etc.
- `bill_templates` gains a `category` column: `CHECK (category IN ('fixed', 'recurring_debt'))` with DEFAULT `'fixed'`. This allows the ledger to split existing bills into "Fixed Monthly" and "Recurring Debts" sections without a data migration beyond backfilling the default.
- Alternatively: keep `bill_templates` as fixed-only and use `debt_templates`/`debt_payments` as a separate track. Recommended: separate track. Reasons: debt needs `remaining` balance tracking which bills don't, and the UX is fundamentally different (payment logging vs. paid toggle).
- `database.types.ts` must be regenerated after migrations land (`bun run supabase gen types`).

---

## Architectural Patterns

### Pattern 1: Multi-Month Ledger Hook

The existing `useFinance(selectedMonth)` loads one month at a time. The ledger needs multiple months visible simultaneously (current + N past months collapsed).

**Approach:** Replace single-month hook with `useLedgerMonths(count: number)` that loads the current month and the previous N months, returning an array ordered descending.

```typescript
// src/hooks/useLedgerMonths.ts
export function useLedgerMonths(count: number = 6) {
  const [months, setMonths] = useState<LedgerMonth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Generate ["2026-03", "2026-02", ...] for count months back
    const targets = getPastMonthKeys(count);
    // Fan out: call ensure_month_exists for current only,
    // fetch existing months rows for past (read-only, no upsert)
    // Parallel fetch with Promise.all
  }, [count]);

  return { months, loading };
}
```

Key rule: only call `ensure_month_exists` + `populate_monthly_income` + `populate_monthly_bills` for the CURRENT month. Past months are fetched as-is. This avoids creating phantom rows for months the user never visited.

**Trade-off:** Higher initial load (6 months vs. 1). Mitigation: stagger — fetch current month first, then lazily fetch past months as user scrolls down.

### Pattern 2: Per-MonthSection Data Composition

Each `MonthSection` receives a `monthId` and mounts its own sub-hooks (`useBills`, `useDebts`, `useOneOffIncome`, `useBudgetExpenses`). This keeps data co-located with the component rendering it, not centralized in the page.

```typescript
// MonthSection.tsx
function MonthSection({ monthId, year, month, isPast, isCollapsed }: Props) {
  const { bills } = useBills(monthId);
  const { debts, payments } = useDebts(monthId);
  const { budgets, expenses } = useBudgetExpenses(monthId);
  const { entries } = useOneOffIncome(monthId);
  // render...
}
```

Past months render collapsed by default (single summary row). When expanded, they hydrate their sub-hooks. This is lazy loading without code-splitting complexity — hooks just don't fire until `isExpanded` is true.

**Trade-off:** Many concurrent Supabase queries on first mount. Mitigation: only current month starts expanded; past months are collapsed and don't mount sub-hooks until user opens them.

### Pattern 3: Fixed Sidebar Without AppShell Changes

The existing `AppShell` is `flex h-svh`. The new two-panel finance layout must be implemented INSIDE `FinancePage`, not by changing AppShell. AppShell's `<main>` is `overflow-y-auto` — that's the scrollable region.

**Approach:** `FinancePage` uses a `flex h-full` container that fills the available `<main>` space:

```tsx
// FinancePage.tsx
export default function FinancePage() {
  return (
    <div className="flex h-full">
      {/* Left: ledger timeline, scrollable */}
      <div className="flex-1 overflow-y-auto">
        <LedgerTimeline />
      </div>
      {/* Right: sidebar, sticky within the flex container */}
      <aside className="hidden lg:flex w-72 shrink-0 border-l border-border overflow-y-auto">
        <FinanceSidebar />
      </aside>
    </div>
  );
}
```

This works because `<main>` in AppShell is `overflow-y-auto` with `flex-1`. `FinancePage` as a child of `<Outlet>` gets the full height of `<main>`. The ledger's own `overflow-y-auto` scroll container then works independently of AppShell's scroll.

**Critical detail:** `AppShell`'s `<main>` must NOT have `overflow-y-auto` if we want `FinancePage` to manage its own two-column scroll. Two options:
1. Remove `overflow-y-auto` from `<main>` in AppShell and add it inside each page that needs it. Cleaner, affects all pages.
2. Use `h-full overflow-hidden` on `FinancePage`'s outer div and `overflow-y-auto` on the ledger column only.

**Recommended:** Option 2. It isolates the change to FinancePage and avoids touching every other page's scroll behavior.

Mobile: sidebar becomes a card at the top of the ledger scroll area. No two-column layout. The `hidden lg:flex` aside disappears; a mobile `<FinanceSidebarCard>` renders at the top of `LedgerTimeline` only.

### Pattern 4: Accent Color via Tailwind v4 @theme

The current `index.css` uses `@theme inline { ... }` to map CSS variables to Tailwind color tokens. Adding `#7CF5A5` as a named accent follows the same pattern:

```css
/* index.css — in :root */
--brand: oklch(89.8% 0.129 152.3);  /* #7CF5A5 converted to oklch */
--brand-foreground: oklch(0.145 0 0); /* near-black for contrast */

/* index.css — in .dark */
--brand: oklch(89.8% 0.129 152.3);  /* same green — works on dark bg */
--brand-foreground: oklch(0.145 0 0);

/* @theme inline block */
--color-brand: var(--brand);
--color-brand-foreground: var(--brand-foreground);
```

Usage everywhere: `bg-brand`, `text-brand`, `border-brand`, `ring-brand` — all Just Work via Tailwind v4's `@theme inline` resolution.

**Do NOT redefine `--accent` / `--color-accent`.** shadcn/ui uses `--accent` for hover states on menus and cards. Overwriting it to `#7CF5A5` would break hover UX. Use a separate `--brand` token.

**Propagation strategy:** Search-and-replace interactive element classes:
- Active nav indicator: `bg-foreground` → `bg-brand`
- Checkmarks / toggle completion: `text-foreground` → `text-brand`
- Active NavLink: `text-foreground bg-foreground/8` → keep foreground for bg, add `text-brand` for icon
- Progress bars / spent indicators: replace `bg-foreground` fill with `bg-brand`
- The month section "current" indicator border

This is a CSS variable swap, not a component architecture change. Do it as a single pass after the ledger layout is in place.

---

## Data Flow

### Ledger Render Flow

```
FinancePage mounts
    ↓
useLedgerMonths(6) → generates ["2026-03", "2026-02", ..., "2025-10"]
    ↓ parallel
  ensure_month_exists(2026-03) → months row (current only)
  SELECT months WHERE year/month IN (...) → past rows (read only)
    ↓
LedgerTimeline renders [MonthSection × N]
  current month: isExpanded=true → sub-hooks mount immediately
  past months:   isExpanded=false → sub-hooks idle until user expands
    ↓
MonthSection (current)
  useBills(monthId) → monthly_bills
  useDebts(monthId) → debt_templates + debt_payments
  useBudgetExpenses(monthId) → budget_categories + budget_expenses
  useOneOffIncome(monthId) → oneoff_income
```

### Sidebar Data Flow

```
FinanceSidebar receives:
  currentBalance (from months row fetched by useLedgerMonths)
  projectedBalance (computed from income + unpaid bills + debts)
  yearOverview (from useYearOverview(currentYear))

YearOverviewTable: standalone — calls useYearOverview(year) directly
  (it was already on a separate page; extracting to sidebar component is clean)
```

### Accent Color Propagation

```
index.css (@theme inline)
    ↓ Tailwind compiles --color-brand token
    ↓ Available as bg-brand / text-brand / border-brand
Components reference bg-brand / text-brand directly
No runtime JS involved — pure CSS variable
```

---

## Integration Points: New vs. Modified

### What is NEW (v2.1)

| Item | Type | Notes |
|------|------|-------|
| `debt_templates` table | Schema | New migration |
| `debt_payments` table | Schema | New migration |
| `budget_categories` table | Schema | New migration |
| `budget_expenses` table | Schema | New migration |
| `useLedgerMonths` hook | Hook | Replaces `useFinance` for ledger view |
| `useDebts(monthId)` hook | Hook | CRUD for debt_templates + debt_payments |
| `useBudgets()` hook | Hook | CRUD for budget_categories (global config) |
| `useBudgetExpenses(monthId)` hook | Hook | Expenses per budget per month |
| `LedgerTimeline` component | Component | Scrollable container |
| `MonthSection` component | Component | Per-month accordion |
| `FixedBillsSection` component | Component | Absorbs BillsCard.tsx |
| `RecurringDebtsSection` component | Component | New UI pattern |
| `BudgetsSection` component | Component | New UI pattern |
| `FinanceSidebar` component | Component | Fixed right panel |
| `YearOverviewTable` component | Component | Extracted from YearOverviewPage |
| `--brand` / `--color-brand` CSS vars | CSS | New accent token |
| Migration `016_debts_and_budgets.sql` | DB | Additive only |

### What is MODIFIED (v2.1)

| Item | Change | Scope |
|------|--------|-------|
| `FinancePage.tsx` | Full rewrite | New layout + hooks |
| `AppShell.tsx` | Possibly remove `overflow-y-auto` from `<main>` | Minor, affects all pages |
| `SideNav.tsx` | Active state uses `text-brand` accent | Cosmetic |
| `index.css` | Add `--brand` token in `:root`, `.dark`, `@theme inline` | 3 additions |
| `types/finance.ts` | Add `Debt`, `DebtPayment`, `Budget`, `BudgetExpense` interfaces | Additive |
| `database.types.ts` | Regenerate after migration | Tooling |

### What is REUSED UNCHANGED

| Item | Notes |
|------|-------|
| `useBills`, `useBalanceHistory`, `useOneOffIncome`, `useExchangeRate` | No changes needed |
| `BalanceDisplay`, `BalanceHistoryModal`, `BalanceSparkline` | Slot into sidebar as-is |
| `IncomeChecklistCard` | Reused inside MonthSection |
| `useYearOverview` | Reused in sidebar |
| All non-finance components | Unchanged |
| All non-finance hooks | Unchanged |
| All Supabase RPCs for bills/income/balance | Unchanged |

---

## Build Order (Dependency-First)

```
Phase 1: Foundation (no visible changes to user)
  1a. Write migration 016_debts_and_budgets.sql (additive tables + anon RLS)
  1b. Regenerate database.types.ts
  1c. Extend types/finance.ts with Debt, Budget, BudgetExpense interfaces
  1d. Add --brand CSS token to index.css
      → Validate: bun run build passes, token renders correctly

Phase 2: New Hooks
  2a. useDebts(monthId) — CRUD for debt_templates + debt_payments
  2b. useBudgets() — global budget_categories config
  2c. useBudgetExpenses(monthId) — expenses per budget per month
  2d. useLedgerMonths(count) — multi-month loader replacing useFinance for ledger
      → All hooks: full test coverage before building components

Phase 3: Layout Skeleton
  3a. FinancePage rewrite skeleton (two-column flex layout, placeholder panels)
  3b. Confirm AppShell scroll behavior works with FinancePage's own overflow
      → Test: page scrolls correctly on desktop + mobile

Phase 4: Sidebar
  4a. YearOverviewTable (extract from YearOverviewPage, no new data)
  4b. FinanceSidebar (balance + projections + YearOverviewTable)
      → Sidebar renders correctly with real data

Phase 5: Ledger Timeline
  5a. MonthSection skeleton (collapsed past / expanded current)
  5b. FixedBillsSection (absorb BillsCard.tsx)
  5c. IncomeSection (port IncomeChecklistCard into MonthSection)
  5d. OneOffIncomeSection (port OneOffCard)
  5e. RecurringDebtsSection (new — debt_templates + debt_payments)
  5f. BudgetsSection (new — budget_categories + budget_expenses + quick-log)
      → Full ledger renders for current month

Phase 6: Past Months Collapse
  6a. LedgerTimeline renders multiple MonthSections
  6b. Past months collapsed → single summary row → expand to see detail
  6c. Module-level cache for past month data (reuse monthCache pattern from useFinance)

Phase 7: Accent Color Sweep
  7a. Apply text-brand / bg-brand across: nav active state, checkmarks,
      progress fills, current month indicator, interactive highlights
  7b. Verify contrast in both light and dark mode
  7c. Remove old accent usage on check-in / MonthBarrel components being deleted
```

---

## Anti-Patterns

### Anti-Pattern 1: Lifting All Finance State to FinancePage

**What people do:** Pass every sub-hook's data as props from FinancePage down through LedgerTimeline into each MonthSection.

**Why it's wrong:** FinancePage becomes a 500-line prop-drilling hub. Adding a new section type requires threading new props through the entire chain. Past months don't need their data until expanded — centralizing forces eager loading.

**Do this instead:** Each MonthSection mounts its own hooks. FinancePage only owns: the list of month keys to render, the current balance (for sidebar), and the year overview. Everything else is local to MonthSection.

### Anti-Pattern 2: Redefining --accent for Brand Color

**What people do:** Set `--accent` and `--accent-foreground` to the brand green.

**Why it's wrong:** shadcn/ui Radix components (DropdownMenu, Select, etc.) use `--accent` for hover backgrounds. Overwriting it turns all menu hover states bright green — jarring, high contrast, defeats the monochrome base.

**Do this instead:** Introduce a separate `--brand` token. Apply it manually to interactive elements that should show the accent. shadcn hover states remain neutral.

### Anti-Pattern 3: Changing AppShell's overflow-y-auto Without Auditing All Pages

**What people do:** Remove `overflow-y-auto` from `<main>` in AppShell to allow FinancePage to manage its own scroll.

**Why it's wrong:** TodayPage, JournalPage, and SettingsPage all rely on `<main>` being the scroll container. Removing it breaks scrolling on every page.

**Do this instead:** Keep `overflow-y-auto` on `<main>`. In FinancePage, use `h-full overflow-hidden` on its outer div, then the ledger column gets its own `overflow-y-auto`. This creates nested scroll contexts — tested pattern in complex layouts.

### Anti-Pattern 4: One Migration Per New Table

**What people do:** Create four separate migrations (016, 017, 018, 019) for the new v2.1 tables.

**Why it's wrong:** The four tables are deployed together. If the migration is applied partially (DB error mid-way), the schema is in an inconsistent state. A single migration is atomic.

**Do this instead:** One migration `016_debts_and_budgets.sql` that creates all four tables + indexes + RLS policies. Easier to roll back.

### Anti-Pattern 5: Reusing useFinance for the Ledger

**What people do:** Call `useFinance(selectedMonth)` for each month in an array, mapping over months.

**Why it's wrong:** `useFinance` calls three RPCs on every mount (`ensure_month_exists`, `populate_monthly_income`, `populate_monthly_bills`). Calling it 6 times fires 18 RPC calls on page load. Also, `ensure_month_exists` is only needed for the current month — calling it for past months is a no-op but wastes a round trip.

**Do this instead:** `useLedgerMonths` does a single multi-month fetch, calls the "ensure + populate" RPCs for the current month only, and reads past month rows directly. Sub-hooks (useBills, useDebts, etc.) fetch by monthId as always.

---

## Scaling Considerations

This is a single-user personal tool. Scaling is not a concern. The architecture choices above are driven by correctness, maintainability, and UX performance, not by multi-user scale.

| Scale | Notes |
|-------|-------|
| 1 user | Current architecture is correct. No changes needed. |
| 100 users | RLS already enforces user isolation. No architecture change. |
| 1000+ users | Not the use case. Out of scope per PROJECT.md. |

---

## Sources

- Direct codebase inspection: `src/` (12,891 LOC TypeScript)
- Supabase migration files: `supabase/migrations/001–015`
- Tailwind v4 `@theme inline` pattern: confirmed in existing `index.css` lines 78–121
- AppShell layout: `src/components/layout/AppShell.tsx`
- SideNav scroll offset: `ml-0 sm:ml-14` confirmed in AppShell
- Finance hook patterns: `src/hooks/useFinance.ts`, `useBills.ts`, `useBalanceHistory.ts`
- Existing CSS variable set: `--accent` used by shadcn, confirmed distinct from `--brand`

---

*Architecture research for: wintrack v2.1 finance redesign — continuous ledger, budgets, recurring debts, fixed sidebar, accent color*
*Researched: 2026-03-23*
