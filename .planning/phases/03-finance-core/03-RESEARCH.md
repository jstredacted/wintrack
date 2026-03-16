# Phase 3: Finance Core - Research

**Researched:** 2026-03-17
**Domain:** Finance module — balance tracking, monthly budgets, income streams with USD-PHP conversion, month navigation
**Confidence:** HIGH

## Summary

Phase 3 builds the finance core: a new `/finance` route with current balance hero, budget circular gauge, income source cards with Wise/PayPal conversion, and MonthStrip navigation. The database schema adapts the existing `₱350` source app's `months` table and RPC patterns but must add `user_id` columns (the source app had no multi-user concept) and RLS policies matching wintrack's `auth.uid()` pattern. New tables: `months`, `income_sources`, `monthly_income`. New hooks: `useFinance`, `useIncomeConfig`. New components: `FinancePage`, `MonthStrip`, `BalanceHero`, `BudgetGauge`, `IncomeCard`.

The critical technical decisions are: (1) store all amounts as `numeric(14,2)` in Postgres (matching the source app, which already uses this approach successfully -- not integer centavos, since Postgres `numeric` is exact-precision), (2) use the free Frankfurter API for live mid-market exchange rates with hardcoded fee formulas for Wise/PayPal, (3) build the circular gauge as raw SVG (matching ConsistencyGraph patterns), not Recharts, (4) use Supabase RPC for atomic operations like "mark income received + add to balance".

