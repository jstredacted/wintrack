# Finance Redesign — Continuous Ledger Timeline

## Problem

The current finance tracker is locked to a per-month model. Bills, income, and balance are compartmentalized into calendar months with rigid boundaries. This doesn't match how money actually flows — income arrives on variable dates, bills span pay periods, and the balance carries forward continuously. The user's Google Sheets approach (a continuous ledger that updates as cells change) has worked since 2022 because it's flexible and not month-bound.

## Solution

Replace the month-based finance page with a **Ledger Timeline** — a single, continuous view where money flows forward through time. Months serve as lightweight visual groupings (collapsible sections), not rigid data boundaries.

## Layout

### Desktop (≥900px)
- **Fixed sidebar** (left, full viewport height, 300px): Balance card, projections, year overview table
- **Scrollable main** (right): Timeline of collapsible month sections
- **Max-width**: 1100px centered (matches existing `max-w-[1100px]` app container)
- **Desktop zoom**: 1.5x (base 18px font already in app)

### Mobile (<900px)
- **Single column**: Hero balance with projection cards → collapsible month cards → collapsible year overview at bottom
- **Base font**: 16px

### Design System
- **Font**: Geist Mono (both sans and mono — existing app convention)
- **Theme**: oklch grayscale dark mode (existing shadcn/ui Nova theme)
- **Single accent**: `#7CF5A5` — used for income, checkmarks, today marker, net badges, budget remaining, year table highlights
- **No other colors** except `--destructive` for negative/overdue states
- **Dot grid** background texture (existing)
- **Border**: `oklch(1 0 0 / 10%)` (existing)

### Reference Mockup
`.superpowers/brainstorm/3613-1774264987/finance-v2.html`

## Data Model

### New Tables

**`recurring_debts`**
- `id`, `user_id`, `name`
- `total_amount` — original debt amount
- `remaining_balance` — current remaining (decremented on payment)
- `minimum_payment` — suggested minimum per cycle
- `bill_template_id` — FK to the linked bill template
- `created_at`

**`budgets`**
- `id`, `user_id`, `name`
- `cap_amount` — monthly spending ceiling
- `active` — boolean
- `created_at`

**`budget_expenses`**
- `id`, `budget_id` (FK), `month` (string `YYYY-MM`)
- `amount`, `note` (optional), `date`
- `created_at`

### Modified Tables

**`bill_templates`** — add column:
- `category`: `'fixed' | 'recurring' | 'oneoff'`

### Removed
- `months.budget_limit` — replaced by individual `budgets` table

### Unchanged
- `months` (balance tracking stays manual via `current_balance`)
- `monthly_bills` (per-month bill instances)
- `income_sources` (managed in Settings)
- `monthly_income` (per-month income instances)
- `balance_changes` (audit trail)
- `oneoff_income` (one-time income entries)

## Four Expense Categories

### 1. Fixed Monthly
- **What**: Cost of living — rent, utilities, internet, food
- **Behavior**: Same amount every month, never ends
- **Template**: `bill_templates` with `category = 'fixed'`, `recurrence_type = 'ongoing'`
- **UI**: Checkbox to mark paid. Strikes through and dims when paid.

### 2. Recurring (Debts)
- **What**: Obligations with a depleting balance — credit card, loans, dues
- **Behavior**: Has a `recurring_debt` with `remaining_balance`. Flexible payments — pay minimum, pay extra, or pay all at once.
- **Template**: `bill_templates` with `category = 'recurring'`, linked to `recurring_debts` row
- **UI**: Checkbox → inline input pre-filled with minimum payment → edit amount → enter to confirm. Progress bar shows paid-down percentage. `remaining_balance` updates on payment.

### 3. One-off
- **What**: Single-occurrence expenses — doctor visit, repair, SOL buy
- **Behavior**: Appears once, auto-deactivates after paid. Does not repeat in future months.
- **Template**: `bill_templates` with `category = 'oneoff'`, `recurrence_type = 'one_time'`
- **UI**: Checkbox to mark paid, same as fixed.

### 4. Budgets
- **What**: Spending caps on discretionary categories — dining out, groceries
- **Behavior**: Not a bill to pay. A ceiling to track against. Optional manual expense logging.
- **Data**: `budgets` table + `budget_expenses` for logged amounts
- **UI**: Progress bar (accent fill) showing spent vs cap. Tap row → inline amount input → enter to log expense → bar updates. Shows "₱X left" on right side.

