# Phase 4: Finance Extended - Research

**Researched:** 2026-03-17
**Domain:** Bills management with recurrence, balance change history, one-off income, waterfall chart, year overview dashboard
**Confidence:** HIGH

## Summary

Phase 4 extends the finance module (built in Phase 3) with four new feature areas: (1) bills with recurrence types and paid toggle, (2) balance change history with audit trail and revert, (3) one-off income entries, and (4) two dashboard views -- a waterfall step chart for the current month and a year overview at `/finance/year`. The database foundation (months, income_sources, monthly_income tables + RPCs) already exists from Phase 3. Phase 4 adds three new tables (bills, balance_changes, oneoff_income) and extends the existing useFinance hook with bill toggle + balance history capabilities.

The bills system is the most complex feature. The source app (P350) uses a simple per-month bill row approach with a `rollover_recurring_bills` RPC that copies unpaid recurring bills forward. Wintrack needs richer recurrence: one-time, recurring for N months, recurring until end date, and ongoing. This means bills need a `bill_templates` table (the template/definition) separate from `monthly_bills` (per-month instances), rather than the source app's single `bills` table. The `populate_monthly_bills` RPC generates monthly instances from templates, similar to how `populate_monthly_income` works for income.

The waterfall step chart and year overview are SVG-based visualizations. The waterfall shows balance cascading as bills are paid (a stepped line chart, not a bar chart). The year overview at `/finance/year` shows 12 columns with income-vs-expense progress bars and a balance sparkline. Both follow the existing raw SVG approach (BudgetGauge, ConsistencyGraph) -- no charting library needed.

**Primary recommendation:** Add `bill_templates` (definitions with recurrence) + `monthly_bills` (per-month instances) + `balance_changes` (audit trail) + `oneoff_income` tables. Build `populate_monthly_bills` RPC mirroring `populate_monthly_income`. Build waterfall and year overview as raw SVG components. Extend useFinance hook for bill toggle and balance history.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Compact list rows (not full cards like income) -- bills are more numerous, need tighter layout
- Name | amount | due date | paid toggle per row
- Due date urgency: all three indicators combined -- text label ("Due in 3 days" / "Overdue"), left border thickness/brightness increasing with urgency, AND sorted most urgent first
- Recurrence display: repeat icon only for recurring, no icon for one-time -- details available on tap/expand
- One-time bills disappear from active list after being paid
- Recurring bills show remaining count on tap
- CRUD: quick add on Finance page ("+ Add Bill" inline form) AND full management in Settings
- Current month waterfall: SVG visual step chart showing balance as a stepped line going down with each bill paid -- not a text list, a proper chart
- Past months: full snapshot -- show all bills (paid status), all income (received status), budget progress, final balance -- frozen read-only
- Future months: simple projected balance = current ending balance + expected income - recurring bills -- one number, not itemized
- Separate route at `/finance/year` -- not a section on the Finance page
- 12-month columns layout -- clean, minimal, not cluttered like a spreadsheet
- Each month column shows: month label, ending balance, progress bar where income = full bar and expenses fill it showing consumption
- One-off income extends the progress bar beyond 100% with a visually distinct segment (different opacity, not dashed) showing additional income came in on top of regular
- Sparkline in header area showing balance trajectory across 12 months -- compact, not dominant
- Tap a month column to navigate to that month's detailed view
- Every manual balance override recorded with timestamp and amount change (+/- delta)
- Finance page shows last change indicator next to balance hero (e.g., greyed out "+P30,000 from last change")
- History modal accessible from the indicator -- shows all changes with dates, amounts, and notes
- User can delete a change entry, which reverts balance to the value before that change
- History is per-month (each month has its own change log)
- Add one-off income with: amount (PHP), date, note/description
- One-off income adds to current balance immediately when recorded
- Appears on the year overview as the extended segment on the progress bar
- User can edit and delete one-off entries (deleting removes from balance)
- Displayed on the Finance page as a separate section or inline with income cards

### Claude's Discretion
- Bills database schema (bills table with recurrence fields)
- Balance history table design (balance_changes or similar)
- One-off income table design
- Waterfall SVG step chart implementation
- Year overview /finance/year route and layout component
- Bill recurrence rollover logic (populate monthly bills from templates)
- How one-off income section integrates with existing income cards on Finance page

