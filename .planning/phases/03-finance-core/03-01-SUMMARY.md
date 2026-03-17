---
phase: 03-finance-core
plan: 01
subsystem: database
tags: [postgres, rls, sql, typescript, intl, currency, vitest]

requires:
  - phase: 01-dev-workflow
    provides: TypeScript config, Supabase typed client, Vitest setup
provides:
  - months, income_sources, monthly_income tables with RLS
  - ensure_month_exists, apply_income_received, populate_monthly_income RPCs
  - Finance TypeScript types (Month, IncomeSource, MonthlyIncome, ExchangeRateResult)
  - Currency formatting utilities (formatPHP, formatUSD, Wise/PayPal fee calculators)
  - Month string utilities (getCurrentMonth, getMonthLabel, parseMonth, navigation)
affects: [03-finance-core, hooks, finance-page, settings-page]

tech-stack:
  added: []
  patterns: [Intl.NumberFormat for currency, numeric(14,2) for Postgres amounts, SECURITY INVOKER RPCs]

key-files:
  created:
    - supabase/migrations/008_finance_tables.sql
    - supabase/migrations/009_finance_rpcs.sql
    - src/types/finance.ts
    - src/lib/utils/currency.ts
    - src/lib/utils/currency.test.ts
    - src/lib/utils/month.ts
    - src/lib/utils/month.test.ts
  modified: []

key-decisions:
  - "Ported source app schema with user_id + RLS added to every table"
  - "Wise fee: $1.02 flat + 0.57% variable; PayPal: 3% spread — exported as constants"
  - "Month string format YYYY-MM with Intl.DateTimeFormat for labels"

patterns-established:
  - "Finance tables follow auth.uid() = user_id RLS pattern from 001_initial_schema"
  - "Currency formatting via shared formatPHP/formatUSD — never Intl.NumberFormat directly in components"
  - "Month navigation via string manipulation with year rollover handling"

requirements-completed: [BAL-01, BAL-04, BAL-05, BUD-01, INC-01, INC-02, INC-04]

duration: 2min
completed: 2026-03-17
---

# Phase 3 Plan 1: Database Foundation Summary

**Finance tables (months, income_sources, monthly_income) with RLS, 3 RPCs for atomic balance operations, currency/month utilities with 18 passing tests**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-17T05:51:34Z
- **Completed:** 2026-03-17T05:53:57Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Three finance tables with full RLS (12 policies) and 3 performance indexes
- Three RPC functions: ensure_month_exists (balance carry-forward), apply_income_received (atomic toggle), populate_monthly_income (auto-populate from active sources)
- Currency formatting with Intl.NumberFormat and Wise/PayPal fee calculations with exported constants
- Month string utilities for navigation, parsing, and labeling
- 18 tests covering all utility functions

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migrations and RPC functions** - `463883d` (feat)
2. **Task 2 RED: Failing tests for currency and month** - `73a8787` (test)
3. **Task 2 GREEN: Types, currency, and month implementations** - `a2329dc` (feat)

## Files Created/Modified
- `supabase/migrations/008_finance_tables.sql` - months, income_sources, monthly_income tables with RLS
- `supabase/migrations/009_finance_rpcs.sql` - ensure_month_exists, apply_income_received, populate_monthly_income RPCs
- `src/types/finance.ts` - Month, IncomeSource, MonthlyIncome, ExchangeRateResult interfaces
- `src/lib/utils/currency.ts` - formatPHP, formatUSD, calculateWiseNetPHP, calculatePayPalNetPHP
- `src/lib/utils/currency.test.ts` - 9 tests for currency formatting and fee calculations
- `src/lib/utils/month.ts` - getCurrentMonth, getMonthLabel, parseMonth, getPrevMonth, getNextMonth, getMonthYear
- `src/lib/utils/month.test.ts` - 9 tests for month string utilities

## Decisions Made
- Ported source app schema with user_id + RLS added (source app had no multi-user concept)
- Wise fee constants exported ($1.02 flat + 0.57% variable) so they're testable and updatable
- PayPal fee as 3% spread on exchange rate (not on transfer amount)
- Month format "YYYY-MM" with Intl.DateTimeFormat for human-readable labels
- numeric(14,2) for all Postgres amounts (exact precision, no floating point)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - migration files are ready to apply to Supabase but no external service configuration needed.

## Next Phase Readiness
- Database schema ready for hooks (useFinance, useIncomeConfig) in next plan
- Types importable from @/types/finance
- Currency and month utilities tested and ready for component use
- RPCs ready for atomic balance operations

---
*Phase: 03-finance-core*
*Completed: 2026-03-17*