## Timeline Structure

### Sections (top to bottom in main area)

1. **Past months** — single collapsible "Past months" header. Expand to see individual month rows (each further expandable). Fully read-only when expanded — checkboxes, balance edit, and add buttons are all disabled/hidden.

2. **Current month** — auto-expanded with all categories:
   - Income (green accent highlight rows)
   - Fixed monthly
   - **Today marker** — horizontal accent line with "today · mar 23" badge. Fixed visual separator between past-due and upcoming items within the current month (not date-sorted among rows).
   - Recurring
   - One-off
   - Budgets

3. **Future months** — collapsed by default, showing month name + net badge. Expand to see projected items (dimmed at 35% opacity). Auto-populated from templates.

### Month Net Badge
Each month header shows a net badge: `+₱X` (income minus all expenses including budget caps). Accent color for positive, destructive for negative.

## Sidebar (Desktop)

Fixed position, full viewport height. Three sections separated by `--border`:

1. **Cash in hand** — large hero number, "tap to update" hint. Manual balance entry (same as current app).

2. **Projections**:
   - "After unpaid bills" = cash in hand − sum of unpaid bills for current month
   - "Year-end projection" = computed from all months' projected income − projected expenses

3. **Year overview table** — 12 rows (Mon | In | Out | Net). Current month highlighted with accent. Future months dimmed. Footer row with totals.

## Mobile Layout

1. **Hero balance** — same as sidebar balance section
2. **Two projection cards** — "After bills" and "Year-end" side by side
3. **Timeline** — same collapsible months as desktop
4. **Year overview** — collapsible section at bottom with same table

## Interactions

| Element | Action | Result |
|---------|--------|--------|
| Balance number | Tap | Inline edit, type new amount, enter/blur saves |
| Fixed/one-off bill | Tap checkbox | Mark paid, row strikes through + dims |
| Recurring debt | Tap checkbox | Inline input with min pre-filled, edit amount, enter confirms. Remaining balance updates |
| Income | Tap checkbox | Mark received. USD income triggers exchange rate flow (existing) |
| Budget | Tap row | Inline amount input, enter logs expense, bar updates |
| Month header | Tap | Toggle expand/collapse |
| Past months header | Tap | Toggle expand/collapse |
| Add items | Per-category + button | Inline form: name, amount, due day (bills) or cap (budget) |

## Item Management

- **Fixed, recurring, one-off bills** — add, edit, delete inline from timeline
- **Budgets** — add, edit, delete inline from timeline
- **Income sources** — managed in Settings (currency conversion logic requires dedicated UI)

## Computed Values

- **After unpaid bills** = `months.current_balance` − Σ(unpaid bills in current month)
- **Month net** = Σ(month income) − Σ(month fixed + recurring payments + one-off + budget caps)
- **Year-end projection** = current balance + Σ(remaining months' projected net)
- **Budget remaining** = `budgets.cap_amount` − Σ(`budget_expenses.amount` for current month)
- **Debt progress** = (`total_amount` − `remaining_balance`) / `total_amount`

## Migration Strategy

The existing `bill_templates` and `monthly_bills` tables are preserved. Changes are additive:

1. Add `category` column to `bill_templates` (default `'fixed'` for existing rows)
2. Create `recurring_debts`, `budgets`, `budget_expenses` tables
3. Remove `budget_limit` from `months` table
4. Existing bills, income, and balance data carries over without migration of values
5. Existing `recurrence_type` on `bill_templates` is kept — `category` is an additional classification

## What This Replaces

- `MonthBarrel` component (vertical/horizontal month navigation) → collapsible month sections
- `BudgetProgressBar` (single budget limit per month) → per-category budget rows with bars
- `FinancePage` month-switching UI → single scrollable timeline
- `YearOverviewPage` / year overview graph → sidebar year table (desktop) / collapsible table (mobile)

## Out of Scope

- Investment tracking (SOL etc.) — deferred to future version, treated as one-off expense for now
- Transaction-level tracking within budgets — just a quick-log amount, no categories or receipts
- Multi-currency balance — balance stays in PHP, income conversion handled at receive time