### Deferred Ideas (OUT OF SCOPE)
- External balances (Polymarket Bot, SOL DCA) -- deferred to v2.1, will be API-driven
- Net worth breakdown card -- deferred until external balances are added
- Unexpected payment/bonus mechanic as a first-class concept -- captured in ONEOFF requirements for now, may evolve in v2.1
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BILL-01 | Add bill with name, amount, due date, recurrence type | `bill_templates` table with recurrence_type enum + `monthly_bills` per-month instances |
| BILL-02 | Toggle bill as paid per month (deducts from balance) | `apply_bill_paid` RPC atomically updates monthly_bills.paid + months.current_balance |
| BILL-03 | Edit and delete bills | CRUD on `bill_templates`; delete cascades to future unpaid monthly_bills |
| BILL-04 | Recurring/ongoing bills auto-appear each month | `populate_monthly_bills` RPC generates instances from active templates per month |
| BILL-05 | Unpaid bills highlighted by due date urgency | Client-side urgency calculation: days until due_day, sorted most urgent first, left border styling |
| BILL-06 | One-time bills disappear after paid | Filter: exclude monthly_bills where template is one-time AND paid = true |
| BILL-07 | Recurring bills show remaining months/payments | Calculated from template.recurrence_count - months_generated, displayed on tap/expand |
| FIN-02 | Current month waterfall view | SVG step chart component: starting balance, subtract each paid bill in sequence |
| FIN-03 | Past months show final balance, paid bills, income received (read-only) | Past month snapshot: all monthly_bills + monthly_income with frozen paid/received states |
| FIN-04 | Future months show projected balance | Projected = current ending balance + sum(expected income) - sum(recurring bill amounts) |
| FIN-05 | Year overview with 12 months, balance trajectory, totals | New `/finance/year` route with 12-column layout, progress bars, sparkline |
| HIST-01 | Every manual balance override recorded with timestamp/delta | `balance_changes` table with before/after amounts, auto-logged on BalanceHero save |
| HIST-02 | Finance page shows last change indicator | Greyed-out delta text next to BalanceHero, fetched from latest balance_changes row |
| HIST-03 | History modal with all changes | Modal component listing balance_changes for current month |
| HIST-04 | Delete change entry reverts balance | RPC: deletes change row + adjusts months.current_balance by negative of the delta |
| ONEOFF-01 | Add one-off income with amount, date, note | `oneoff_income` table; inline add form on Finance page |
| ONEOFF-02 | One-off income adds to balance immediately | `apply_oneoff_income` RPC atomically inserts row + adds to months.current_balance |
| ONEOFF-03 | One-off income as extended segment on year overview | Year overview sums oneoff_income per month, renders as distinct opacity extension on progress bar |
| ONEOFF-04 | Edit and delete one-off entries | CRUD on oneoff_income; delete RPC subtracts amount from balance |
</phase_requirements>

## Standard Stack

### Core (No new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase JS | ^2.98.0 | Database queries + RPC calls | Already installed; extend existing patterns |
| React 19 | ^19.2.0 | UI components | Already installed |
| React Router | ^7.x | `/finance/year` route | Already installed |
| Lucide React | ^0.577.0 | Repeat icon for recurring bills, History icon for balance changes | Already installed |
| Tailwind v4 | ^4.x | Styling for compact bill rows, waterfall, year overview | Already installed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | - | - | All features built with existing stack |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw SVG waterfall | Recharts BarChart/AreaChart | Recharts adds ~100KB for two simple charts. The waterfall is a stepped polyline with labeled data points. The sparkline is a single path element. Both are trivially raw SVG. |
| Raw SVG sparkline | D3.js or visx | Sparkline is literally `<path d="M0,h L50,h2 L100,h3...">` -- 5 lines of code. D3 adds 75KB+ for one path. |
| Template + instance bill model | Single bills table (source app approach) | Source app copies bills row-by-row with `rollover_recurring_bills`. Wintrack needs richer recurrence (N months, until date, ongoing). Template model is cleaner -- edit template once, all future instances update. |

**Installation:**
```bash
# No new packages needed for Phase 4
```

## Architecture Patterns

### Recommended Project Structure

```
src/
  pages/
    FinancePage.tsx             # Extend: add bills section, waterfall, history indicator, oneoff section
    YearOverviewPage.tsx        # NEW: /finance/year route
  components/
    finance/
      BillRow.tsx               # Compact bill row with paid toggle, urgency border
      BillAddInline.tsx         # Quick-add bill form on Finance page
      BillsList.tsx             # Bills section: sorted by urgency, filter paid one-time
      WaterfallChart.tsx        # SVG step chart for current month
      BalanceHistoryIndicator.tsx # Greyed-out last-change text next to BalanceHero
      BalanceHistoryModal.tsx   # Modal showing all balance changes with delete/revert
      OneOffIncomeSection.tsx   # One-off income list with inline add
      OneOffIncomeRow.tsx       # Single one-off income entry row
      YearGrid.tsx              # 12-column year layout with progress bars
      BalanceSparkline.tsx      # SVG sparkline for year overview header
      MonthColumn.tsx           # Single month column in year grid
  hooks/
    useBills.ts                 # Bill templates CRUD + monthly bill toggle
    useBalanceHistory.ts        # Balance changes log + revert
    useOneOffIncome.ts          # One-off income CRUD
    useYearOverview.ts          # 12-month summary data for year view
  types/
    finance.ts                  # Extend: BillTemplate, MonthlyBill, BalanceChange, OneOffIncome
supabase/
  migrations/
    010_bills_tables.sql        # bill_templates + monthly_bills + RLS
    011_balance_history.sql     # balance_changes table + RLS
    012_oneoff_income.sql       # oneoff_income table + RLS
    013_phase4_rpcs.sql         # apply_bill_paid, populate_monthly_bills, apply_oneoff_income, revert_balance_change
```

### Pattern 1: Template + Instance Bill Model

**What:** Bills have two layers: `bill_templates` (the recurring definition) and `monthly_bills` (per-month concrete instances). Templates define name, amount, due_day, recurrence type. Monthly instances are generated via `populate_monthly_bills` RPC (same pattern as `populate_monthly_income`).

**When to use:** All bill operations. Templates are managed in Settings. Monthly instances appear on the Finance page.

**Why this over single-table:**
- Edit a template once, future instances reflect the change
- Recurrence logic lives in the RPC, not scattered across client code
- Clean separation: "what bills do I have" (templates) vs "what's happening this month" (instances)
- One-time bills: template with `recurrence_type = 'one_time'` generates exactly one instance

