# Pitfalls Research

**Domain:** Adding continuous finance timeline, budget/debt tracking, fixed sidebar, and accent color to existing React + Supabase + Tailwind v4 app (wintrack v2.1)
**Researched:** 2026-03-23
**Confidence:** HIGH (based on direct codebase analysis of existing migrations, hooks, and layout structure)

---

## Critical Pitfalls

### Pitfall 1: Continuous Timeline Triggers `ensure_month_exists` for Every Visible Month Simultaneously

**What goes wrong:**
The current `useFinance(selectedMonth)` hook calls `ensure_month_exists` on mount. With a continuous ledger that renders 12+ months at once, each visible `MonthSection` component calling `useFinance` independently fires 12 simultaneous `ensure_month_exists` RPCs. These RPCs each run a `SELECT → INSERT (if missing)` sequence. When 3-4 months are missing (e.g., first load), the concurrent inserts race against each other and the `ON CONFLICT DO NOTHING` fallback. The RPC handles this (`IF NOT FOUND THEN SELECT` after race), but 12 concurrent RPC calls still saturate the Supabase connection pool and cause visible UI lag on first load.

**Why it happens:**
The month-by-month design assumed one active month at a time. The module-level `monthCache` in `useFinance.ts` prevents re-fetching cached months but not the initial 12-way fan-out on first visit.

**How to avoid:**
1. Do not call `useFinance` per month section. Instead, fetch all needed months in a single batch query at the page level using a new `useLedgerTimeline(months: string[])` hook.
2. Separate "ensure months exist" from "fetch month data." Create a single `initialize_ledger_range(p_user_id, p_start_month, p_end_month)` RPC that inserts missing months in a loop with `ON CONFLICT DO NOTHING`, then returns all rows in one query.
3. Call `populate_monthly_bills` and `populate_monthly_income` lazily — only for the current month, not retroactively for collapsed past months.
4. Keep the `monthCache` Map but key it as a batch cache: if the range `[2025-04..2026-03]` is cached, return the whole array.

**Warning signs:**
DevTools Network tab shows 10-15 simultaneous `/rest/v1/rpc/ensure_month_exists` calls on finance page load. Loading spinner visible for > 500ms on first visit.

**Phase to address:**
Ledger Timeline phase — must be the first finance architecture decision before any UI work begins.

---

### Pitfall 2: `starting_balance` Chain Breaks When Past Month Data Changes

**What goes wrong:**
`ensure_month_exists` carries forward `current_balance` from the previous month as the new month's `starting_balance`. This happens once at month creation. If a past month's `current_balance` is later corrected (via `apply_balance_override`), the chain of `starting_balance` values for all subsequent months is now stale. Month 3's starting balance is wrong. Month 4's is also wrong. The ledger shows incorrect projections.

**Why it happens:**
`starting_balance` is a snapshot written once at month creation. The `apply_balance_override` RPC correctly updates `current_balance` on the target month but does not cascade forward to update `starting_balance` on the next month. The code in `009_finance_rpcs.sql` lines 36-38 confirms this: insert sets `starting_balance = prev_balance` only at creation time.

**How to avoid:**
1. When `apply_balance_override` is called on a past month, also update `starting_balance` on the immediately following month (not recursively — just one month forward, since `starting_balance` = "what I started this month with", and the user can correct each month independently).
2. Alternatively, treat `starting_balance` as always derived: never store it, always compute it as `previous_month.current_balance` at display time. This is the safer approach for a continuous ledger where users may edit past months.
3. Display a visual "chain broken" indicator when `month[n].starting_balance !== month[n-1].current_balance` to alert the user without silently showing wrong data.

**Warning signs:**
After editing a past month's balance, the next month's "Starting Balance" shown in the sidebar does not update. Year Overview table shows inconsistent balance chain.

**Phase to address:**
Ledger Timeline phase — the balance chain integrity rule must be designed into the data model before the UI is built.

---

### Pitfall 3: Module-Level `monthCache` Serves Stale Data After Writes

