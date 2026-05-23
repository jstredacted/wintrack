# Finance Redesign — Continuous Ledger Timeline

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the month-based finance page with a continuous ledger timeline featuring four expense categories (fixed, recurring, one-off, budgets), a fixed sidebar with year overview, and `#7CF5A5` as the single accent color.

**Architecture:** Additive database migration (new tables + column), rewrite FinancePage as a two-panel layout (fixed sidebar + scrollable timeline), introduce new hooks for budgets and recurring debts, remove MonthBarrel navigation and YearOverviewPage (merged into sidebar). Existing hooks (useFinance, useBills) are adapted, not rewritten.

**Tech Stack:** React 19, Tailwind v4, shadcn/ui (Nova preset), Supabase (RPC + direct queries), Geist Mono font, motion/react for animations.

**Spec:** `docs/superpowers/specs/2026-03-23-finance-redesign-design.md`
**Mockup:** `.superpowers/brainstorm/3613-1774264987/finance-v2.html`

---

## File Structure

### New Files
| Path | Responsibility |
|------|---------------|
| `supabase/migrations/014_finance_redesign.sql` | Add `category` to `bill_templates`, create `recurring_debts`, `budgets`, `budget_expenses` tables, drop `budget_limit` from `months`, new RPCs |
| `src/types/finance.ts` | Add `RecurringDebt`, `Budget`, `BudgetExpense` types, update `BillTemplate` with `category` |
| `src/hooks/useBudgets.ts` | CRUD for budgets + budget_expenses, compute spent/remaining per month |
| `src/hooks/useRecurringDebts.ts` | Fetch recurring debts linked to bill templates, handle flexible payments |
| `src/hooks/useTimelineData.ts` | Orchestrator hook — fetches all months (past, current, future) and assembles timeline data |
| `src/components/finance/FinanceSidebar.tsx` | Fixed sidebar: balance, projections, year table |
| `src/components/finance/TimelineMonth.tsx` | Single collapsible month section with all category groups |
| `src/components/finance/CategoryGroup.tsx` | Renders a labeled group of rows (income, fixed, recurring, one-off, budgets) |
| `src/components/finance/BillRow.tsx` | Single bill row with checkbox, name, due info, amount |
| `src/components/finance/RecurringDebtRow.tsx` | Debt row with checkbox, flexible payment input, progress bar |
| `src/components/finance/BudgetRow.tsx` | Budget row with progress bar, tap-to-log input |
| `src/components/finance/IncomeRow.tsx` | Income row with received checkbox, amount |
| `src/components/finance/TodayMarker.tsx` | Horizontal accent line with date badge |
| `src/components/finance/PastMonthsSection.tsx` | Collapsible "Past months" wrapper |

### Modified Files
| Path | Changes |
|------|---------|
| `src/pages/FinancePage.tsx` | Complete rewrite — two-panel layout with sidebar + timeline |
| `src/hooks/useFinance.ts` | Remove `updateBudgetLimit`, add multi-month fetching |
| `src/hooks/useBills.ts` | Add category awareness, group bills by category |
| `src/hooks/useYearOverview.ts` | Adapt to include budget data in year calculations |
| `src/index.css` | Add `--accent-green` CSS variable `#7CF5A5` and derived values |
| `src/App.tsx` | Remove `/finance/year` route |

### Removed Files
| Path | Reason |
|------|--------|
| `src/pages/YearOverviewPage.tsx` | Merged into sidebar year table |
| `src/components/finance/MonthBarrel.tsx` | Replaced by collapsible month sections |
| `src/components/finance/BudgetProgressBar.tsx` | Replaced by per-budget BudgetRow |
| `src/components/finance/YearGrid.tsx` | Replaced by sidebar year table |
| `src/components/finance/MonthColumn.tsx` | Replaced by sidebar year table |
| `src/components/finance/BalanceSparkline.tsx` | Removed per spec (no graph) |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/014_finance_redesign.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- 1. Add category to bill_templates
ALTER TABLE bill_templates
  ADD COLUMN category text NOT NULL DEFAULT 'fixed'
  CHECK (category IN ('fixed', 'recurring', 'oneoff'));