**Example:**
```typescript
// Bill template (Settings page management)
interface BillTemplate {
  id: string;
  user_id: string;
  name: string;
  amount: number;            // PHP
  due_day: number;           // 1-31
  recurrence_type: 'one_time' | 'recurring_n' | 'recurring_until' | 'ongoing';
  recurrence_count: number | null;  // for 'recurring_n': total months
  recurrence_end: string | null;    // for 'recurring_until': 'YYYY-MM'
  start_month: string;       // 'YYYY-MM' - when this bill starts
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Monthly instance (Finance page display)
interface MonthlyBill {
  id: string;
  user_id: string;
  month_id: string;
  bill_template_id: string;
  name: string;              // Snapshot from template at creation time
  amount: number;            // Snapshot from template
  due_day: number;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined from template
  bill_templates?: BillTemplate;
}
```

### Pattern 2: Atomic Bill Paid Toggle

**What:** `apply_bill_paid` RPC atomically toggles `monthly_bills.paid` and adjusts `months.current_balance`. Mirrors `apply_income_received` exactly.

**When to use:** When user toggles paid checkbox on a bill row.

**Example:**
```typescript
// apply_bill_paid RPC (Postgres)
// paid = true:  set paid=true, paid_at=now(), deduct amount from months.current_balance
// paid = false: set paid=false, paid_at=null, add amount back to months.current_balance

// Client call
const { error } = await supabase.rpc('apply_bill_paid', {
  p_monthly_bill_id: billId,
  p_paid: true,
});
if (!error) refetch();
```

### Pattern 3: Balance Change Logging

**What:** Every manual balance override via BalanceHero creates a `balance_changes` row recording the old and new values. This happens in a modified `updateBalance` flow -- instead of direct update to months, call an `apply_balance_override` RPC that updates the balance AND inserts a change log entry atomically.

**When to use:** Only for manual balance overrides (BalanceHero tap-to-edit). Income received and bill paid toggles do NOT create balance_changes entries -- those are tracked via their own tables.

**Example:**
```typescript
// Modify useFinance.updateBalance to call RPC instead of direct update
const updateBalance = async (newBalance: number) => {
  if (!monthData) return;
  const prev = monthData.current_balance;
  setMonthData(m => m ? { ...m, current_balance: newBalance } : m);

  const { error } = await supabase.rpc('apply_balance_override', {
    p_month_id: monthData.id,
    p_new_balance: newBalance,
    p_note: null, // Optional note
  });

  if (error) {
    setMonthData(m => m ? { ...m, current_balance: prev } : m);
  }
};
```

### Pattern 4: SVG Waterfall Step Chart

**What:** A stepped line chart showing balance decreasing as each bill is paid. X-axis: bills in due-date order. Y-axis: balance amount. Each step down represents a paid bill. Unpaid bills shown as dashed/ghost steps.

**When to use:** FIN-02, current month waterfall on Finance page.

**Example:**
```typescript
// WaterfallChart.tsx
// Data: starting balance + array of { name, amount, paid }
// Rendering: SVG polyline with horizontal + vertical segments
// Each paid bill creates a step down; unpaid creates a dotted step

interface WaterfallStep {
  name: string;
  amount: number;
  paid: boolean;
  balanceAfter: number;
}

// Convert bills to waterfall steps
function buildSteps(startingBalance: number, bills: MonthlyBill[]): WaterfallStep[] {
  let balance = startingBalance;
  return bills
    .sort((a, b) => a.due_day - b.due_day)
    .map(bill => {
      if (bill.paid) balance -= bill.amount;
      return {
        name: bill.name,
        amount: bill.amount,
        paid: bill.paid,
        balanceAfter: balance,
      };
    });
}

// SVG: width scales to container, height fixed ~200px
// Draw horizontal line at each balance level, vertical drop for each bill
// Labels below each step
```

### Pattern 5: Year Overview Grid

**What:** 12-column grid showing each month's financial summary. Each column has: month label, ending balance, income-vs-expense progress bar with one-off extension. Header has a balance sparkline.

**When to use:** FIN-05, `/finance/year` route.

**Example:**
```typescript
// useYearOverview hook: fetches 12 months of summary data
// For past months: actual data from months + monthly_bills + monthly_income + oneoff_income
// For current month: live data
// For future months: projected (income - recurring bills)

interface MonthSummary {
  month: string;            // 'YYYY-MM'
  endingBalance: number;
  totalIncome: number;      // Regular income received
  totalExpenses: number;    // Bills paid
  oneOffIncome: number;     // Bonus/one-off income
  isPast: boolean;
  isCurrent: boolean;
  isFuture: boolean;
}
```

### Anti-Patterns to Avoid