**What goes wrong:**
`useFinance.ts` uses a module-level `Map` (`monthCache`) to avoid re-fetching on month switches. This is correct for reads. But in the new continuous ledger, multiple month sections are mounted simultaneously and any write (paying a bill, logging an expense) to month N invalidates the cache for month N. The current code calls `monthCache.delete(selectedMonth)` after writes — but with 12 months mounted, a bill payment in March only deletes `monthCache.get('2026-03')`. If the sidebar is computing a balance projection using March's data via the same cache key, it shows the old balance until the next full refetch.

**Why it happens:**
The cache delete is scoped to `selectedMonth`. In the new design, there is no "selected month" — all months are visible. Multiple consumers share the same cache key but only one triggers invalidation.

**How to avoid:**
1. Replace module-level `monthCache` with a Zustand store (`financeStore`) that holds all loaded months keyed by `YYYY-MM`. Writes dispatch a `setMonth(key, data)` action that any subscriber re-renders from.
2. After any write RPC (`apply_bill_paid`, `apply_balance_override`, `apply_oneoff_income`), update the Zustand store entry for that month immediately (optimistic) and trigger a background refetch of just that month.
3. The sidebar projection reads from the Zustand store, so it automatically reflects the post-write state.

**Warning signs:**
After marking a bill paid, the sidebar balance projection does not update until page refresh. Balance shown in Month section differs from balance shown in sidebar for the same month.

**Phase to address:**
Ledger Timeline phase — must replace the module-level cache with a proper store before building the multi-month layout.

---

### Pitfall 4: Recurring Debt `remaining_balance` Gets Out of Sync With Actual Payments

**What goes wrong:**
The v2.1 spec adds recurring debts with `remaining_balance`. This is a derived value: `original_amount - sum(all_payments_made)`. If it is stored as a column on the debt record and updated by each payment RPC, it can drift: a failed update, a reverted payment, or a direct database edit leaves `remaining_balance` inconsistent with the actual payment history. A debt shows "₱12,000 remaining" when the payment history sum says "₱10,000 remaining."

**Why it happens:**
Mutable derived state. The temptation to store `remaining_balance` as a column for fast reads leads to dual-source-of-truth: the stored value and the computed value from payment rows. Any update path that is not atomic corrupts the stored value.

**How to avoid:**
1. Store `remaining_balance` as a column for read performance but treat it as a **cache of the computed value**, not the source of truth.
2. Every payment RPC must be atomic: `UPDATE debts SET remaining_balance = remaining_balance - payment_amount WHERE id = ...` in the same transaction as inserting the payment row. Never update these separately.
3. Add a `recalculate_debt_balance(debt_id)` RPC that recomputes `remaining_balance = original_amount - SUM(payments)` from scratch. Call it as a reconciliation step after any payment edit or delete.
4. Consider NOT storing `remaining_balance` at all and always computing it: `original_amount - (SELECT COALESCE(SUM(amount), 0) FROM debt_payments WHERE debt_id = ...)`. For a personal app with one user and < 100 debts, this query is fast enough.

**Warning signs:**
`remaining_balance` displayed does not match `original_amount - sum(payments)` when computed manually. After reverting a payment, remaining balance does not increase.

**Phase to address:**
Recurring Debts phase — the schema design must decide stored-vs-computed before writing the first RPC.

---

### Pitfall 5: Fixed Sidebar Conflicts With `overflow-y-auto` on `<main>` and Breaks iOS Safari

**What goes wrong:**
The current `AppShell` has `<main className="ml-0 sm:ml-14 flex-1 overflow-y-auto">`. A fixed sidebar requires a two-panel layout where the right panel scrolls independently while the sidebar stays pinned. The naive fix — adding a fixed-width sidebar panel inside main — fails because `overflow-y-auto` on the parent clips `position: sticky` children inside it. On iOS Safari, `position: fixed` inside a scrollable container behaves differently than desktop: the fixed element scrolls with the container on some iOS versions.

**Why it happens:**
CSS `position: sticky` requires the sticky element's scroll container to be the element with `overflow: scroll/auto`, and that container must not have `overflow: hidden` on any axis. `overflow-y: auto` on `<main>` creates a new stacking context that breaks `position: fixed` inside it on some browsers.