-- 2. Create recurring_debts table
CREATE TABLE recurring_debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  total_amount numeric NOT NULL CHECK (total_amount > 0),
  remaining_balance numeric NOT NULL CHECK (remaining_balance >= 0),
  minimum_payment numeric NOT NULL DEFAULT 0 CHECK (minimum_payment >= 0),
  bill_template_id uuid REFERENCES bill_templates(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE recurring_debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own" ON recurring_debts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON recurring_debts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON recurring_debts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON recurring_debts FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX recurring_debts_user_idx ON recurring_debts(user_id);

-- 3. Create budgets table
CREATE TABLE budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  cap_amount numeric NOT NULL CHECK (cap_amount > 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own" ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON budgets FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX budgets_user_active_idx ON budgets(user_id, active);

-- 4. Create budget_expenses table
CREATE TABLE budget_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  month text NOT NULL, -- 'YYYY-MM'
  amount numeric NOT NULL CHECK (amount > 0),
  note text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own" ON budget_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON budget_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON budget_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON budget_expenses FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX budget_expenses_budget_month_idx ON budget_expenses(budget_id, month);

-- 5. Drop budget_limit from months (nullable first, then remove default)
ALTER TABLE months ALTER COLUMN budget_limit DROP NOT NULL;
ALTER TABLE months ALTER COLUMN budget_limit DROP DEFAULT;

-- 6. RPC: Apply recurring debt payment
CREATE OR REPLACE FUNCTION apply_debt_payment(
  p_recurring_debt_id uuid,
  p_monthly_bill_id uuid,
  p_amount numeric
)
RETURNS recurring_debts
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_debt recurring_debts;
  v_bill monthly_bills;
  v_month_id uuid;
BEGIN
  -- Get the debt
  SELECT * INTO v_debt FROM recurring_debts WHERE id = p_recurring_debt_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Debt not found'; END IF;

  -- Cap payment at remaining balance
  IF p_amount > v_debt.remaining_balance THEN
    p_amount := v_debt.remaining_balance;
  END IF;

  -- Update remaining balance
  UPDATE recurring_debts
    SET remaining_balance = remaining_balance - p_amount, updated_at = now()
    WHERE id = p_recurring_debt_id
    RETURNING * INTO v_debt;

  -- Mark the monthly bill as paid with the actual amount
  UPDATE monthly_bills
    SET paid = true, paid_at = now(), amount = p_amount, updated_at = now()
    WHERE id = p_monthly_bill_id
    RETURNING month_id INTO v_month_id;

  -- Subtract from month balance
  UPDATE months SET current_balance = current_balance - p_amount, updated_at = now()
    WHERE id = v_month_id;

  RETURN v_debt;
END;
$$;

-- 7. RPC: Log budget expense
CREATE OR REPLACE FUNCTION log_budget_expense(
  p_user_id uuid,
  p_budget_id uuid,
  p_month text,
  p_amount numeric,
  p_note text DEFAULT NULL
)
RETURNS budget_expenses
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_expense budget_expenses;
BEGIN
  INSERT INTO budget_expenses (user_id, budget_id, month, amount, note, date)
    VALUES (p_user_id, p_budget_id, p_month, p_amount, p_note, CURRENT_DATE)
    RETURNING * INTO v_expense;
  RETURN v_expense;
END;
$$;
```

- [ ] **Step 2: Apply migration to local Supabase**

Run: `cd /Users/justin/Repositories/Personal/wintrack && npx supabase db push`
Expected: Migration applied successfully.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/014_finance_redesign.sql
git commit -m "feat(db): add recurring_debts, budgets tables and bill category column"
```

---

## Task 2: Update Types

**Files:**
- Modify: `src/types/finance.ts`

- [ ] **Step 1: Add new types and update BillTemplate**

Add to `src/types/finance.ts`:

```typescript
export type BillCategory = 'fixed' | 'recurring' | 'oneoff';

// Add 'category' field to existing BillTemplate interface
// After the 'active' field, add:
//   category: BillCategory;

export interface RecurringDebt {
  id: string;
  user_id: string;
  name: string;
  total_amount: number;
  remaining_balance: number;
  minimum_payment: number;
  bill_template_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  name: string;
  cap_amount: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetExpense {
  id: string;
  budget_id: string;
  month: string;
  amount: number;
  note: string | null;
  date: string;
  created_at: string;
}

export interface BudgetWithSpend extends Budget {
  spent: number; // sum of budget_expenses for current month
  remaining: number; // cap_amount - spent
}
```

Update `BillTemplate` interface to include `category: BillCategory` field.

- [ ] **Step 2: Commit**

```bash
git add src/types/finance.ts
git commit -m "feat(types): add RecurringDebt, Budget, BudgetExpense types and BillCategory"
```

---

## Task 3: Add Accent Color to CSS

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Add accent-green CSS variables to `.dark` block**

Add inside the `.dark { }` block in `src/index.css`:

```css
--accent-green: #7CF5A5;
--accent-green-dim: rgba(124, 245, 165, 0.08);
--accent-green-border: rgba(124, 245, 165, 0.18);
--accent-green-muted: rgba(124, 245, 165, 0.5);
```

Also add to `:root` (light mode) block — use a slightly darker variant for readability on white:

```css
--accent-green: #16a34a;
--accent-green-dim: rgba(22, 163, 74, 0.08);
--accent-green-border: rgba(22, 163, 74, 0.18);
--accent-green-muted: rgba(22, 163, 74, 0.5);
```

Add to `@theme inline` block:

```css
--color-accent-green: var(--accent-green);
--color-accent-green-dim: var(--accent-green-dim);
--color-accent-green-border: var(--accent-green-border);
--color-accent-green-muted: var(--accent-green-muted);
```

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -m "feat(css): add #7CF5A5 accent-green color system"
```

---

## Task 4: useBudgets Hook

**Files:**
- Create: `src/hooks/useBudgets.ts`

- [ ] **Step 1: Implement the hook**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Budget, BudgetExpense, BudgetWithSpend } from '@/types/finance';

const USER_ID = import.meta.env.VITE_USER_ID;

export function useBudgets(month: string) {
  const [budgets, setBudgets] = useState<BudgetWithSpend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch active budgets
      const { data: budgetRows, error: bErr } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', USER_ID)
        .eq('active', true)
        .order('created_at');
      if (bErr) throw bErr;

      // Fetch expenses for this month
      const { data: expenses, error: eErr } = await supabase
        .from('budget_expenses')
        .select('*')
        .eq('user_id', USER_ID)
        .eq('month', month);
      if (eErr) throw eErr;

      // Compute spent per budget
      const spendMap = new Map<string, number>();
      for (const e of expenses || []) {
        spendMap.set(e.budget_id, (spendMap.get(e.budget_id) || 0) + e.amount);
      }

      const withSpend: BudgetWithSpend[] = (budgetRows || []).map((b: Budget) => {
        const spent = spendMap.get(b.id) || 0;
        return { ...b, spent, remaining: b.cap_amount - spent };
      });

      setBudgets(withSpend);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { fetch(); }, [fetch]);

  const addBudget = useCallback(async (name: string, capAmount: number) => {
    const { data, error } = await supabase
      .from('budgets')
      .insert({ user_id: USER_ID, name, cap_amount: capAmount })
      .select()
      .single();
    if (error) throw error;
    setBudgets(prev => [...prev, { ...data, spent: 0, remaining: capAmount }]);
    return data;
  }, []);

  const logExpense = useCallback(async (budgetId: string, amount: number) => {
    const { error } = await supabase.rpc('log_budget_expense', {
      p_user_id: USER_ID,
      p_budget_id: budgetId,
      p_month: month,
      p_amount: amount,
    });
    if (error) throw error;
    setBudgets(prev => prev.map(b =>
      b.id === budgetId
        ? { ...b, spent: b.spent + amount, remaining: b.remaining - amount }
        : b
    ));
  }, [month]);

  const updateBudget = useCallback(async (id: string, updates: { name?: string; cap_amount?: number }) => {
    const { error } = await supabase.from('budgets').update(updates).eq('id', id);
    if (error) throw error;
    setBudgets(prev => prev.map(b => {
      if (b.id !== id) return b;
      const updated = { ...b, ...updates };
      if (updates.cap_amount != null) updated.remaining = updates.cap_amount - b.spent;
      return updated;
    }));
  }, []);

  const removeBudget = useCallback(async (id: string) => {
    const { error } = await supabase.from('budgets').update({ active: false }).eq('id', id);
    if (error) throw error;
    setBudgets(prev => prev.filter(b => b.id !== id));
  }, []);

  return { budgets, loading, error, addBudget, logExpense, updateBudget, removeBudget, refetch: fetch };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useBudgets.ts
git commit -m "feat(hooks): add useBudgets hook with expense logging"
```

---

## Task 5: useRecurringDebts Hook

**Files:**
- Create: `src/hooks/useRecurringDebts.ts`

- [ ] **Step 1: Implement the hook**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RecurringDebt } from '@/types/finance';

const USER_ID = import.meta.env.VITE_USER_ID;

export function useRecurringDebts() {
  const [debts, setDebts] = useState<RecurringDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('recurring_debts')
        .select('*')
        .eq('user_id', USER_ID)
        .order('created_at');
      if (err) throw err;
      setDebts(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addDebt = useCallback(async (debt: {
    name: string;
    total_amount: number;
    remaining_balance: number;
    minimum_payment: number;
    bill_template_id?: string;
  }) => {
    const { data, error } = await supabase
      .from('recurring_debts')
      .insert({ user_id: USER_ID, ...debt })
      .select()
      .single();
    if (error) throw error;
    setDebts(prev => [...prev, data]);
    return data;
  }, []);

  const payDebt = useCallback(async (debtId: string, monthlyBillId: string, amount: number) => {
    const { data, error } = await supabase.rpc('apply_debt_payment', {
      p_recurring_debt_id: debtId,
      p_monthly_bill_id: monthlyBillId,
      p_amount: amount,
    });
    if (error) throw error;
    setDebts(prev => prev.map(d => d.id === debtId ? data : d));
    return data;
  }, []);

  const updateDebt = useCallback(async (id: string, updates: Partial<Pick<RecurringDebt, 'name' | 'minimum_payment' | 'remaining_balance'>>) => {
    const { error } = await supabase.from('recurring_debts').update(updates).eq('id', id);
    if (error) throw error;
    setDebts(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }, []);

  return { debts, loading, error, addDebt, payDebt, updateDebt, refetch: fetch };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useRecurringDebts.ts
git commit -m "feat(hooks): add useRecurringDebts hook with flexible payments"
```

---

## Task 6: useTimelineData Orchestrator Hook

**Files:**
- Create: `src/hooks/useTimelineData.ts`

- [ ] **Step 1: Implement the orchestrator hook**

This hook assembles the full timeline by calling existing hooks and grouping months into past/current/future:

```typescript
import { useMemo } from 'react';
import { getCurrentMonth, getPrevMonth, getNextMonth, getMonthYear } from '@/lib/utils/month';
import type { MonthlyBill, BillCategory, BudgetWithSpend, RecurringDebt } from '@/types/finance';

export interface TimelineMonth {
  month: string; // 'YYYY-MM'
  label: string; // 'March 2026'
  isCurrent: boolean;
  isPast: boolean;
  isFuture: boolean;
  // Data populated by parent component from individual hooks
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function useTimelineMonths(year: number) {
  const currentMonth = getCurrentMonth();

  const months = useMemo(() => {
    const result: TimelineMonth[] = [];
    for (let m = 1; m <= 12; m++) {
      const monthStr = `${year}-${String(m).padStart(2, '0')}`;
      const isCurrent = monthStr === currentMonth;
      const isPast = monthStr < currentMonth;
      const isFuture = monthStr > currentMonth;
      result.push({
        month: monthStr,
        label: `${MONTH_NAMES[m - 1]} ${year}`,
        isCurrent,
        isPast,
        isFuture,
      });
    }
    return result;
  }, [year, currentMonth]);

  const pastMonths = useMemo(() => months.filter(m => m.isPast), [months]);
  const currentMonthData = useMemo(() => months.find(m => m.isCurrent), [months]);
  const futureMonths = useMemo(() => months.filter(m => m.isFuture), [months]);

  return { months, pastMonths, currentMonth: currentMonthData, futureMonths };
}

// Helper to group bills by category
export function groupBillsByCategory(bills: MonthlyBill[]) {
  const fixed: MonthlyBill[] = [];
  const recurring: MonthlyBill[] = [];
  const oneoff: MonthlyBill[] = [];

  for (const bill of bills) {
    // bill_templates join gives us the category
    const cat = (bill as any).bill_templates?.category || 'fixed';
    if (cat === 'recurring') recurring.push(bill);
    else if (cat === 'oneoff') oneoff.push(bill);
    else fixed.push(bill);
  }

  return { fixed, recurring, oneoff };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useTimelineData.ts
git commit -m "feat(hooks): add useTimelineMonths orchestrator and bill grouping"
```

---

## Task 7: Atomic UI Components

**Files:**
- Create: `src/components/finance/TodayMarker.tsx`
- Create: `src/components/finance/BillRow.tsx`
- Create: `src/components/finance/RecurringDebtRow.tsx`
- Create: `src/components/finance/BudgetRow.tsx`
- Create: `src/components/finance/IncomeRow.tsx`

- [ ] **Step 1: TodayMarker**

```tsx
const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

export default function TodayMarker() {
  const now = new Date();
  const label = `today · ${MONTHS[now.getMonth()]} ${now.getDate()}`;
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 my-1">
      <div className="flex-1 h-px bg-[var(--accent-green)] opacity-20" />
      <span className="font-mono text-[0.5rem] text-[var(--accent-green)] uppercase tracking-widest px-2 py-0.5 bg-[var(--accent-green-dim)] rounded-sm">
        {label}
      </span>
      <div className="flex-1 h-px bg-[var(--accent-green)] opacity-20" />
    </div>
  );
}
```

- [ ] **Step 2: BillRow**

```tsx
interface BillRowProps {
  name: string;
  amount: number;
  dueDay: number;
  paid: boolean;
  paidAt?: string | null;
  readOnly?: boolean;
  dueSub?: string; // e.g. "due 25th · 2 days"
  onTogglePaid: () => void;
  onEdit?: () => void;
}

export default function BillRow({ name, amount, dueDay, paid, dueSub, readOnly, onTogglePaid, onEdit }: BillRowProps) {
  return (
    <div
      className="flex items-center px-3 py-2 rounded-sm cursor-pointer hover:bg-card transition-colors"
      onClick={readOnly ? undefined : onTogglePaid}
    >
      <div className={[
        'w-4 h-4 rounded-full border-[1.5px] mr-3 flex-shrink-0 flex items-center justify-center',
        paid ? 'border-[var(--accent-green)] bg-[var(--accent-green-dim)]' : 'border-input',
      ].join(' ')}>
        {paid && <span className="text-[0.55rem] text-[var(--accent-green)] font-semibold">✓</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className={['text-sm', paid ? 'line-through text-muted-foreground/50' : ''].join(' ')}>{name}</div>
        {dueSub && <div className="font-mono text-[0.55rem] text-muted-foreground/50 mt-px">{dueSub}</div>}
      </div>
      <div className={['font-mono text-[0.7rem] font-medium ml-3', paid ? 'text-muted-foreground/50' : ''].join(' ')}>
        ₱{amount.toLocaleString()}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: RecurringDebtRow**

```tsx
import { useState } from 'react';

interface RecurringDebtRowProps {
  name: string;
  amount: number; // current payment amount
  minimumPayment: number;
  totalAmount: number;
  remainingBalance: number;
  paid: boolean;
  dueSub?: string;
  readOnly?: boolean;
  onPay: (amount: number) => void;
}

export default function RecurringDebtRow({
  name, amount, minimumPayment, totalAmount, remainingBalance, paid, dueSub, readOnly, onPay,
}: RecurringDebtRowProps) {
  const [inputOpen, setInputOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(String(minimumPayment));
  const progress = ((totalAmount - remainingBalance) / totalAmount) * 100;

  const handleToggle = () => {
    if (readOnly || paid) return;
    setInputOpen(true);
    setPayAmount(String(minimumPayment));
  };

  const handleSubmit = () => {
    const num = parseFloat(payAmount);
    if (!num || num <= 0) return;
    onPay(Math.min(num, remainingBalance));
    setInputOpen(false);
  };

  return (
    <div className="px-3 py-2 rounded-sm hover:bg-card transition-colors">
      <div className="flex items-center cursor-pointer" onClick={handleToggle}>
        <div className={[
          'w-4 h-4 rounded-full border-[1.5px] mr-3 flex-shrink-0 flex items-center justify-center',
          paid ? 'border-[var(--accent-green)] bg-[var(--accent-green-dim)]' : 'border-input',
        ].join(' ')}>
          {paid && <span className="text-[0.55rem] text-[var(--accent-green)] font-semibold">✓</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className={['text-sm', paid ? 'line-through text-muted-foreground/50' : ''].join(' ')}>{name}</div>
          <div className="font-mono text-[0.55rem] text-muted-foreground/50 mt-px">
            {dueSub}{dueSub ? ' · ' : ''}min ₱{minimumPayment.toLocaleString()}
          </div>
          <div className="h-0.5 bg-muted rounded-sm mt-1 overflow-hidden">
            <div className="h-full bg-foreground/30 rounded-sm" style={{ width: `${progress}%` }} />
          </div>
          <div className="font-mono text-[0.5rem] text-muted-foreground mt-px">
            ₱{remainingBalance.toLocaleString()} remaining of ₱{totalAmount.toLocaleString()}
          </div>
        </div>
        <div className={['font-mono text-[0.7rem] font-medium ml-3', paid ? 'text-muted-foreground/50' : ''].join(' ')}>
          ₱{amount.toLocaleString()}
        </div>
      </div>
      {inputOpen && (
        <div className="ml-7 mt-2 flex items-center gap-2">
          <input
            autoFocus
            type="number"
            value={payAmount}
            onChange={e => setPayAmount(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            onBlur={handleSubmit}
            className="font-mono text-sm bg-card border border-input rounded-sm px-2 py-1 w-32 outline-none focus:ring-1 focus:ring-[var(--accent-green)]"
          />
          <span className="text-[0.55rem] text-muted-foreground">enter to pay</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: BudgetRow**

```tsx
import { useState } from 'react';

interface BudgetRowProps {
  name: string;
  capAmount: number;
  spent: number;
  remaining: number;
  readOnly?: boolean;
  onLogExpense: (amount: number) => void;
}

export default function BudgetRow({ name, capAmount, spent, remaining, readOnly, onLogExpense }: BudgetRowProps) {
  const [inputOpen, setInputOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const progress = capAmount > 0 ? Math.min((spent / capAmount) * 100, 100) : 0;

  const handleSubmit = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return;
    onLogExpense(num);
    setAmount('');
    setInputOpen(false);
  };

  return (
    <div
      className="px-3 py-2 rounded-sm hover:bg-card transition-colors cursor-pointer"
      onClick={() => !readOnly && !inputOpen && setInputOpen(true)}
    >
      <div className="flex items-center">
        <div className="w-4 h-4 rounded-full border-[1.5px] border-[var(--accent-green-border)] bg-[var(--accent-green-dim)] mr-3 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm">{name}</div>
          <div className="mt-1">
            <div className="h-0.5 bg-muted rounded-sm overflow-hidden">
              <div className="h-full bg-[var(--accent-green)] opacity-40 rounded-sm" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between mt-px">
              <span className="font-mono text-[0.5rem] text-muted-foreground/50">₱{spent.toLocaleString()} spent</span>
              <span className="font-mono text-[0.5rem] text-muted-foreground/50">₱{capAmount.toLocaleString()} cap</span>
            </div>
          </div>
        </div>
        <div className="font-mono text-[0.7rem] font-medium ml-3 text-[var(--accent-green)]">
          ₱{remaining.toLocaleString()} left
        </div>
      </div>
      {inputOpen && (
        <div className="ml-7 mt-2 flex items-center gap-2">
          <input
            autoFocus
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') setInputOpen(false); }}
            onBlur={() => { if (amount) handleSubmit(); else setInputOpen(false); }}
            placeholder="amount"
            className="font-mono text-sm bg-card border border-input rounded-sm px-2 py-1 w-32 outline-none focus:ring-1 focus:ring-[var(--accent-green)]"
          />
          <span className="text-[0.55rem] text-muted-foreground">enter to log</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: IncomeRow**

```tsx
interface IncomeRowProps {
  name: string;
  amount: number;
  received: boolean;
  sub?: string; // e.g. "received mar 15" or "expected mar 30"
  dimmed?: boolean;
  readOnly?: boolean;
  onToggle: () => void;
}

export default function IncomeRow({ name, amount, received, sub, dimmed, readOnly, onToggle }: IncomeRowProps) {
  return (
    <div
      className={[
        'flex items-center px-3 py-2 rounded-sm transition-colors',
        dimmed ? 'opacity-35' : '',
        'bg-[var(--accent-green-dim)] border border-[var(--accent-green-border)]',
        dimmed ? 'border-transparent' : '',
        readOnly ? '' : 'cursor-pointer hover:bg-[rgba(124,245,165,0.12)]',
      ].join(' ')}
      onClick={readOnly ? undefined : onToggle}
    >
      <div className={[
        'w-4 h-4 rounded-full border-[1.5px] mr-3 flex-shrink-0 flex items-center justify-center',
        received ? 'border-[var(--accent-green)] bg-[var(--accent-green-dim)]' : 'border-input',
      ].join(' ')}>
        {received && <span className="text-[0.55rem] text-[var(--accent-green)] font-semibold">✓</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[var(--accent-green)] font-medium">{name}</div>
        {sub && <div className="font-mono text-[0.55rem] text-muted-foreground/50 mt-px">{sub}</div>}
      </div>
      <div className="font-mono text-[0.7rem] font-medium ml-3 text-[var(--accent-green)]">
        +₱{amount.toLocaleString()}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/finance/TodayMarker.tsx src/components/finance/BillRow.tsx src/components/finance/RecurringDebtRow.tsx src/components/finance/BudgetRow.tsx src/components/finance/IncomeRow.tsx
git commit -m "feat(ui): add atomic row components for timeline categories"
```

---

## Task 8: CategoryGroup + TimelineMonth + PastMonthsSection

**Files:**
- Create: `src/components/finance/CategoryGroup.tsx`
- Create: `src/components/finance/TimelineMonth.tsx`
- Create: `src/components/finance/PastMonthsSection.tsx`

- [ ] **Step 1: CategoryGroup** — labeled wrapper for a set of rows

```tsx
interface CategoryGroupProps {
  label: string;
  children: React.ReactNode;
}

export default function CategoryGroup({ label, children }: CategoryGroupProps) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="px-3 mb-0.5">
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground/50 font-medium">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: TimelineMonth** — collapsible month section with header

```tsx
import { useState } from 'react';

interface TimelineMonthProps {
  month: string;
  label: string; // "March 2026"
  net: number;
  isCurrent: boolean;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export default function TimelineMonth({ label, net, isCurrent, defaultExpanded = false, children }: TimelineMonthProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-2">
      <button
        className="w-full flex items-center justify-between py-3 border-b border-border font-mono"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5">
          <span className={[
            'text-[0.7rem] font-semibold uppercase tracking-wider',
            isCurrent ? 'text-[var(--accent-green)]' : 'text-muted-foreground',
          ].join(' ')}>
            {label}
          </span>
          <span className={[
            'text-[0.6rem] font-medium px-2 py-0.5 rounded-sm',
            net >= 0
              ? 'text-[var(--accent-green)] bg-[var(--accent-green-dim)]'
              : 'text-destructive bg-destructive/10',
          ].join(' ')}>
            {net >= 0 ? '+' : ''}₱{Math.abs(net).toLocaleString()}
          </span>
        </div>
        <span className={[
          'text-[0.55rem] text-muted-foreground/50 transition-transform',
          expanded ? 'rotate-180' : '',
        ].join(' ')}>▼</span>
      </button>
      {expanded && (
        <div className="py-3">
          {children}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: PastMonthsSection**

```tsx
import { useState } from 'react';

interface PastMonth {
  month: string;
  label: string;
  net: number;
}

interface PastMonthsSectionProps {
  months: PastMonth[];
  onExpandMonth?: (month: string) => void;
}

export default function PastMonthsSection({ months, onExpandMonth }: PastMonthsSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (months.length === 0) return null;

  return (
    <div className="mb-2">
      <button
        className="w-full flex items-center justify-between py-3 border-b border-border font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground"
        onClick={() => setExpanded(!expanded)}
      >
        <span>Past months</span>
        <span className={[
          'text-[0.55rem] text-muted-foreground/50 transition-transform',
          expanded ? 'rotate-180' : '',
        ].join(' ')}>▼</span>
      </button>
      {expanded && (
        <div className="py-2">
          {months.map(m => (
            <div
              key={m.month}
              className="flex justify-between px-3 py-1.5 rounded-sm cursor-pointer text-muted-foreground hover:bg-card text-[0.7rem]"
              onClick={() => onExpandMonth?.(m.month)}
            >
              <span>{m.label}</span>
              <span className="font-mono text-[var(--accent-green-muted)]">
                {m.net >= 0 ? '+' : ''}₱{Math.abs(m.net).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/finance/CategoryGroup.tsx src/components/finance/TimelineMonth.tsx src/components/finance/PastMonthsSection.tsx
git commit -m "feat(ui): add CategoryGroup, TimelineMonth, and PastMonthsSection"
```

---

## Task 9: FinanceSidebar

**Files:**
- Create: `src/components/finance/FinanceSidebar.tsx`

- [ ] **Step 1: Implement sidebar with balance + projections + year table**

```tsx
interface YearRow {
  month: string; // 'Jan', 'Feb', etc.
  income: number;
  expenses: number;
  net: number;
  isCurrent: boolean;
  isFuture: boolean;
}

interface FinanceSidebarProps {
  balance: number;
  afterBills: number;
  yearEndProjection: number;
  yearRows: YearRow[];
  yearTotals: { income: number; expenses: number; net: number };
  year: number;
  onUpdateBalance: (newBalance: number) => void;
}

export default function FinanceSidebar({
  balance, afterBills, yearEndProjection, yearRows, yearTotals, year, onUpdateBalance,
}: FinanceSidebarProps) {
  // ... implementation with:
  // - Balance hero (click to edit inline)
  // - After bills + year-end projection stat rows
  // - Year overview table with 12 rows
  // Uses var(--accent-green) for all accent coloring
  // Follows the mockup layout exactly
}
```

Build this component following the exact CSS structure from the mockup at `.superpowers/brainstorm/3613-1774264987/finance-v2.html`, translating the raw CSS to Tailwind classes. Key patterns:

- Balance: `font-mono text-[2rem] font-light`
- Stat values: `font-mono text-[0.7rem] font-medium text-[var(--accent-green)]`
- Year table: `<table>` with `font-mono text-[0.65rem]` cells
- Current month row: `text-foreground font-medium`, first cell `text-[var(--accent-green)]`
- Future rows: `opacity-35`
- Sections separated by `border-b border-border`

- [ ] **Step 2: Commit**

```bash
git add src/components/finance/FinanceSidebar.tsx
git commit -m "feat(ui): add FinanceSidebar with balance, projections, and year table"
```

---

## Task 10: Rewrite FinancePage

**Files:**
- Modify: `src/pages/FinancePage.tsx` (complete rewrite)

- [ ] **Step 1: Implement the new two-panel layout**

The new FinancePage orchestrates all hooks and renders the layout:

```tsx
// Core structure:
// Desktop: fixed sidebar (300px) + scrollable main
// Mobile: hero balance → timeline → year overview

export default function FinancePage() {
  const year = new Date().getFullYear();
  const { months, pastMonths, currentMonth, futureMonths } = useTimelineMonths(year);
  const currentMonthStr = getCurrentMonth();

  // Existing hooks for current month data
  const { monthData, incomes, updateBalance, toggleIncomeReceived, refetch } = useFinance(currentMonthStr);
  const { bills, togglePaid } = useBills(monthData?.id ?? null);
  const { rate, fetchFreshRate } = useExchangeRate();
  const { entries: oneOffEntries } = useOneOffIncome(monthData?.id ?? null);

  // New hooks
  const { budgets, logExpense } = useBudgets(currentMonthStr);
  const { debts, payDebt } = useRecurringDebts();
  const { months: yearData } = useYearOverview(year);

  // Group bills by category
  const { fixed, recurring, oneoff } = groupBillsByCategory(bills);

  // Compute projections
  const unpaidTotal = bills.filter(b => !b.paid).reduce((s, b) => s + b.amount, 0);
  const afterBills = (monthData?.current_balance ?? 0) - unpaidTotal;

  return (
    <div className="max-w-[1100px] mx-auto relative min-h-svh">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed top-0 w-[300px] h-svh overflow-y-auto border-r border-border p-8 flex-col">
        <FinanceSidebar ... />
      </aside>

      {/* Main timeline */}
      <div className="md:ml-[300px] p-5 md:p-8">
        {/* Mobile hero (hidden on desktop) */}
        <div className="md:hidden ...">
          {/* Balance + projection cards */}
        </div>

        {/* Past months */}
        <PastMonthsSection months={...} />

        {/* Current month (expanded) */}
        <TimelineMonth label={...} net={...} isCurrent defaultExpanded>
          <CategoryGroup label="Income">
            {incomes.map(inc => <IncomeRow ... />)}
          </CategoryGroup>
          <CategoryGroup label="Fixed monthly">
            {fixed.map(bill => <BillRow ... />)}
          </CategoryGroup>
          <TodayMarker />
          <CategoryGroup label="Recurring">
            {recurring.map(bill => <RecurringDebtRow ... />)}
          </CategoryGroup>
          <CategoryGroup label="One-off">
            {oneoff.map(bill => <BillRow ... />)}
          </CategoryGroup>
          <CategoryGroup label="Budgets">
            {budgets.map(b => <BudgetRow ... />)}
          </CategoryGroup>
        </TimelineMonth>

        {/* Future months (collapsed) */}
        {futureMonths.map(m => (
          <TimelineMonth key={m.month} ... defaultExpanded={false}>
            {/* Projected items at 35% opacity */}
          </TimelineMonth>
        ))}

        {/* Mobile year overview */}
        <div className="md:hidden ...">
          {/* Collapsible year table */}
        </div>
      </div>
    </div>
  );
}
```

This is the most complex task. The implementer should:
1. Translate the mockup HTML/CSS to Tailwind + React components
2. Wire up all hooks (existing + new)
3. Handle the mobile vs desktop responsive split (`md:` breakpoint = 768px, but use `min-width: 900px` via custom breakpoint or inline style to match the mockup)
4. Use `var(--accent-green)` for all accent coloring throughout

- [ ] **Step 2: Run the dev server and verify visually**

Run: `mise exec -- bun run dev`
Open in browser and compare against mockup side-by-side.

- [ ] **Step 3: Commit**

```bash
git add src/pages/FinancePage.tsx
git commit -m "feat(finance): rewrite FinancePage as continuous ledger timeline"
```

---

## Task 11: Update useBills to Join Category

**Files:**
- Modify: `src/hooks/useBills.ts`

- [ ] **Step 1: Update the Supabase query to include category from bill_templates**

In the `fetch` function, change the `.select()` call to join the `bill_templates` table and include the `category` field:

```typescript
// Change from:
.select('*, bill_templates!inner(recurrence_type, start_month, recurrence_count, recurrence_end)')
// To:
.select('*, bill_templates!inner(recurrence_type, start_month, recurrence_count, recurrence_end, category)')
```

- [ ] **Step 2: Update addBill to accept category**

When inserting a new `bill_template`, include the `category` field. Default to `'fixed'` if not provided.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useBills.ts
git commit -m "feat(hooks): add category field to useBills join query"
```

---

## Task 12: Cleanup — Remove Old Components and Routes

**Files:**
- Delete: `src/pages/YearOverviewPage.tsx`
- Delete: `src/components/finance/MonthBarrel.tsx`
- Delete: `src/components/finance/BudgetProgressBar.tsx`
- Delete: `src/components/finance/YearGrid.tsx`
- Delete: `src/components/finance/MonthColumn.tsx`
- Delete: `src/components/finance/BalanceSparkline.tsx`
- Modify: `src/App.tsx` — remove `/finance/year` route

- [ ] **Step 1: Remove the `/finance/year` route from App.tsx**

Remove the line:
```tsx
<Route path="finance/year" element={<YearOverviewPage />} />
```
And the import for `YearOverviewPage`.

- [ ] **Step 2: Delete old component files**

```bash
rm src/pages/YearOverviewPage.tsx
rm src/components/finance/MonthBarrel.tsx
rm src/components/finance/BudgetProgressBar.tsx
rm src/components/finance/YearGrid.tsx
rm src/components/finance/MonthColumn.tsx
rm src/components/finance/BalanceSparkline.tsx
```

- [ ] **Step 3: Remove the year overview FAB from FinancePage if any remnants exist**

Check FinancePage for any remaining references to `BarChart3` icon, `navigate('/finance/year')`, or `YearOverviewPage`. Remove them.

- [ ] **Step 4: Verify no broken imports**

Run: `mise exec -- bun run build`
Expected: Build succeeds with no import errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove old month-based finance components and year overview route"
```

---

## Task 13: Verify and Polish

- [ ] **Step 1: Run dev server and test all interactions**

Run: `mise exec -- bun run dev`

Test checklist:
- [ ] Balance tap-to-edit works
- [ ] Fixed bill checkbox marks paid (strikes through)
- [ ] Recurring debt checkbox opens payment input
- [ ] Budget tap opens expense input
- [ ] Income row toggles received
- [ ] Month sections expand/collapse
- [ ] Past months section collapses
- [ ] Year table shows correct current month highlight
- [ ] Desktop sidebar is fixed on scroll
- [ ] Mobile layout shows hero + cards
- [ ] Accent color `#7CF5A5` is consistent everywhere

- [ ] **Step 2: Run existing tests**

Run: `mise exec -- bun run test`
Fix any test failures from changed interfaces.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(finance): complete ledger timeline redesign with accent #7CF5A5"
```