- **Single bills table with month column:** The source app does this and needs a `rollover_recurring_bills` function to copy rows. With 4 recurrence types, the copy logic becomes complex. Template + instance is cleaner.
- **Client-side balance arithmetic for bill toggle:** Always use RPC for atomic balance + paid state updates. Client-side multi-step can partially fail.
- **Balance history as a derived view:** Don't try to reconstruct history from bill/income toggles. The balance_changes table is an explicit audit log for manual overrides only.
- **Charting library for 2 simple SVGs:** The waterfall is a polyline with labels. The sparkline is a single path. Neither justifies a library dependency.
- **Storing projected future data in DB:** Future months are calculated on-the-fly: ending_balance + expected_income - recurring_bills. No need to persist projections.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bill due date urgency | Manual date comparison scattered across components | Shared `getDueUrgency(dueDay, today)` utility returning { label, level: 'overdue' | 'urgent' | 'soon' | 'normal' } | Consistent urgency calculation, single source of truth for threshold logic |
| Waterfall balance calculation | Inline arithmetic in render | Pure function `buildWaterfallSteps(startBalance, bills)` in `lib/utils/finance.ts` | Testable, reusable, keeps component clean |
| Year overview data aggregation | Multiple separate queries per month | Single `get_year_overview` RPC returning 12 months of aggregated data | One round-trip vs 12+ queries. Postgres aggregation is fast. |
| Recurring bill generation | Client-side loop checking recurrence conditions | `populate_monthly_bills` RPC in Postgres | Atomic, handles edge cases (concurrent access, partial state), matches existing populate_monthly_income pattern |
| Balance change revert | Client-side delete + manual balance recalculation | `revert_balance_change` RPC that deletes the change AND adjusts balance atomically | Single transaction, no partial failure |

**Key insight:** Phase 4 has more RPCs than Phase 3 (at least 4 new ones) because every balance-affecting operation must be atomic. The pattern is already established -- just replicate it for bills, one-off income, balance overrides, and reverts.

## Common Pitfalls

### Pitfall 1: Recurring Bill Over-Generation

**What goes wrong:** `populate_monthly_bills` generates instances for months beyond the recurrence end condition. A "recurring for 6 months" bill keeps appearing in month 7, 8, etc.
**Why it happens:** The RPC copies from templates without checking recurrence limits.
**How to avoid:** `populate_monthly_bills` must check:
- `one_time`: only generate for `start_month`
- `recurring_n`: count existing monthly_bills for this template, skip if count >= recurrence_count
- `recurring_until`: compare current month against recurrence_end
- `ongoing`: always generate
**Warning signs:** Bills appearing in months where they shouldn't exist.

### Pitfall 2: Balance Drift from History Revert

**What goes wrong:** User deletes a balance change entry, but the revert applies the wrong delta because other changes happened in between. Example: balance was 100, user overrides to 150 (+50), then toggles a bill paid (-30, balance now 120). User reverts the +50 override. Should balance be 70 (120-50) or 100 (original)?
**Why it happens:** Balance changes are deltas, but other operations (bill paid, income received) also affect balance between change entries.
**How to avoid:** Revert should apply the negative delta to current balance, not restore the "before" value. The RPC: `current_balance = current_balance - (change.new_balance - change.old_balance)`. This preserves all other operations that happened in between. Document this clearly in the history modal UI.
**Warning signs:** Balance after revert doesn't match user expectations. The UI should show "Revert will adjust balance by -P50,000" before confirming.

### Pitfall 3: One-Time Bill Still Showing After Paid

**What goes wrong:** User pays a one-time bill but it still appears in the active list.
**Why it happens:** The filter logic checks `paid = true` but doesn't also check the template's recurrence type.
**How to avoid:** Bills list filter: show all unpaid bills PLUS paid recurring/ongoing bills (to show their paid status). Hide paid one-time bills. The query: `WHERE NOT (bill_templates.recurrence_type = 'one_time' AND monthly_bills.paid = true)`.
**Warning signs:** One-time bills cluttering the list after being paid.

### Pitfall 4: Waterfall Chart Empty for Future Months

**What goes wrong:** Navigating to a future month shows an empty waterfall because no monthly_bills exist yet.
**Why it happens:** `populate_monthly_bills` only runs for the selected month, and future months don't have bills generated.
**How to avoid:** For future months, the waterfall should use projected data from bill templates (not monthly_bills). Or simply don't show the waterfall for future months -- CONTEXT.md says future months show "one number, not itemized." Show waterfall only for current and past months.
**Warning signs:** Empty waterfall chart for next month.

### Pitfall 5: Year Overview N+1 Query Problem

**What goes wrong:** useYearOverview makes 12 separate queries for each month's data (bills, income, oneoff_income), resulting in 36+ database round-trips.
**Why it happens:** Naive approach: loop over 12 months, call useFinance for each.
**How to avoid:** Create a single `get_year_overview` RPC that returns all 12 months of aggregated data in one query. Use Postgres `GROUP BY month_id` with `json_agg` for compact results.
**Warning signs:** Year overview page is slow to load, multiple loading spinners.

### Pitfall 6: Balance History Not Logged for Phase 3 Overrides

**What goes wrong:** The existing `updateBalance` in useFinance directly updates months.current_balance without logging to balance_changes. Users who overrode balance before Phase 4 have no history.
**Why it happens:** Phase 3 didn't have the balance_changes table.
**How to avoid:** When modifying `updateBalance`, switch from direct update to `apply_balance_override` RPC. Accept that pre-Phase-4 overrides won't have history. No backfill needed -- this is a new feature.
**Warning signs:** "No history" message for months where user previously overrode balance.

## Code Examples

### Bills Table Schema