**How to avoid:**
1. Restructure `AppShell` for the finance page layout: use a CSS Grid two-column layout at the page level, not inside `<main>`. The finance route renders into a full-height two-column grid where the left column is the scrollable ledger and the right column is the sticky sidebar.
2. The sidebar uses `position: sticky; top: 0; height: 100vh; overflow-y: auto` — this works correctly when the sidebar's scroll container is not `<main>` but the grid cell itself.
3. Do NOT use `position: fixed` for the sidebar — use `position: sticky` inside its own grid cell. This avoids the iOS fixed-inside-overflow bug entirely.
4. On mobile (< 640px breakpoint), collapse the sidebar entirely into a card that appears above the ledger. Do not try to make it sticky on mobile.
5. Wrap only the ledger column in `overflow-y-auto`, not the entire main element.

**Warning signs:**
Sidebar jumps or scrolls with the ledger on iOS Safari. Sidebar disappears or clips when scrolling past a certain point. Sticky positioning stops working after a DOM update.

**Phase to address:**
Fixed Sidebar / Layout phase — AppShell restructure must happen before any sidebar content is built, because it affects the scroll container of every child.

---

### Pitfall 6: Budget Expense Logging Creates Race Condition With Balance Calculation

**What goes wrong:**
Budget spending caps require logging individual expense items (e.g., "Groceries ₱850"). If implemented as client-side optimistic updates that immediately recalculate `spent_total` in React state, and simultaneously fire an insert RPC that updates `months.current_balance`, two rapid expense logs can produce incorrect totals. The sequence: (1) User logs ₱850, optimistic state shows ₱850 spent. (2) Before RPC resolves, user logs ₱1200. (3) Optimistic state computes ₱2050 spent using stale `current_balance`. (4) First RPC resolves, updates balance to `original - 850`. (5) Second RPC resolves, updates balance to `(original - 850) - 1200`. Each RPC reads `current_balance` from the DB, not from the in-flight optimistic state — so the DB updates are sequential and correct. But the React display shows a momentarily wrong total.

