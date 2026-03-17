---
phase: 04-finance-extended
plan: "05"
subsystem: finance
tags: [year-overview, bills-settings, barrel-navigation, budget-bar, optimistic-ui]

requires:
  - phase: 04-01
    provides: DB tables, RPCs, hooks
  - phase: 04-02
    provides: Bills UI components
  - phase: 04-03
    provides: Balance history, one-off income
  - phase: 04-04
    provides: Month view modes
provides:
  - Year overview page at /finance/year with 12-column grid, sparkline, summary stats
  - Complete Finance tab redesign with barrel month navigation and horizontal view switching
  - Budget progress bar with paid/unpaid/budget zones
  - Category cards (Bills, Income, One-Off) with inline add forms
  - Optimistic UI updates for all mutations
  - Multi-select balance history with bulk revert
  - Fresh exchange rate fetch before income receipt
affects: [finance, settings, router]

tech-stack:
  added: []
  patterns: [barrel-scroll-3d, horizontal-view-switching, optimistic-state-updates, multi-select-with-bulk-action]

key-files:
  created:
    - src/components/finance/MonthBarrel.tsx
    - src/components/finance/BudgetProgressBar.tsx
    - src/components/finance/BalanceDisplay.tsx
    - src/components/finance/BillsCard.tsx
    - src/components/finance/IncomeChecklistCard.tsx
    - src/components/finance/OneOffCard.tsx
    - src/components/finance/ViewNavigator.tsx
    - src/pages/YearOverviewPage.tsx
  modified:
    - src/pages/FinancePage.tsx
    - src/hooks/useFinance.ts
    - src/hooks/useBills.ts
    - src/hooks/useOneOffIncome.ts
    - src/hooks/useExchangeRate.ts
    - src/hooks/useBalanceHistory.ts
    - src/components/finance/BalanceHistoryModal.tsx
    - src/components/finance/MonthColumn.tsx
    - src/components/finance/YearGrid.tsx
---

## What was built

Complete Finance Extended module with major UI redesign:

1. **Year overview** at /finance/year — 12-column vertical bar grid, balance sparkline, summary stats (Total Income/Expenses/Net/Savings Rate), 4x3 card variant removed in favor of original column layout
2. **Finance tab redesign** — Barrel month navigation (3D perspective, gradient fades), horizontal view switching (overview ↔ cards)
3. **Budget progress bar** — Horizontal segmented bar showing paid/unpaid/budget zones with proper proportions
4. **Category cards** — Bills, Income, One-Off as side-by-side cards with inline add forms ("Add Another"/"Done" pattern)
5. **Optimistic UI** — All mutations (bill toggle, income receive, one-off add/delete) update React state first, sync in background
6. **Multi-select balance history** — Checkbox selection, bulk revert with delta preview
7. **Fresh exchange rate** — Fetches live rate from Frankfurter API before marking USD income as received
8. **Supabase numeric normalization** — All numeric(14,2) fields parsed with Number() to prevent string comparison bugs

## Deviations from plan

- **Major UI redesign** during checkpoint — barrel navigation, horizontal views, and category cards were not in original plan but requested by user during visual verification
- **WaterfallChart removed** — replaced with budget progress bar per user preference
- **BudgetGauge/ExpenseGauge removed** — replaced by the horizontal budget bar
- **Settings bill CRUD removed** — bills managed only on Finance page
- **Blur overlay removed from PIN** — user found it unnecessary
- **Multiple iteration rounds** on container sizing, typography, spacing, year overview layout

## Self-Check: PASSED

- [x] Bills with recurrence (one-time, recurring, ongoing)
- [x] Bill paid toggle deducts from balance
- [x] Balance history with multi-select revert
- [x] One-off income adds to balance
- [x] Year overview at /finance/year with data aggregation
- [x] Budget progress bar with correct proportions
- [x] Barrel month navigation with 3D effect
- [x] Past months read-only, future months show expected data
- [x] Optimistic UI eliminates loading flash
- [x] User approved visual checkpoint