```sql
-- 010_bills_tables.sql

-- bill_templates: recurring bill definitions
CREATE TABLE IF NOT EXISTS bill_templates (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL,
  name             text NOT NULL,
  amount           numeric(14,2) NOT NULL CHECK (amount >= 0),
  due_day          int NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  recurrence_type  text NOT NULL DEFAULT 'ongoing'
    CHECK (recurrence_type IN ('one_time', 'recurring_n', 'recurring_until', 'ongoing')),
  recurrence_count int,                    -- for 'recurring_n': total number of months
  recurrence_end   text,                   -- for 'recurring_until': 'YYYY-MM'
  start_month      text NOT NULL,          -- 'YYYY-MM': first month this bill appears
  active           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bill_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bill_templates_select" ON bill_templates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "bill_templates_insert" ON bill_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bill_templates_update" ON bill_templates FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bill_templates_delete" ON bill_templates FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- monthly_bills: per-month bill instances
CREATE TABLE IF NOT EXISTS monthly_bills (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL,
  month_id          uuid NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  bill_template_id  uuid NOT NULL REFERENCES bill_templates(id) ON DELETE CASCADE,
  name              text NOT NULL,          -- Snapshot from template
  amount            numeric(14,2) NOT NULL, -- Snapshot from template
  due_day           int NOT NULL,
  paid              boolean NOT NULL DEFAULT false,
  paid_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (month_id, bill_template_id)
);

ALTER TABLE monthly_bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "monthly_bills_select" ON monthly_bills FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "monthly_bills_insert" ON monthly_bills FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "monthly_bills_update" ON monthly_bills FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "monthly_bills_delete" ON monthly_bills FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS bill_templates_user_active_idx ON bill_templates(user_id, active);
CREATE INDEX IF NOT EXISTS monthly_bills_month_id_idx ON monthly_bills(month_id);
CREATE INDEX IF NOT EXISTS monthly_bills_template_idx ON monthly_bills(bill_template_id);
```

### Balance Changes Table Schema

```sql
-- 011_balance_history.sql

CREATE TABLE IF NOT EXISTS balance_changes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL,
  month_id     uuid NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  old_balance  numeric(14,2) NOT NULL,
  new_balance  numeric(14,2) NOT NULL,
  delta        numeric(14,2) NOT NULL,     -- new_balance - old_balance (computed for convenience)
  note         text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE balance_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "balance_changes_select" ON balance_changes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "balance_changes_insert" ON balance_changes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "balance_changes_delete" ON balance_changes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS balance_changes_month_idx ON balance_changes(month_id, created_at DESC);
```

### One-Off Income Table Schema

```sql
-- 012_oneoff_income.sql

CREATE TABLE IF NOT EXISTS oneoff_income (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  month_id    uuid NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  amount      numeric(14,2) NOT NULL CHECK (amount > 0),
  date        date NOT NULL,
  note        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE oneoff_income ENABLE ROW LEVEL SECURITY;
CREATE POLICY "oneoff_income_select" ON oneoff_income FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "oneoff_income_insert" ON oneoff_income FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "oneoff_income_update" ON oneoff_income FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "oneoff_income_delete" ON oneoff_income FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS oneoff_income_month_idx ON oneoff_income(month_id);
```

### Key RPC Functions