**Why it happens:**
Optimistic UI state and DB state diverge during concurrent writes. The optimistic calculation uses React state (which includes the first write's effect) but the second RPC was issued before the first RPC resolved, so both use the pre-first-write DB value.

**How to avoid:**
1. For budget expenses, use the Supabase RPC (not a raw INSERT + UPDATE) for atomicity. The RPC does `INSERT INTO budget_expenses ... RETURNING id` + `UPDATE months SET current_balance = current_balance - amount` in one transaction.
2. Disable the "Log Expense" button while an in-flight request is pending. A personal app does not need concurrent expense logging.
3. Refetch the month's `current_balance` after every successful write — do not attempt to maintain balance purely through client-side arithmetic.
4. Show the locally-optimistic total for `spent_total` (fast UX), but fetch the authoritative `current_balance` from DB before displaying the balance sidebar (correctness for money).

**Warning signs:**
Two quick expense logs result in `current_balance` off by one of the expense amounts. Budget spent total differs from what the database shows.

**Phase to address:**
Budget Tracking phase — the expense log RPC must be atomic before the UI component is built.

---

### Pitfall 7: Accent Color `#7CF5A5` Overwrites the Existing `--accent` Token and Breaks shadcn Components

**What goes wrong:**
The existing `index.css` defines `--accent: oklch(0.97 0 0)` (light mode) and `--accent: oklch(0.371 0 0)` (dark mode). These are used by shadcn/ui components for hover states (`bg-accent`), sidebar highlight (`--sidebar-accent`), and the Nova preset's interactive states. Replacing `--accent` with `#7CF5A5` (a bright green) breaks every component that currently uses `bg-accent` for subtle, monochrome hover states — they become bright green on hover, destroying the Nothing design aesthetic.

**Why it happens:**
shadcn/ui's Nova preset wires `--accent` to hover/active states in Button, DropdownMenu, Select, and NavigationMenu components. Developers assign the brand color to `--accent` because it "sounds right" — accents are for emphasis — without auditing all downstream usage.

**How to avoid:**
1. Do NOT replace `--accent` with `#7CF5A5`. Add a new CSS token specifically for the brand highlight: `--brand: oklch(0.88 0.14 154)` (the OKLCH equivalent of `#7CF5A5`). Also add `--brand-foreground: oklch(0.145 0 0)` (near-black for text on top of the green).
2. Reserve `--accent` for its current shadcn meaning (subtle background highlight). Use `--brand` only for checkmarks, active nav indicators, progress bars, and CTA buttons.
3. In dark mode, `#7CF5A5` reads well on dark backgrounds. In light mode it is visible but lower contrast — verify WCAG AA (4.5:1) for any text placed on `bg-brand`. Use `--brand-foreground` for text on green backgrounds.
4. The existing monochrome active indicator in `SideNav` (`bg-foreground` left bar) should become `bg-brand` — this is the canonical use of the accent color.

**Warning signs:**
shadcn `<Button variant="ghost">` has a bright green hover state. Dropdown menus flash green on hover. `bg-accent` utility class is bright green instead of subtle gray.

**Phase to address:**
Accent Color phase — define the CSS token and audit all `bg-accent` usages before applying `bg-brand` anywhere. This phase must come before or alongside any UI work that uses the new color.

---

### Pitfall 8: Multi-Month Query Performance — Loading 12 Months Sequentially via `ensure_month_exists`

**What goes wrong:**
If the ledger initializes months sequentially (month 1, wait, month 2, wait, ...), loading 12 months of history takes 12 × (RPC round-trip time). At 80ms per Supabase RPC (typical), that is ~960ms of loading time before the ledger renders. Even if parallelized, 12 simultaneous RPCs each running `SELECT → INSERT` in PL/pgSQL can lock the `months` table row for the current user and cause the concurrent inserts to serialize anyway.

**Why it happens:**
`ensure_month_exists` uses `INSERT ... ON CONFLICT DO NOTHING` which acquires a row-level lock. 12 simultaneous inserts for the same user_id serialize at the DB level even if fired concurrently from the client.

**How to avoid:**
1. Replace per-month `ensure_month_exists` calls with a single `initialize_ledger(p_user_id, p_start_year, p_start_month, p_end_year, p_end_month)` RPC that creates all missing months in a loop within a single transaction. One round-trip, no client-side waterfall, no lock contention from concurrent calls.
2. For the continuous ledger's initial load, only materialize months that already exist in the DB (via a single `SELECT * FROM months WHERE user_id = ... AND ...range...` query). Show placeholder rows for months with no data. Create missing months lazily when the user expands or interacts with them.
3. Past months are read-only — they do not need `populate_monthly_bills` or `populate_monthly_income`. Skip those RPCs for months before the current one.

**Warning signs:**
Network tab shows requests waterfall with each month RPC starting only after the previous one completes. Finance page takes > 1 second to show content on first load.

**Phase to address:**
Ledger Timeline phase — data loading architecture must be designed before the timeline component is built.

---

### Pitfall 9: `overflow-hidden` on the Horizontal Slide Container Clips the New Sticky Sidebar

**What goes wrong:**
The current `FinancePage.tsx` wraps the two horizontal views in:
```
<div className="w-full max-w-[1000px] mx-auto relative overflow-hidden bg-card/50 ...">
```
This `overflow-hidden` is needed to clip the horizontal slide transition. The new layout removes the horizontal slide and introduces a two-column layout where the right column is the sticky sidebar. If `overflow-hidden` is inherited by the new two-column wrapper, the sticky sidebar stops working — `position: sticky` requires an ancestor with non-hidden overflow to function.

**Why it happens:**
The horizontal slide container pattern (`overflow-hidden` parent + `transform: translateX()` children) is incompatible with sticky positioning. Developers port the existing container structure into the new layout without realizing the overflow conflict.

**How to avoid:**
1. When replacing the horizontal slide with a two-column layout, remove the `overflow-hidden` wrapper entirely. The horizontal slide pattern is no longer needed.
2. The new two-column container should have `overflow: visible` (default) so the sticky sidebar's positioning works correctly.
3. Apply `overflow-y-auto` only to the ledger column, not to the outer two-column wrapper.

**Warning signs:**
Sidebar sticks initially but stops when the ledger column is scrolled. Chrome DevTools shows sticky element has a clipping ancestor with `overflow: hidden`.

**Phase to address:**
Fixed Sidebar / Layout phase — this is a direct consequence of removing the horizontal slide, so it must be caught during the layout restructure.

---

### Pitfall 10: Accent Color OKLCH Value Requires Dark Mode Verification

**What goes wrong:**
`#7CF5A5` is specified in sRGB hex. The existing design system uses OKLCH for all color tokens (e.g., `oklch(0.145 0 0)`, `oklch(0.97 0 0)`). Converting `#7CF5A5` to OKLCH is straightforward — approximately `oklch(0.88 0.14 154)` — but the resulting color in dark mode may appear washed out or too bright against the dark background (`oklch(0.145 0 0)`). The green reads as a neon accent in dark mode, which may be intentional, but text placed directly on `bg-brand` in dark mode needs a dark foreground to remain legible.

**Why it happens:**
Designers specify hex colors; the codebase uses OKLCH. The conversion is done once and assumed correct. Nobody tests `text-brand-foreground` on `bg-brand` in both light and dark mode at actual screen brightness.

**How to avoid:**
1. Convert `#7CF5A5` to OKLCH using a reliable tool (e.g., `oklch.com` or the CSS Color 4 spec converter). The result is approximately `oklch(0.88 0.14 154)`.
2. Define both `--brand` and `--brand-foreground` tokens in `:root` and `.dark`. In light mode, `--brand-foreground` should be `oklch(0.145 0 0)` (near-black). In dark mode, same.
3. Test the following combinations visually: `text-brand` on `bg-background`, `bg-brand` with `text-brand-foreground`, and `text-brand` as an icon color on the dark sidebar.
4. Check contrast ratio: `#7CF5A5` on white (`#FFFFFF`) is approximately 1.8:1 — this fails WCAG AA. Never use `text-brand` on `bg-background` for readable text. Use it only for decorative elements (checkmarks, indicators, progress fills) or on dark backgrounds.

**Warning signs:**
Green text on white background is illegible. In dark mode, the green glows harshly. `--brand` accidentally used where `--accent` (gray hover) was intended.

**Phase to address:**
Accent Color phase — OKLCH conversion and dark mode verification must be completed before any component uses the brand color.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Per-month `useFinance` calls in ledger | Reuses existing hook with no changes | 12+ concurrent RPCs on load, visible lag | Never in the new ledger — create batch hook |
| Storing `remaining_balance` as mutable column without reconciliation RPC | Fast reads | Drift on payment edits or reverts | Only if reconciliation RPC is added in same phase |
| Replacing `--accent` token directly with `#7CF5A5` | One-line CSS change | All shadcn hover states turn bright green | Never — add `--brand` token instead |
| `overflow-hidden` on two-column layout container | Prevents layout bleed during dev | Breaks `position: sticky` on sidebar | Never if sidebar uses sticky positioning |
| Computing `starting_balance` at creation and never updating | Simple one-time write | Balance chain corrupts after any past-month edit | Only if past-month editing is explicitly out of scope |
| Module-level cache for multi-month reads | Instant revisit | Multiple components share cache, writes invalidate incorrectly | Only for single-month view — replace with store for ledger |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Tailwind v4 + custom CSS token | Adding `--brand` to `:root` but forgetting `@theme inline` mapping so `bg-brand` utility doesn't generate | Add `--color-brand: var(--brand)` inside the existing `@theme inline { }` block in `index.css` |
| shadcn Nova preset + new color token | Using `accent` class names from shadcn which are already mapped to the gray hover token | Reserve `accent` for shadcn internals; use a new `brand` token for all product-specific coloring |
| `position: sticky` + `overflow-y: auto` ancestor | Sticky works in isolation but fails inside a scrollable container that is not the viewport | The scroll container for sticky to work against must be the element that has `overflow: auto/scroll`, not an ancestor of it |
| Supabase batch month creation | Calling `ensure_month_exists` 12 times from the client in `Promise.all()` | Write a single RPC that loops internally — one network round-trip for all months |
| Supabase `numeric` type + JavaScript | RPC returning `numeric(14,2)` columns arrives as strings in JS (`"45000.00"` not `45000`) | Always `Number(raw.field)` on every numeric field from RPC responses — already done in `useFinance.ts` but must be replicated in every new hook |
| Budget expenses + `months.current_balance` | Updating `current_balance` in two separate queries (INSERT expense + UPDATE months) | Single atomic RPC to prevent partial updates |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| 12 simultaneous `ensure_month_exists` RPCs | Waterfall in Network tab, 800ms+ load time | Single `initialize_ledger` RPC for range | Immediately on first ledger load |
| Rendering all 12 month sections with full data | React re-renders 12 sections on every state change | Virtualize past months or render them as collapsed summaries until expanded | Noticeable at > 6 visible months |
| Re-fetching all months after any single write | Write to March re-fetches January through March | Granular invalidation — refetch only the written month | Immediately if implemented naively |
| `get_year_overview` RPC runs for the sidebar | Sidebar re-fetches annual data on every month interaction | Cache year overview separately from month detail data; only refetch on explicit refresh | When sidebar update triggers on every bill payment |
| Loading `monthly_bills` + `monthly_income` for all 12 past months at once | Large payload, slow initial render | Only load detail data for current month and next month; past months use summary data from year overview | After 6+ months of data accumulate |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| New `debt_payments` table without RLS | All debt data accessible via anon key | Every new migration must include `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and all four CRUD policies before any data insert |
| Budget expense table missing `user_id` FK in RLS policy | Cross-user data leakage (irrelevant for single user but bad practice) | Follow the exact RLS pattern from `008_finance_tables.sql`: `USING (auth.uid() = user_id)` on every policy |
| New RPCs without `SET search_path = public` | Schema injection risk in multi-tenant scenarios | Add `ALTER FUNCTION ... SET search_path = public` at end of every migration — already the pattern in `009_finance_rpcs.sql` and `013_phase4_rpcs.sql` |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Collapsing past months by default with no summary | User can't see what happened last month without expanding | Show a single-line summary row (month name, ending balance, income, expenses) in collapsed state |
| Fixed sidebar with no scroll of its own when content overflows | Sidebar projections and year table get cut off on small laptops | Sidebar column uses its own `overflow-y: auto` with `max-h-screen` so it scrolls independently |
| Accent color on destructive/warning elements (overdue debts) | Green accent on red overdue text creates confusing color signal | Reserve `--brand` green for positive/complete states; keep `--destructive` red for warnings and overdue |
| Budget "remaining cap" shown without context of what's already spent | User sees "₱5,000 remaining" without knowing total cap | Always show `spent / cap` (e.g., "₱15,000 / ₱20,000") so remaining has context |
| Inline bill editing closing on accidental outside click | User loses edit state mid-entry | Trap focus in inline edit components; require explicit cancel or save action |

---

## "Looks Done But Isn't" Checklist

- [ ] **Balance Chain:** Edit a past month's balance, then open the following month. Verify its `starting_balance` either auto-updated or shows a "chain break" indicator.
- [ ] **Recurring Debt:** Log two payments to a debt, then delete one. Verify `remaining_balance` reflects only the surviving payment.
- [ ] **Accent Color:** Open every shadcn component (Button, Select, DropdownMenu, Sheet). Verify hover/focus states are NOT bright green.
- [ ] **Accent Color — Dark Mode:** Switch to dark mode. Verify `--brand` green is legible against the dark background and not blindingly bright.
- [ ] **Fixed Sidebar:** Scroll the ledger 3 full screens down on desktop. Verify sidebar stays pinned and does not scroll with the ledger.
- [ ] **Fixed Sidebar — iOS Safari:** Test on actual iOS device. Verify sidebar does not jump or disappear when virtual keyboard opens.
- [ ] **Ledger Load Time:** First visit to finance page (empty cache, no localStorage). Verify content appears within 500ms, not a 1-second waterfall.
- [ ] **Budget Race Condition:** Use DevTools to throttle network to Slow 3G. Log an expense. Before the request completes, log a second expense. Verify both amounts are correctly reflected in `current_balance`.
- [ ] **OKLCH Token:** `--brand` is defined in `@theme inline` as `--color-brand: var(--brand)` so Tailwind utilities `bg-brand`, `text-brand`, `border-brand` all work.
- [ ] **Past Month Collapse:** Collapse a past month in the ledger. Verify its data is still readable in collapsed summary form and does not trigger a new DB fetch.
- [ ] **Module Cache:** In the new Zustand store, write to March, then navigate to April. Verify March's updated data is visible without a page refresh.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Balance chain corrupted by past-month edits | MEDIUM | Write a one-time SQL script: `UPDATE months SET starting_balance = (SELECT current_balance FROM months prev WHERE prev.user_id = m.user_id AND (prev.year * 12 + prev.month) = (m.year * 12 + m.month - 1)) WHERE user_id = ...` |
| `--accent` token replaced with green, shadcn broken | LOW | Revert `--accent` in `index.css`, introduce `--brand` token instead, find/replace all incorrect `bg-brand` usages |
| Sticky sidebar clipping due to `overflow-hidden` ancestor | LOW | Remove `overflow-hidden` from the two-column wrapper, apply `overflow-y-auto` only to the ledger column |
| `remaining_balance` drifted from actual payment sum | LOW | Add a `recalculate_debt_balance(debt_id)` RPC and call it during dev tools reset; display computed value alongside stored value temporarily to detect drift |
| 12-RPC fan-out on ledger load causing timeout | MEDIUM | Short term: batch with `Promise.all()` instead of sequential. Long term: write `initialize_ledger` RPC as described |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 12-RPC fan-out on timeline load | Ledger Timeline | Network tab shows single batch RPC on first finance page load |
| Balance chain breaks on past-month edits | Ledger Timeline | Edit Jan balance, verify Feb `starting_balance` updates or shows warning |
| Module-level cache stale in multi-month view | Ledger Timeline | Write to any month, verify sidebar reflects change without page refresh |
| `remaining_balance` drift on debt payments | Recurring Debts | Log and revert 3 payments, verify `remaining_balance = original - remaining_payments` |
| Budget expense race condition | Budget Tracking | Throttled network test: two quick expense logs produce correct totals |
| Fixed sidebar + `overflow-hidden` conflict | Fixed Sidebar / Layout | Scroll test on desktop and iOS Safari, sticky stays pinned |
| `overflow-y-auto` on AppShell breaking sidebar sticky | Fixed Sidebar / Layout | Sidebar positional test on all viewport sizes |
| `--accent` token replacement breaks shadcn | Accent Color | Visual regression: all shadcn components checked in light + dark mode |
| `--brand` OKLCH conversion incomplete | Accent Color | `bg-brand`, `text-brand`, `border-brand` Tailwind utilities generate correct CSS |
| `#7CF5A5` contrast failure on white background | Accent Color | Accessibility check: brand color never used as text on light background |

---

## Sources

- Codebase: `src/hooks/useFinance.ts` (module-level `monthCache`, `ensure_month_exists` per-mount call, `Number()` normalization)
- Codebase: `src/components/layout/AppShell.tsx` (`overflow-y-auto` on `<main>`, `ml-0 sm:ml-14` pattern)
- Codebase: `src/components/layout/SideNav.tsx` (`fixed left-0 top-0 bottom-0 w-14`, not sticky)
- Codebase: `src/index.css` (`--accent: oklch(0.97 0 0)` in `:root`, `@theme inline` block, `@custom-variant dark`)
- Codebase: `src/pages/FinancePage.tsx` (`overflow-hidden` on horizontal slide container, per-month hook instantiation)
- Codebase: `supabase/migrations/009_finance_rpcs.sql` (`ensure_month_exists` inserts `starting_balance = prev_balance` once at creation)
- Codebase: `supabase/migrations/013_phase4_rpcs.sql` (`apply_bill_paid`, `apply_balance_override` — atomic RPCs pattern to follow for budget expenses)
- Codebase: `src/types/finance.ts` (existing `Month`, `BillTemplate`, `MonthlyBill` types — new debt/budget types must extend this pattern)
- MDN: [position: sticky requirements](https://developer.mozilla.org/en-US/docs/Web/CSS/position#sticky) — "sticky positioning requires overflow: visible on all ancestors between the element and its scroll container"
- CSS Color 4: OKLCH conversion — `#7CF5A5` = approximately `oklch(0.88 0.14 154)` via perceptual lightness/chroma/hue
- shadcn/ui Nova preset: `--accent` is used in `hover:bg-accent` across Button, DropdownMenu, Select, NavigationMenu components

---
*Pitfalls research for: wintrack v2.1 finance redesign — continuous ledger, budget tracking, recurring debts, fixed sidebar, accent color*
*Researched: 2026-03-23*
