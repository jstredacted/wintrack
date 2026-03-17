---
phase: 04-finance-extended
plan: 01
subsystem: database
tags: [supabase, postgres, rpc, rls, react-hooks, typescript]

# Dependency graph
requires:
  - phase: 03-finance-core
    provides: months, income_sources, monthly_income tables + RPCs
provides:
  - bill_templates and monthly_bills tables with RLS
  - balance_changes audit table with RLS
  - oneoff_income table with RLS
  - 7 RPCs (apply_bill_paid, populate_monthly_bills, apply_balance_override, revert_balance_change, apply_oneoff_income, delete_oneoff_income, get_year_overview)
  - BillTemplate, MonthlyBill, BalanceChange, OneOffIncome, MonthSummary TypeScript types
  - useBills, useBalanceHistory, useOneOffIncome React hooks
  - getDueUrgency and buildWaterfallSteps utility functions
affects: [04-02, 04-03, 04-04, 04-05]

# Tech tracking
tech-stack:
  added: []
  patterns: [template-instance bill model, atomic RPC balance mutations, urgency utility]

key-files:
  created:
    - supabase/migrations/010_bills_tables.sql
    - supabase/migrations/011_balance_history.sql
    - supabase/migrations/012_oneoff_income.sql
    - supabase/migrations/013_phase4_rpcs.sql
    - src/lib/utils/finance.ts
    - src/hooks/useBills.ts
    - src/hooks/useBalanceHistory.ts
    - src/hooks/useOneOffIncome.ts
  modified:
    - src/types/finance.ts
    - src/hooks/useFinance.ts
    - src/hooks/useFinance.test.ts

key-decisions:
  - "Template + instance bill model: bill_templates defines recurrence, monthly_bills are per-month snapshots"
  - "All balance-affecting operations use atomic RPCs, never direct table updates"
  - "Balance history only tracks manual overrides, not bill/income toggles"

patterns-established:
  - "populate_monthly_bills mirrors populate_monthly_income pattern for bill generation"
  - "Hooks follow useState/useEffect/useCallback pattern with refetchKey for cache invalidation"

requirements-completed: [BILL-01, BILL-02, BILL-04, HIST-01, ONEOFF-01, ONEOFF-02]

# Metrics
duration: 4min
completed: 2026-03-17
---

# Phase 4 Plan 01: Data Layer Summary

**3 new tables (bills, balance_changes, oneoff_income), 7 RPCs, 6 TypeScript types, 3 React hooks, and 2 utility functions for Phase 4 finance extended features**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-17T11:46:45Z
- **Completed:** 2026-03-17T11:51:00Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Complete database schema for bills (template + instance model), balance history audit trail, and one-off income
- 7 atomic RPCs covering bill toggle, bill population, balance override/revert, one-off income add/delete, and year overview aggregation
- 3 React hooks (useBills, useBalanceHistory, useOneOffIncome) with full CRUD + RPC integration
- useFinance upgraded from direct balance updates to apply_balance_override RPC with audit logging

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migrations + RPCs + TypeScript types** - `e8b134d` (feat)
2. **Task 2: React hooks (RED)** - `a8514d3` (test)
3. **Task 2: React hooks (GREEN)** - `27f07f4` (feat)

## Files Created/Modified
- `supabase/migrations/010_bills_tables.sql` - bill_templates + monthly_bills tables with RLS + indexes
- `supabase/migrations/011_balance_history.sql` - balance_changes audit table with RLS
- `supabase/migrations/012_oneoff_income.sql` - oneoff_income table with RLS
- `supabase/migrations/013_phase4_rpcs.sql` - 7 RPCs for all Phase 4 atomic operations
- `src/types/finance.ts` - Added BillTemplate, MonthlyBill, BalanceChange, OneOffIncome, MonthSummary, RecurrenceType
- `src/lib/utils/finance.ts` - getDueUrgency and buildWaterfallSteps utilities
- `src/hooks/useBills.ts` - Bill CRUD + paid toggle hook
- `src/hooks/useBalanceHistory.ts` - Balance history fetch + revert hook
- `src/hooks/useOneOffIncome.ts` - One-off income CRUD hook
- `src/hooks/useFinance.ts` - Switched to apply_balance_override RPC, added populate_monthly_bills call
- `src/hooks/useFinance.test.ts` - Updated updateBalance test for RPC pattern

## Decisions Made
- Template + instance bill model: bill_templates for definitions with recurrence, monthly_bills for per-month snapshots (enables edit-once propagation)
- All balance-affecting operations use atomic RPCs -- never direct table updates from client
- Balance history audit trail only tracks manual overrides, not bill/income toggles (those have their own state)
- Revert applies negative delta to current balance (preserves intervening operations)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated useFinance.test.ts for new RPC pattern**
- **Found during:** Task 2 (hook implementation)
- **Issue:** Existing updateBalance test expected direct `.from('months').update()` but we changed to RPC
- **Fix:** Updated test to verify `apply_balance_override` RPC call instead
- **Files modified:** src/hooks/useFinance.test.ts
- **Verification:** All 6 useFinance tests pass
- **Committed in:** 27f07f4 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Test update was necessary consequence of the planned useFinance modification. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. Migrations need to be applied to Supabase.

## Next Phase Readiness
- All data layer artifacts ready for UI plans (04-02 through 04-05)
- Hooks export stable interfaces that UI components can consume directly
- Pre-existing ConsistencyGraph test failures are unrelated to Phase 4 changes