```sql
-- 013_phase4_rpcs.sql

-- Toggle bill paid/unpaid, adjusting balance atomically
CREATE OR REPLACE FUNCTION apply_bill_paid(
  p_monthly_bill_id uuid,
  p_paid boolean
)
RETURNS monthly_bills
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  bill_row monthly_bills;
BEGIN
  SELECT * INTO bill_row FROM monthly_bills WHERE id = p_monthly_bill_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'monthly_bill_not_found';
  END IF;

  IF p_paid THEN
    UPDATE monthly_bills SET paid = true, paid_at = now()
    WHERE id = p_monthly_bill_id
    RETURNING * INTO bill_row;

    UPDATE months SET current_balance = current_balance - bill_row.amount
    WHERE id = bill_row.month_id;
  ELSE
    UPDATE months SET current_balance = current_balance + bill_row.amount
    WHERE id = bill_row.month_id;

    UPDATE monthly_bills SET paid = false, paid_at = NULL
    WHERE id = p_monthly_bill_id
    RETURNING * INTO bill_row;
  END IF;

  RETURN bill_row;
END;
$$;

-- Populate monthly_bills from active bill_templates for a month
CREATE OR REPLACE FUNCTION populate_monthly_bills(p_user_id uuid, p_month_id uuid, p_year int, p_month int)
RETURNS int
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  inserted_count int;
  current_month_str text;
BEGIN
  current_month_str := p_year || '-' || lpad(p_month::text, 2, '0');

  WITH eligible_templates AS (
    SELECT bt.*
    FROM bill_templates bt
    WHERE bt.user_id = p_user_id
      AND bt.active = true
      AND bt.start_month <= current_month_str
      AND (
        bt.recurrence_type = 'ongoing'
        OR (bt.recurrence_type = 'one_time' AND bt.start_month = current_month_str)
        OR (bt.recurrence_type = 'recurring_until' AND bt.recurrence_end >= current_month_str)
        OR (bt.recurrence_type = 'recurring_n' AND (
          SELECT count(*) FROM monthly_bills mb WHERE mb.bill_template_id = bt.id
        ) < bt.recurrence_count)
      )
  ),
  new_bills AS (
    INSERT INTO monthly_bills (user_id, month_id, bill_template_id, name, amount, due_day)
    SELECT
      et.user_id, p_month_id, et.id, et.name, et.amount, et.due_day
    FROM eligible_templates et
    ON CONFLICT (month_id, bill_template_id) DO NOTHING
    RETURNING id
  )
  SELECT count(*) INTO inserted_count FROM new_bills;

  RETURN COALESCE(inserted_count, 0);
END;
$$;

-- Override balance with history logging
CREATE OR REPLACE FUNCTION apply_balance_override(
  p_month_id uuid,
  p_new_balance numeric,
  p_note text DEFAULT NULL
)
RETURNS months
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  month_row months;
  old_bal numeric(14,2);
BEGIN
  SELECT * INTO month_row FROM months WHERE id = p_month_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'month_not_found';
  END IF;

  old_bal := month_row.current_balance;

  -- Log the change
  INSERT INTO balance_changes (user_id, month_id, old_balance, new_balance, delta, note)
  VALUES (month_row.user_id, p_month_id, old_bal, p_new_balance, p_new_balance - old_bal, p_note);

  -- Apply the override
  UPDATE months SET current_balance = p_new_balance
  WHERE id = p_month_id
  RETURNING * INTO month_row;

  RETURN month_row;
END;
$$;

-- Revert a balance change (delete entry + adjust balance)
CREATE OR REPLACE FUNCTION revert_balance_change(p_change_id uuid)
RETURNS months
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  change_row balance_changes;
  month_row months;
BEGIN
  SELECT * INTO change_row FROM balance_changes WHERE id = p_change_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'balance_change_not_found';
  END IF;

  -- Revert: subtract the delta that was applied
  UPDATE months SET current_balance = current_balance - change_row.delta
  WHERE id = change_row.month_id
  RETURNING * INTO month_row;

  -- Delete the change entry
  DELETE FROM balance_changes WHERE id = p_change_id;

  RETURN month_row;
END;
$$;

-- Add one-off income (inserts row + adds to balance)
CREATE OR REPLACE FUNCTION apply_oneoff_income(
  p_user_id uuid,
  p_month_id uuid,
  p_amount numeric,
  p_date date,
  p_note text
)
RETURNS oneoff_income
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  income_row oneoff_income;
BEGIN
  INSERT INTO oneoff_income (user_id, month_id, amount, date, note)
  VALUES (p_user_id, p_month_id, p_amount, p_date, p_note)
  RETURNING * INTO income_row;

  UPDATE months SET current_balance = current_balance + p_amount
  WHERE id = p_month_id;

  RETURN income_row;
END;
$$;

-- Delete one-off income (removes row + subtracts from balance)
CREATE OR REPLACE FUNCTION delete_oneoff_income(p_oneoff_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  income_row oneoff_income;
BEGIN
  SELECT * INTO income_row FROM oneoff_income WHERE id = p_oneoff_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'oneoff_income_not_found';
  END IF;

  UPDATE months SET current_balance = current_balance - income_row.amount
  WHERE id = income_row.month_id;

  DELETE FROM oneoff_income WHERE id = p_oneoff_id;
END;
$$;

-- Year overview: aggregated data for 12 months
CREATE OR REPLACE FUNCTION get_year_overview(p_user_id uuid, p_year int)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(month_summary ORDER BY m.year, m.month) INTO result
  FROM months m
  LEFT JOIN LATERAL (
    SELECT COALESCE(sum(CASE WHEN mi.received THEN mi.net_php ELSE 0 END), 0) AS total_income
    FROM monthly_income mi WHERE mi.month_id = m.id
  ) inc ON true
  LEFT JOIN LATERAL (
    SELECT COALESCE(sum(CASE WHEN mb.paid THEN mb.amount ELSE 0 END), 0) AS total_expenses
    FROM monthly_bills mb WHERE mb.month_id = m.id
  ) exp ON true
  LEFT JOIN LATERAL (
    SELECT COALESCE(sum(oi.amount), 0) AS total_oneoff
    FROM oneoff_income oi WHERE oi.month_id = m.id
  ) oneoff ON true
  CROSS JOIN LATERAL (
    SELECT jsonb_build_object(
      'month', m.year || '-' || lpad(m.month::text, 2, '0'),
      'ending_balance', m.current_balance,
      'starting_balance', m.starting_balance,
      'total_income', inc.total_income,
      'total_expenses', exp.total_expenses,
      'total_oneoff', oneoff.total_oneoff
    ) AS month_summary
  ) summary
  WHERE m.user_id = p_user_id AND m.year = p_year;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Set search_path for security
ALTER FUNCTION apply_bill_paid(uuid, boolean) SET search_path = public;
ALTER FUNCTION populate_monthly_bills(uuid, uuid, int, int) SET search_path = public;
ALTER FUNCTION apply_balance_override(uuid, numeric, text) SET search_path = public;
ALTER FUNCTION revert_balance_change(uuid) SET search_path = public;
ALTER FUNCTION apply_oneoff_income(uuid, uuid, numeric, date, text) SET search_path = public;
ALTER FUNCTION delete_oneoff_income(uuid) SET search_path = public;
ALTER FUNCTION get_year_overview(uuid, int) SET search_path = public;
```

### Due Date Urgency Utility