**Primary recommendation:** Port the `₱350` app's `months` table design with `user_id` added, create `income_sources` (config) and `monthly_income` (per-month instances) tables, build the Finance page as a single scrollable view with MonthStrip at top following DayStrip patterns exactly.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- New route at `/finance` under AppShell
- SideNav order: Today -> Journal -> Finance -> Settings
- Wallet icon (Lucide) for the Finance tab
- MonthStrip at very top of the page (like DayStrip on TodayPage), then content below
- Content below MonthStrip: large balance hero, then budget progress, then income source cards
- Large hero number for current balance -- big monospaced amount front and center with "Current Balance" label
- Tap-to-edit for balance override -- tap the number itself to make it editable inline, type new amount, press enter
- Circular gauge (donut/ring chart) for budget progress -- fills as expenses approach limit, color changes at thresholds (neutral/approaching/critical)
- Currency formatting: peso sign prefix, two decimal places, comma thousands separator
- Full card per income source showing: source name, USD amount, expected PHP conversion, payday date, and a toggle button to mark received
- When toggled as received: card collapses to a single-line summary with an undo option
- Expandable fee detail -- show net PHP by default, tap to expand and see USD amount, exchange rate, fee deducted, net PHP
- Income sources configured in Settings (name, amount, currency USD/PHP, conversion method Wise/PayPal/None, expected payday)
- MonthStrip styled like DayStrip -- horizontal scrollable row of month labels, current month centered and highlighted
- All-time range -- every month that has data plus current month (not limited to current year)
- Past months are read-only except balance override (can correct final balance for past months, but can't mark income/toggle bills)
- Current balance carries forward to next month as starting point
- MonthStrip should feel like DayStrip -- same visual weight, same scroll behavior, just months instead of days
- Balance hero number should be the biggest text on the finance page
- Income cards should feel like win cards in the Today view -- cards you interact with by toggling state
- Circular gauge should be monochrome (not colored) to match Nothing aesthetic -- use foreground opacity levels like the heatmap

### Claude's Discretion
- Database schema design for months, income_sources, monthly_income tables
- Supabase RLS policies for new finance tables
- Wise/PayPal API integration approach for live rates
- Circular gauge SVG implementation (existing ConsistencyGraph uses SVG patterns)
- MonthStrip scroll behavior and centering logic

### Deferred Ideas (OUT OF SCOPE)
- Year overview with 12-month trajectory -- Phase 4 (FIN-05)
- Waterfall view showing balance cascade as bills are paid -- Phase 4 (FIN-02)
- Past month read-only view with historical data -- Phase 4 (FIN-03)
- Future month projections -- Phase 4 (FIN-04)
- Bills management -- Phase 4 (BILL-01..07)
- External balances (Polymarket, SOL DCA) -- Phase 4 (EXT-01..03)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BAL-01 | User sees current balance as single source of truth | Balance stored in `months` table `current_balance` column; BalanceHero component displays it |
| BAL-02 | User can manually override current balance at any time | Tap-to-edit inline on BalanceHero; direct update to `months.current_balance` |
| BAL-03 | When income is marked received, net PHP amount auto-adds to current balance | RPC `apply_income_received` atomically updates `monthly_income.received` + `months.current_balance` |
| BAL-04 | When bill/expense is marked paid, amount auto-deducts from current balance | Phase 4 concern (bills), but BAL-04 listed here -- the RPC pattern is established, bill toggle defers to Phase 4 |
| BAL-05 | Current balance carries forward to next month as starting point | When navigating to a new month, `starting_balance` copies from previous month's `current_balance` |
| BUD-01 | User can set a monthly budget limit | `months.budget_limit` column; editable in finance page settings area |
| BUD-02 | Budget progress visualization (neutral/approaching/critical) | SVG circular gauge with monochrome opacity thresholds |
| INC-01 | Configure income sources in Settings (name, amount, currency, conversion method) | `income_sources` table + Settings page UI |
| INC-02 | Expected payday per income source | `income_sources.payday_day` column (day of month integer) |
| INC-03 | Each income source appears as toggleable card per month | `monthly_income` table joins `income_sources` for current month; IncomeCard component |
| INC-04 | USD sources auto-fetch live rate and deduct fees | Frankfurter API for mid-market rate + hardcoded fee formulas for Wise (0.57%) / PayPal (3%) |
| INC-05 | Received income auto-adds net PHP to current balance, card greys out | RPC `apply_income_received` handles atomically; card styling changes on `received = true` |
| INC-06 | Add, edit, and remove income sources from Settings | CRUD on `income_sources` table from Settings page |
| FIN-01 | MonthStrip navigation between months | MonthStrip component following DayStrip pattern |
</phase_requirements>

## Standard Stack

### Core (No new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase JS | ^2.98.0 | Database queries + RPC calls | Already installed; finance hooks follow identical pattern to useWins |
| React 19 | ^19.2.0 | UI components | Already installed |
| Lucide React | ^0.577.0 | Wallet icon for nav, ChevronLeft/Right for MonthStrip | Already installed |
| Tailwind v4 | ^4.x | Styling | Already installed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Frankfurter API | N/A (free, no key) | Live mid-market USD-PHP exchange rate | When user marks USD income as received; fetch rate at that moment |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Frankfurter API | Wise API directly | Wise API requires Bearer auth token (API key application). Frankfurter is free, no auth, same mid-market rate. We only need the rate, not the Wise-specific rate. |
| Frankfurter API | ExchangeRate-API | Also free/no-auth, but Frankfurter is fully open-source and backed by ECB data |
| Raw SVG gauge | Recharts PieChart | Recharts adds ~100KB for a single donut. Raw SVG matches ConsistencyGraph pattern already in codebase. The gauge is one circle with a stroke-dasharray. |
| Recharts (shadcn chart) | Not needed for Phase 3 | Budget gauge is a single SVG ring, not a chart. Recharts is overkill. Defer to Phase 4 if waterfall/year views need it. |
| integer centavos | numeric(14,2) | The source app already uses numeric(14,2) successfully. Postgres `numeric` is exact-precision (no floating point). Avoids the constant divide-by-100 at display layer. |

**Installation:**
```bash
# No new packages needed for Phase 3
# Frankfurter API is a free HTTP endpoint, no SDK
```

## Architecture Patterns

### Recommended Project Structure

```
src/
  pages/
    FinancePage.tsx              # Main finance route, holds month state
  components/
    finance/
      MonthStrip.tsx             # Horizontal scrollable month selector
      BalanceHero.tsx            # Large balance display with tap-to-edit
      BudgetGauge.tsx            # SVG circular progress ring
      IncomeCard.tsx             # Per-income-source card with toggle
      IncomeCardCollapsed.tsx    # Single-line received state
  hooks/
    useFinance.ts               # Balance, budget, monthly_income for a given month
    useIncomeConfig.ts           # CRUD for income_sources (Settings page)
    useExchangeRate.ts           # Frankfurter API fetch with caching
  lib/
    utils/
      currency.ts               # formatPHP(), formatUSD(), calculateWiseFee(), calculatePayPalFee()
      month.ts                   # getCurrentMonth(), getMonthLabel(), parseMonth()
  types/
    finance.ts                  # Month, IncomeSource, MonthlyIncome, ExchangeRate types
supabase/
  migrations/
    008_finance_tables.sql      # months, income_sources, monthly_income + RLS
    009_finance_rpcs.sql         # apply_income_received, ensure_month_exists
```

### Pattern 1: Month-Scoped Finance Queries (from Architecture Research)

**What:** All finance hooks take `month: string` (format: `'2026-03'`). FinancePage owns month state and passes it down.
**When to use:** Every finance data access.
**Example:**
```typescript
// FinancePage.tsx
const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonth());
const { monthData, incomes, loading, updateBalance, toggleIncomeReceived } = useFinance(selectedMonth);
```

### Pattern 2: Atomic RPC for Multi-Table Operations

**What:** Use `supabase.rpc()` for operations that must update multiple tables atomically.
**When to use:** Marking income received (updates `monthly_income.received` + `months.current_balance`), ensuring a month row exists.
**Example:**
```typescript
// Mark income received: atomically set received=true, add net_php to balance
const { data, error } = await supabase.rpc('apply_income_received', {
  p_monthly_income_id: incomeId,
  p_net_php: calculatedNetPhp,
  p_exchange_rate: rate,
  p_received: true,
});
```

### Pattern 3: DayStrip-Derived MonthStrip

**What:** MonthStrip follows the exact same implementation pattern as DayStrip -- horizontal scroll container, `snap-x snap-mandatory`, gradient fades, chevron buttons, centered selection with `border-b-2`.
**When to use:** MonthStrip component.
**Example:**
```typescript
// Generate month cells - all months with data + current month
const cells = monthsWithData.map(m => ({
  key: m,  // '2026-03'
  label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(parseMonth(m)),
  year: parseMonth(m).getFullYear(),
  isSelected: selectedMonth === m,
}));
```

### Pattern 4: Inline Edit for Balance Override

**What:** Balance hero number is a display element that becomes an input on tap/click. Press Enter or blur to save.
**When to use:** BAL-02 requirement.
**Example:**
```typescript
const [editing, setEditing] = useState(false);
const [editValue, setEditValue] = useState('');

// Display mode: click to edit
// Edit mode: controlled input, Enter to save, Escape to cancel
```

### Anti-Patterns to Avoid

- **Zustand store for finance data:** Finance data is page-scoped. Use hook-local state (same as useWins/useJournal). No global store.
- **Floating-point amounts in JS:** Even though Postgres `numeric` is exact, JS `number` is IEEE 754 float. Parse Supabase response amounts with `parseFloat()` but format immediately with `Intl.NumberFormat` -- never do arithmetic chains in JS on currency amounts.
- **Calling Wise/PayPal APIs directly from client:** Both require authentication. Use Frankfurter for mid-market rate, then apply fee formulas client-side.
- **Service role key from source app:** The `₱350` source app grants permissions to `anon` role directly (no RLS). Wintrack uses RLS with `auth.uid()`. Never port the permissive grants.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Exchange rate fetching | Custom polling/caching system | Single fetch from `api.frankfurter.dev` when income is toggled received | Rate only needed at the moment of marking received; no real-time ticker needed |
| Currency formatting | Template literals with manual commas | `Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })` | Handles comma separators, decimal places, edge cases (0, negatives) correctly |
| SVG circular gauge | Canvas drawing or Recharts | Raw SVG `<circle>` with `stroke-dasharray` / `stroke-dashoffset` | One circle element with two attributes. ConsistencyGraph already demonstrates SVG patterns in this codebase. |
| Month arithmetic | Manual date math | `new Date(year, month + offset)` with `Intl.DateTimeFormat` for labels | JS Date handles month overflow (month 13 = January next year) correctly |
| Atomic balance updates | Client-side multi-step with rollback | Postgres RPC function | Single transaction, no partial failure risk |

**Key insight:** The finance module is fundamentally simple -- one balance number, one budget limit, N income sources per month. The complexity is in atomicity (mark received + update balance) and display (formatting, gauge). Both are solved by existing tools (Postgres RPC, Intl API, SVG).

## Common Pitfalls

### Pitfall 1: RLS Blocks All Finance Queries (Silent Empty Results)

**What goes wrong:** Source app `₱350` has no RLS -- it grants full CRUD to `anon` role directly. If you port the schema without adding RLS policies and `user_id` columns, queries return empty results (not errors) because wintrack's JWT-based auth expects `auth.uid() = user_id` on every table.
**Why it happens:** Source app was single-user with no `user_id` concept. All queries worked via permissive grants.
**How to avoid:** Every new table MUST have: (1) `user_id uuid NOT NULL` column, (2) `ALTER TABLE x ENABLE ROW LEVEL SECURITY`, (3) Four policies (select/insert/update/delete) matching `auth.uid() = user_id`. Copy pattern from `001_initial_schema.sql` exactly.
**Warning signs:** Finance page shows empty state / zero balance despite having data in Supabase dashboard.

### Pitfall 2: Wise/PayPal API Authentication Blocks Client-Side Calls

**What goes wrong:** Attempting to call `api.wise.com/v1/rates` from the browser fails because it requires a Bearer token (API key). PayPal's exchange rate API similarly requires OAuth credentials.
**Why it happens:** Both are partner/business APIs, not public APIs. The CONTEXT.md says "Wise/PayPal API for live exchange rates" but these APIs are not freely accessible from a browser.
**How to avoid:** Use Frankfurter API (`api.frankfurter.dev/v1/latest?base=USD&symbols=PHP`) which is free, no-auth, CORS-enabled. Then apply Wise/PayPal fee formulas client-side: Wise ~0.57% of transfer + ~$1 flat fee; PayPal ~3% of converted amount. These fee percentages are hardcoded constants that can be updated in settings later.
**Warning signs:** CORS errors in browser console when calling wise.com or paypal.com APIs.

### Pitfall 3: Month Row Doesn't Exist Yet

**What goes wrong:** User navigates to a month that has no row in the `months` table. All finance queries for that month return null/empty. The balance shows as 0 instead of carrying forward from the previous month.
**Why it happens:** Months are created lazily (when data is first needed), but the UI expects a month row to always exist for the selected month.
**How to avoid:** Create an `ensure_month_exists` RPC that checks if the month row exists, and if not, creates it with `starting_balance` copied from the previous month's `current_balance`. Call this RPC in `useFinance` before any other queries.
**Warning signs:** Switching to a new month shows 0 balance instead of the carried-forward amount.

### Pitfall 4: Currency Formatting Inconsistency

**What goes wrong:** Some components show "P45,000.00", others show "PHP 45000", others show "45000.0". The peso sign character varies between components.
**Why it happens:** Each component formats currency independently with different approaches.
**How to avoid:** Create ONE `formatPHP(amount: number): string` utility in `lib/utils/currency.ts`. Every component imports and calls this. Never use `Intl.NumberFormat` directly in components.
**Warning signs:** Currency displays look different on different parts of the finance page.

### Pitfall 5: Exchange Rate Stale or Missing at Toggle Time

**What goes wrong:** User marks USD income as received, but the Frankfurter API is slow/down. The income is marked received with no exchange rate, and the balance gets 0 added.
**Why it happens:** Network request to external API at the moment of user action. No fallback.
**How to avoid:** (1) Fetch rate when the finance page loads (background), cache in component state. (2) When toggling received, use cached rate if fresh (< 1 hour). (3) If no rate available, show error toast and don't mark received. (4) Store the rate used in `monthly_income.exchange_rate_used` for audit trail.
**Warning signs:** Income marked received but balance doesn't change. Or balance changes by wrong amount.

## Code Examples

### Currency Formatting Utility

```typescript
// src/lib/utils/currency.ts
const PHP_FORMATTER = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPHP(amount: number): string {
  return PHP_FORMATTER.format(amount);
}

export function formatUSD(amount: number): string {
  return USD_FORMATTER.format(amount);
}

// Wise fee: ~0.57% variable + ~$1.02 flat (for USD->PHP)
// Source: https://wise.com/us/compare/wise-usd-to-php
export function calculateWiseNetPHP(usdAmount: number, rate: number): {
  fee: number;
  netUSD: number;
  netPHP: number;
} {
  const flatFee = 1.02;
  const variableRate = 0.0057;
  const fee = flatFee + (usdAmount * variableRate);
  const netUSD = usdAmount - fee;
  const netPHP = netUSD * rate;
  return { fee, netUSD, netPHP: Math.round(netPHP * 100) / 100 };
}

// PayPal fee: ~3% currency conversion spread on rate
// Source: https://wise.com/us/compare/paypal-exchange-rate
export function calculatePayPalNetPHP(usdAmount: number, rate: number): {
  fee: number;
  effectiveRate: number;
  netPHP: number;
} {
  const spreadPercent = 0.03;
  const effectiveRate = rate * (1 - spreadPercent);
  const netPHP = usdAmount * effectiveRate;
  const fee = usdAmount * rate - netPHP;
  return { fee, effectiveRate, netPHP: Math.round(netPHP * 100) / 100 };
}
```

### Frankfurter API Exchange Rate Fetch

```typescript
// src/hooks/useExchangeRate.ts
import { useState, useEffect } from 'react';

interface ExchangeRateResult {
  rate: number | null;
  loading: boolean;
  error: string | null;
  fetchedAt: Date | null;
}

export function useExchangeRate(base: string = 'USD', target: string = 'PHP'): ExchangeRateResult {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRate() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `https://api.frankfurter.dev/v1/latest?base=${base}&symbols=${target}`
        );
        if (!res.ok) throw new Error(`Rate API error: ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setRate(data.rates[target]);
          setFetchedAt(new Date());
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch rate');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRate();
    return () => { cancelled = true; };
  }, [base, target]);

  return { rate, loading, error, fetchedAt };
}
```

### SVG Circular Gauge (Budget Progress)

```typescript
// src/components/finance/BudgetGauge.tsx
// Source: SVG stroke-dasharray technique, matching ConsistencyGraph monochrome style
interface BudgetGaugeProps {
  spent: number;
  limit: number;
  size?: number;
  strokeWidth?: number;
}

export default function BudgetGauge({ spent, limit, size = 160, strokeWidth = 12 }: BudgetGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = limit > 0 ? Math.min(spent / limit, 1) : 0;
  const dashOffset = circumference * (1 - progress);

  // Monochrome thresholds matching Nothing aesthetic
  // <50%: subtle foreground, 50-80%: medium, >80%: full foreground
  const getOpacity = () => {
    if (progress < 0.5) return 0.3;
    if (progress < 0.8) return 0.55;
    return 1;
  };

  return (
    <svg width={size} height={size} className="block">
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={strokeWidth}
      />
      {/* Progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--foreground)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        style={{ opacity: getOpacity() }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}
```

### Database Schema (Recommended)

```sql
-- 008_finance_tables.sql

-- ============================================================
-- months — one row per calendar month
-- ============================================================
CREATE TABLE IF NOT EXISTS months (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL,
  year             int NOT NULL CHECK (year >= 2000 AND year <= 3000),
  month            int NOT NULL CHECK (month BETWEEN 1 AND 12),
  starting_balance numeric(14,2) NOT NULL DEFAULT 0,
  current_balance  numeric(14,2) NOT NULL DEFAULT 0,
  budget_limit     numeric(14,2) NOT NULL DEFAULT 0 CHECK (budget_limit >= 0),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, year, month)
);

ALTER TABLE months ENABLE ROW LEVEL SECURITY;
CREATE POLICY "months_select" ON months FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "months_insert" ON months FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "months_update" ON months FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "months_delete" ON months FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- income_sources — user-configured income streams (Settings)
-- ============================================================
CREATE TABLE IF NOT EXISTS income_sources (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL,
  name              text NOT NULL,
  amount            numeric(14,2) NOT NULL CHECK (amount >= 0),
  currency          text NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'PHP')),
  conversion_method text NOT NULL DEFAULT 'none' CHECK (conversion_method IN ('wise', 'paypal', 'none')),
  payday_day        int CHECK (payday_day BETWEEN 1 AND 31),
  active            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "income_sources_select" ON income_sources FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "income_sources_insert" ON income_sources FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "income_sources_update" ON income_sources FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "income_sources_delete" ON income_sources FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- monthly_income — per-month instances of income sources
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_income (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL,
  month_id          uuid NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  income_source_id  uuid NOT NULL REFERENCES income_sources(id) ON DELETE CASCADE,
  expected_amount   numeric(14,2) NOT NULL,
  currency          text NOT NULL DEFAULT 'USD',
  conversion_method text NOT NULL DEFAULT 'none',
  exchange_rate     numeric(10,4),
  fee_amount        numeric(14,2),
  net_php           numeric(14,2),
  received          boolean NOT NULL DEFAULT false,
  received_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (month_id, income_source_id)
);

ALTER TABLE monthly_income ENABLE ROW LEVEL SECURITY;
CREATE POLICY "monthly_income_select" ON monthly_income FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "monthly_income_insert" ON monthly_income FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "monthly_income_update" ON monthly_income FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "monthly_income_delete" ON monthly_income FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS months_user_year_month_idx ON months(user_id, year, month);
CREATE INDEX IF NOT EXISTS income_sources_user_active_idx ON income_sources(user_id, active);
CREATE INDEX IF NOT EXISTS monthly_income_month_id_idx ON monthly_income(month_id);
```

### RPC Functions (Recommended)

```sql
-- 009_finance_rpcs.sql

-- Ensure a month row exists, carrying forward balance from previous month
CREATE OR REPLACE FUNCTION ensure_month_exists(p_user_id uuid, p_year int, p_month int)
RETURNS months
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  month_row months;
  prev_balance numeric(14,2);
  prev_year int;
  prev_month int;
BEGIN
  SELECT * INTO month_row FROM months WHERE user_id = p_user_id AND year = p_year AND month = p_month;

  IF FOUND THEN
    RETURN month_row;
  END IF;

  -- Calculate previous month
  IF p_month = 1 THEN
    prev_year := p_year - 1;
    prev_month := 12;
  ELSE
    prev_year := p_year;
    prev_month := p_month - 1;
  END IF;

  -- Get previous month's balance (or 0 if no previous month)
  SELECT current_balance INTO prev_balance
  FROM months WHERE user_id = p_user_id AND year = prev_year AND month = prev_month;

  prev_balance := COALESCE(prev_balance, 0);

  INSERT INTO months (user_id, year, month, starting_balance, current_balance)
  VALUES (p_user_id, p_year, p_month, prev_balance, prev_balance)
  ON CONFLICT (user_id, year, month) DO NOTHING
  RETURNING * INTO month_row;

  -- Handle race condition (concurrent insert)
  IF NOT FOUND THEN
    SELECT * INTO month_row FROM months WHERE user_id = p_user_id AND year = p_year AND month = p_month;
  END IF;

  RETURN month_row;
END;
$$;

-- Mark income as received/unreceived, adjusting balance atomically
CREATE OR REPLACE FUNCTION apply_income_received(
  p_monthly_income_id uuid,
  p_received boolean,
  p_net_php numeric DEFAULT NULL,
  p_exchange_rate numeric DEFAULT NULL,
  p_fee_amount numeric DEFAULT NULL
)
RETURNS monthly_income
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  income_row monthly_income;
  prev_net numeric(14,2);
BEGIN
  SELECT * INTO income_row FROM monthly_income WHERE id = p_monthly_income_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'monthly_income_not_found';
  END IF;

  -- Verify ownership via RLS (SECURITY INVOKER means caller's context)
  prev_net := COALESCE(income_row.net_php, 0);

  IF p_received THEN
    -- Mark received: store conversion details, add to balance
    UPDATE monthly_income SET
      received = true,
      received_at = now(),
      exchange_rate = p_exchange_rate,
      fee_amount = p_fee_amount,
      net_php = p_net_php
    WHERE id = p_monthly_income_id
    RETURNING * INTO income_row;

    UPDATE months SET current_balance = current_balance + COALESCE(p_net_php, 0)
    WHERE id = income_row.month_id;
  ELSE
    -- Undo: remove from balance, clear conversion details
    UPDATE months SET current_balance = current_balance - prev_net
    WHERE id = income_row.month_id;

    UPDATE monthly_income SET
      received = false,
      received_at = NULL,
      exchange_rate = NULL,
      fee_amount = NULL,
      net_php = NULL
    WHERE id = p_monthly_income_id
    RETURNING * INTO income_row;
  END IF;

  RETURN income_row;
END;
$$;

-- Populate monthly_income rows from active income_sources for a month
CREATE OR REPLACE FUNCTION populate_monthly_income(p_user_id uuid, p_month_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  inserted_count int;
BEGIN
  WITH new_income AS (
    INSERT INTO monthly_income (user_id, month_id, income_source_id, expected_amount, currency, conversion_method)
    SELECT
      s.user_id, p_month_id, s.id, s.amount, s.currency, s.conversion_method
    FROM income_sources s
    WHERE s.user_id = p_user_id AND s.active = true
    ON CONFLICT (month_id, income_source_id) DO NOTHING
    RETURNING id
  )
  SELECT count(*) INTO inserted_count FROM new_income;

  RETURN COALESCE(inserted_count, 0);
END;
$$;

-- Set search_path for security
ALTER FUNCTION ensure_month_exists(uuid, int, int) SET search_path = public;
ALTER FUNCTION apply_income_received(uuid, boolean, numeric, numeric, numeric) SET search_path = public;
ALTER FUNCTION populate_monthly_income(uuid, uuid) SET search_path = public;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Source app: no user_id, no RLS | Wintrack: user_id + RLS on every table | Wintrack v1.0 | Must add user_id to all ported tables |
| Source app: service role key | Wintrack: anon key + JWT | Wintrack v1.0 | RPC functions must be SECURITY INVOKER |
| Source app: single salary field on months | Wintrack: multiple income sources | Phase 3 design | New income_sources + monthly_income tables |
| Source app: bills in same phase | Wintrack: bills deferred to Phase 4 | Phase 3 CONTEXT | BAL-04 (bill deduction) established in schema but UI deferred |

**Deprecated/outdated from source app:**
- `categories` table: Not needed for Phase 3 (bills have categories, income sources don't)
- `transactions` table: Not needed for Phase 3 (wintrack uses balance-override model, not transaction logging)
- `investment_*` tables: Deferred to Phase 4 (EXT-01..03)
- Direct `anon` role grants without RLS: Replaced by proper RLS policies

## Open Questions

1. **Wise/PayPal fee accuracy**
   - What we know: Wise charges ~0.57% + ~$1 flat for USD->PHP; PayPal charges ~3% spread on rate
   - What's unclear: Exact current fee tiers may vary by transfer amount. Fees change periodically.
   - Recommendation: Hardcode current fee percentages as constants in `currency.ts`. Add a "Fee rates" section in Settings page where user can update the percentages if they change. This is a personal tracking app, not a payment processor -- approximate is fine.

2. **Frankfurter API reliability**
   - What we know: Free, no auth, ECB-sourced, open-source. Has been stable.
   - What's unclear: No SLA. Could go down.
   - Recommendation: Cache the last fetched rate in localStorage with timestamp. If API fails, use cached rate with a "(cached)" indicator. Rate only matters at the moment of marking received -- not real-time.

3. **BAL-04 (bill deduction) scope**
   - What we know: BAL-04 is listed in Phase 3 requirements but bills are deferred to Phase 4.
   - What's unclear: Should we implement the deduction mechanism now?
   - Recommendation: The `current_balance` update pattern is established by `apply_income_received`. BAL-04's actual bill toggle UI is Phase 4. In Phase 3, just ensure the balance column exists and can be decremented. Mark BAL-04 as "mechanism ready, UI deferred."

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
| BAL-01 | useFinance returns month data with current_balance | unit | `npx vitest run src/hooks/useFinance.test.ts -t "returns month data"` | No -- Wave 0 |
| BAL-02 | updateBalance mutates months.current_balance | unit | `npx vitest run src/hooks/useFinance.test.ts -t "update balance"` | No -- Wave 0 |
| BAL-03 | toggleIncomeReceived adds net_php to balance | unit | `npx vitest run src/hooks/useFinance.test.ts -t "income received"` | No -- Wave 0 |
| BAL-05 | ensure_month_exists carries forward balance | unit | `npx vitest run src/hooks/useFinance.test.ts -t "carry forward"` | No -- Wave 0 |
| BUD-01 | updateBudgetLimit persists to months table | unit | `npx vitest run src/hooks/useFinance.test.ts -t "budget limit"` | No -- Wave 0 |
| BUD-02 | BudgetGauge renders correct progress arc | unit | `npx vitest run src/components/finance/BudgetGauge.test.tsx -t "gauge"` | No -- Wave 0 |
| INC-01 | useIncomeConfig CRUD operations | unit | `npx vitest run src/hooks/useIncomeConfig.test.ts` | No -- Wave 0 |
| INC-03 | IncomeCard renders for each monthly_income | unit | `npx vitest run src/components/finance/IncomeCard.test.tsx` | No -- Wave 0 |
| INC-04 | calculateWiseFee/calculatePayPalFee math | unit | `npx vitest run src/lib/utils/currency.test.ts` | No -- Wave 0 |
| INC-05 | Toggle received changes card to collapsed state | unit | `npx vitest run src/components/finance/IncomeCard.test.tsx -t "received"` | No -- Wave 0 |
| FIN-01 | MonthStrip renders months, handles selection | unit | `npx vitest run src/components/finance/MonthStrip.test.tsx` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/useFinance.test.ts` -- covers BAL-01, BAL-02, BAL-03, BAL-05, BUD-01
- [ ] `src/hooks/useIncomeConfig.test.ts` -- covers INC-01, INC-06
- [ ] `src/hooks/useExchangeRate.test.ts` -- covers rate fetching
- [ ] `src/lib/utils/currency.test.ts` -- covers INC-04 (fee calculations)
- [ ] `src/components/finance/BudgetGauge.test.tsx` -- covers BUD-02
- [ ] `src/components/finance/IncomeCard.test.tsx` -- covers INC-03, INC-05
- [ ] `src/components/finance/MonthStrip.test.tsx` -- covers FIN-01

## Sources

### Primary (HIGH confidence)
- Source app schema: `₱350/supabase/migrations/20260218000001_finance_mvp_schema.sql` -- table design, RPC patterns, dashboard snapshot function
- Source app triggers: `₱350/supabase/migrations/20260218000004_performance_triggers_and_investment_rpc.sql` -- updated_at triggers, composite indexes
- Wintrack RLS pattern: `supabase/migrations/001_initial_schema.sql` -- auth.uid() = user_id policy pattern
- Wintrack hook pattern: `src/hooks/useWins.ts` -- useState + useEffect + useCallback + optimistic updates
- DayStrip component: `src/components/history/DayStrip.tsx` -- scroll container, snap behavior, centered selection
- ConsistencyGraph SVG: `src/components/history/ConsistencyGraph.tsx` -- monochrome SVG with CSS variable fills

### Secondary (MEDIUM confidence)
- [Frankfurter API](https://frankfurter.dev/) -- free exchange rate API, no auth, ECB data
- [Wise fee structure for USD-PHP](https://wise.com/us/compare/wise-usd-to-php) -- ~0.57% variable + flat fee
- [PayPal exchange rate comparison](https://wise.com/us/compare/paypal-exchange-rate) -- ~3% spread
- [Wise API Rate endpoint](https://docs.wise.com/api-reference/rate) -- requires Bearer auth (not usable from client)

### Tertiary (LOW confidence)
- Exact Wise/PayPal fee percentages may change -- hardcoded values should be user-configurable

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, uses existing patterns
- Architecture: HIGH -- directly ports proven source app schema with wintrack conventions
- Database schema: HIGH -- adapts working ₱350 schema with user_id + RLS additions
- Exchange rate approach: MEDIUM -- Frankfurter API is stable but has no SLA
- Fee calculations: LOW -- percentages are approximate and change periodically
- Pitfalls: HIGH -- based on direct analysis of source app vs wintrack differences

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable domain, low churn)