```typescript
// src/lib/utils/finance.ts

export type UrgencyLevel = 'overdue' | 'urgent' | 'soon' | 'normal';

interface DueUrgency {
  level: UrgencyLevel;
  label: string;
  daysUntil: number;
}

/**
 * Calculate due date urgency for a bill.
 * @param dueDay - Day of month (1-31)
 * @param today - Current date (defaults to new Date())
 */
export function getDueUrgency(dueDay: number, today: Date = new Date()): DueUrgency {
  const currentDay = today.getDate();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const effectiveDueDay = Math.min(dueDay, lastDay);
  const daysUntil = effectiveDueDay - currentDay;

  if (daysUntil < 0) {
    return { level: 'overdue', label: 'Overdue', daysUntil };
  }
  if (daysUntil === 0) {
    return { level: 'overdue', label: 'Due today', daysUntil: 0 };
  }
  if (daysUntil <= 3) {
    return { level: 'urgent', label: `Due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`, daysUntil };
  }
  if (daysUntil <= 7) {
    return { level: 'soon', label: `Due in ${daysUntil} days`, daysUntil };
  }
  return { level: 'normal', label: `Due day ${effectiveDueDay}`, daysUntil };
}

/**
 * Urgency to left border style mapping.
 * Returns Tailwind classes for the left border.
 */
export function urgencyBorderClass(level: UrgencyLevel): string {
  switch (level) {
    case 'overdue': return 'border-l-4 border-l-foreground';
    case 'urgent':  return 'border-l-3 border-l-foreground/80';
    case 'soon':    return 'border-l-2 border-l-foreground/50';
    case 'normal':  return 'border-l border-l-border';
  }
}
```

### Waterfall Step Chart Component Pattern

```typescript
// src/components/finance/WaterfallChart.tsx
// SVG stepped line showing balance cascade

interface WaterfallChartProps {
  startingBalance: number;
  bills: Array<{ name: string; amount: number; paid: boolean }>;
  width?: number;
  height?: number;
}

// The chart renders:
// 1. Horizontal line at starting balance
// 2. For each bill (sorted by due_day):
//    - Vertical drop equal to bill amount (solid if paid, dashed if unpaid)
//    - Horizontal line at new balance level
// 3. Y-axis labels at key balance points
// 4. Bill name labels below each step

// SVG viewBox approach lets it scale to container width
// Use `<polyline>` for the paid path, separate `<polyline>` with dasharray for unpaid
```

### Year Overview Progress Bar Logic

```typescript
// Progress bar interpretation:
// - Full bar width = total regular income (sum of all income sources)
// - Expenses fill from the left (consuming income)
// - One-off income extends beyond 100% with different opacity

interface ProgressBarData {
  regularIncome: number;
  expenses: number;
  oneOffIncome: number;
}

// Bar segments (left to right):
// 1. Expenses segment: width = (expenses / regularIncome) * 100%, opacity-80
// 2. Remaining income: width = remaining %, opacity-30
// 3. One-off extension: width proportional to oneOff, opacity-20, extends past 100%

// The "beyond 100%" visual: use a wider container and let the one-off
// segment push past the regular income bar boundary with a distinct opacity
```

## State of the Art

| Old Approach (Source App) | Current Approach (Wintrack Phase 4) | Impact |
|---------------------------|--------------------------------------|--------|
| Single `bills` table with month_id | Template + instance model (bill_templates + monthly_bills) | Cleaner recurrence, edit-once propagation |
| `rollover_recurring_bills` copies rows from prev month | `populate_monthly_bills` generates from templates with recurrence checks | Handles 4 recurrence types vs just boolean `recurring` |
| No balance history | Explicit `balance_changes` audit table | HIST-01..04 requirements met |
| No one-off income concept | Dedicated `oneoff_income` table | ONEOFF-01..04 requirements met |
| Dashboard snapshot RPC returns everything | Separate RPCs per concern (bills, history, year overview) | More modular, easier to extend |

## Open Questions

1. **Bill template editing vs instance editing**
   - What we know: Templates define the recurring bill. Monthly instances are snapshots.
   - What's unclear: When user edits a template, should existing unpaid instances update? Or only future instances?
   - Recommendation: Edit template, regenerate future unpaid instances. Already-paid instances are frozen. This keeps history accurate while allowing corrections.

2. **Year overview year selection**
   - What we know: Route is `/finance/year`. Shows 12 months.
   - What's unclear: Which year? Current year only? Or with year navigation?
   - Recommendation: Default to current year. Add prev/next year navigation arrows in the header. Use the get_year_overview RPC with year parameter.

3. **Waterfall chart for months with no bills**
   - What we know: The waterfall shows balance cascading as bills are paid.
   - What's unclear: What to show if a month has zero bills.
   - Recommendation: Show just the starting balance as a flat line with a label. Or hide the waterfall section entirely and show a "No bills this month" message.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BILL-01 | useBills.addBillTemplate creates template | unit | `npx vitest run src/hooks/useBills.test.ts -t "add template"` | No -- Wave 0 |
| BILL-02 | useBills.toggleBillPaid calls RPC, refetches | unit | `npx vitest run src/hooks/useBills.test.ts -t "toggle paid"` | No -- Wave 0 |
| BILL-03 | useBills.editTemplate/deleteTemplate CRUD | unit | `npx vitest run src/hooks/useBills.test.ts -t "edit\|delete"` | No -- Wave 0 |
| BILL-04 | populate_monthly_bills respects recurrence | unit | `npx vitest run src/hooks/useBills.test.ts -t "populate"` | No -- Wave 0 |
| BILL-05 | getDueUrgency returns correct level/label | unit | `npx vitest run src/lib/utils/finance.test.ts -t "urgency"` | No -- Wave 0 |
| BILL-06 | BillsList filters out paid one-time bills | unit | `npx vitest run src/components/finance/BillsList.test.tsx -t "one-time"` | No -- Wave 0 |
| BILL-07 | BillRow shows remaining count for recurring | unit | `npx vitest run src/components/finance/BillRow.test.tsx -t "remaining"` | No -- Wave 0 |
| FIN-02 | WaterfallChart renders steps from bills | unit | `npx vitest run src/components/finance/WaterfallChart.test.tsx` | No -- Wave 0 |
| FIN-03 | Past month shows frozen read-only state | unit | `npx vitest run src/pages/FinancePage.test.tsx -t "past month"` | No -- Wave 0 |
| FIN-04 | Future month shows projected balance | unit | `npx vitest run src/pages/FinancePage.test.tsx -t "future"` | No -- Wave 0 |
| FIN-05 | YearOverviewPage renders 12 months | unit | `npx vitest run src/pages/YearOverviewPage.test.tsx` | No -- Wave 0 |
| HIST-01 | apply_balance_override logs change | unit | `npx vitest run src/hooks/useBalanceHistory.test.ts -t "log"` | No -- Wave 0 |
| HIST-02 | BalanceHistoryIndicator shows last delta | unit | `npx vitest run src/components/finance/BalanceHistoryIndicator.test.tsx` | No -- Wave 0 |
| HIST-03 | BalanceHistoryModal lists all changes | unit | `npx vitest run src/components/finance/BalanceHistoryModal.test.tsx` | No -- Wave 0 |
| HIST-04 | revert_balance_change adjusts balance | unit | `npx vitest run src/hooks/useBalanceHistory.test.ts -t "revert"` | No -- Wave 0 |
| ONEOFF-01 | useOneOffIncome.add calls RPC | unit | `npx vitest run src/hooks/useOneOffIncome.test.ts -t "add"` | No -- Wave 0 |
| ONEOFF-02 | One-off income adds to balance | unit | `npx vitest run src/hooks/useOneOffIncome.test.ts -t "balance"` | No -- Wave 0 |
| ONEOFF-03 | YearGrid shows one-off extension | unit | `npx vitest run src/components/finance/YearGrid.test.tsx -t "oneoff"` | No -- Wave 0 |
| ONEOFF-04 | useOneOffIncome.edit/delete CRUD | unit | `npx vitest run src/hooks/useOneOffIncome.test.ts -t "edit\|delete"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/useBills.test.ts` -- covers BILL-01, BILL-02, BILL-03, BILL-04
- [ ] `src/hooks/useBalanceHistory.test.ts` -- covers HIST-01, HIST-04
- [ ] `src/hooks/useOneOffIncome.test.ts` -- covers ONEOFF-01, ONEOFF-02, ONEOFF-04
- [ ] `src/hooks/useYearOverview.test.ts` -- covers FIN-05 data layer
- [ ] `src/lib/utils/finance.test.ts` -- covers BILL-05 (urgency), FIN-02 (waterfall steps)
- [ ] `src/components/finance/BillsList.test.tsx` -- covers BILL-06
- [ ] `src/components/finance/BillRow.test.tsx` -- covers BILL-07
- [ ] `src/components/finance/WaterfallChart.test.tsx` -- covers FIN-02
- [ ] `src/components/finance/BalanceHistoryIndicator.test.tsx` -- covers HIST-02
- [ ] `src/components/finance/BalanceHistoryModal.test.tsx` -- covers HIST-03
- [ ] `src/components/finance/YearGrid.test.tsx` -- covers ONEOFF-03
- [ ] `src/pages/YearOverviewPage.test.tsx` -- covers FIN-05

## Sources

### Primary (HIGH confidence)
- Wintrack Phase 3 migration `008_finance_tables.sql` -- existing months, income_sources, monthly_income schema
- Wintrack Phase 3 RPCs `009_finance_rpcs.sql` -- ensure_month_exists, apply_income_received, populate_monthly_income patterns
- Wintrack `src/hooks/useFinance.ts` -- existing hook pattern for month-scoped queries
- Wintrack `src/pages/FinancePage.tsx` -- existing Finance page structure to extend
- Source app `P350/supabase/migrations/20260218000001_finance_mvp_schema.sql` -- bills table schema, rollover_recurring_bills RPC
- Source app `P350/apps/web/components/finance/lists.tsx` -- BillsList component pattern

### Secondary (MEDIUM confidence)
- Phase 3 Research `03-RESEARCH.md` -- established patterns for RPC, RLS, currency formatting
- Architecture Research `ARCHITECTURE.md` -- hook-per-domain pattern, overlay state machines

### Tertiary (LOW confidence)
- Waterfall chart SVG approach -- based on general SVG knowledge, no specific library reference. The implementation is straightforward polyline math but visual polish may need iteration.

## Metadata

**Confidence breakdown:**
- Database schema: HIGH -- extends proven Phase 3 patterns with template/instance model from source app
- RPC functions: HIGH -- follows exact same atomic pattern as apply_income_received
- Bill recurrence logic: HIGH -- populate_monthly_bills mirrors populate_monthly_income with added recurrence checks
- Balance history: HIGH -- simple audit table with delta tracking, straightforward RPC
- One-off income: HIGH -- simplest feature area, standard CRUD + balance adjustment
- Waterfall chart: MEDIUM -- SVG approach is sound but visual implementation may need refinement
- Year overview: MEDIUM -- data aggregation RPC is straightforward, 12-column layout needs responsive consideration
- Due date urgency: HIGH -- pure date arithmetic with clear thresholds

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable domain, no external dependencies changing)
