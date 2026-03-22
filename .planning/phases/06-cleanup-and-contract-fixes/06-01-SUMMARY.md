---
phase: 06-cleanup-and-contract-fixes
plan: 01
subsystem: ui
tags: [react, finance, bills, react-router, supabase]

# Dependency graph
requires:
  - phase: 04-finance-extended
    provides: useBills hook with deleteBill, BillsCard component, MonthlyBill type
  - phase: 05-ux-polish
    provides: YearOverviewPage with ?month= navigation link
provides:
  - FinancePage reads ?month= query param to open a specific month on load
  - BillsCard delete per-bill via Trash2 icon button
  - BillsCard inline edit per-bill (name, amount, due_day) via Pencil icon
  - updateBill function in useBills updating both bill_templates and monthly_bills
affects: [year-overview, finance-page, bills-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useSearchParams for URL-driven initial state in page components
    - Inline edit pattern: editingId state + conditional row render (edit form vs normal row)
    - Dual-table update: update template row then matching instance row in same mutation

key-files:
  created: []
  modified:
    - src/pages/FinancePage.tsx
    - src/components/finance/BillsCard.tsx
    - src/hooks/useBills.ts

key-decisions:
  - "useSearchParams initializes selectedMonth from URL; regex validates YYYY-MM format before use, falls back to getCurrentMonth()"
  - "updateBill updates bill_templates first, then monthly_bills for current month if monthId is set, then calls refetch"
  - "editingId is a single string (not a Set) — only one bill editable at a time, matching the existing inline-edit pattern from Phase 3"

patterns-established:
  - "URL param initialization: const [state] = useState(() => { const fromUrl = searchParams.get('key'); return fromUrl && /regex/.test(fromUrl) ? fromUrl : fallback; })"
  - "Inline bill edit: editingId state drives conditional row render; Enter saves, Escape cancels, autoFocus on name input"

requirements-completed: [FIN-05, BILL-03]

# Metrics
duration: 8min
completed: 2026-03-22
---

# Phase 06 Plan 01: Cleanup and Contract Fixes Summary

**YearOverviewPage month-click now navigates correctly into FinancePage; bills support per-row delete (Trash2) and inline editing (Pencil) of name, amount, and due day**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-22T17:00:00Z
- **Completed:** 2026-03-22T17:08:38Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- FinancePage reads `?month=YYYY-MM` query param on load, enabling YearOverviewPage month-click navigation (FIN-05)
- BillsCard renders a Trash2 delete button per bill row when not in readOnly mode (BILL-03 partial)
- BillsCard renders a Pencil edit button per bill row; clicking enters inline edit form with name/amount/due_day inputs; Enter saves, Escape cancels (BILL-03 complete)
- `useBills` exports `updateBill` which updates `bill_templates` and the matching `monthly_bills` row atomically then refetches

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix FinancePage to read ?month= query param** - `d078b49` (feat)
2. **Task 2: Add bill delete button to BillsCard** - `4fa13e5` (feat)
3. **Task 3: Add inline bill editing to BillsCard** - `53f72c2` (feat)

## Files Created/Modified

- `src/pages/FinancePage.tsx` - Added useSearchParams import; selectedMonth initialized from ?month= param with validation; destructures updateBill/deleteBill from useBills; passes onDeleteBill and onEditBill to BillsCard
- `src/components/finance/BillsCard.tsx` - Added onDeleteBill/onEditBill props; added editingId/editName/editAmount/editDueDay state; added startEdit/cancelEdit/saveEdit helpers; conditional row render (inline edit form vs normal row with edit+delete icon buttons)
- `src/hooks/useBills.ts` - Added updateBill callback that updates bill_templates then monthly_bills; added to UseBillsResult interface and return object

## Decisions Made

- `useSearchParams` initializes `selectedMonth` from URL with `/^\d{4}-\d{2}$/` regex validation; invalid or missing params fall back to `getCurrentMonth()`
- `updateBill` updates `bill_templates` first (source of truth), then `monthly_bills` for the current month if `monthId` is available, ensuring immediate UI reflection before refetch
- `editingId` is a single `string | null` — only one bill editable at a time, consistent with the existing inline-edit pattern used elsewhere in the app (OneOffCard, balance editing)
- Pencil and Trash2 icon buttons are visible only when `!readOnly && onXxx` — same guard pattern as the existing toggle button

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- FIN-05 and BILL-03 requirements are fully satisfied
- YearOverviewPage month navigation is now end-to-end functional
- Bills CRUD is complete (add, toggle paid, edit, delete)
- Ready to continue remaining plans in phase 06-cleanup-and-contract-fixes

---
*Phase: 06-cleanup-and-contract-fixes*
*Completed: 2026-03-22*

## Self-Check: PASSED

- FOUND: src/pages/FinancePage.tsx
- FOUND: src/components/finance/BillsCard.tsx
- FOUND: src/hooks/useBills.ts
- FOUND: .planning/phases/06-cleanup-and-contract-fixes/06-01-SUMMARY.md
- COMMIT d078b49: feat(06-01): read ?month= query param in FinancePage (FIN-05)
- COMMIT 4fa13e5: feat(06-01): add bill delete button to BillsCard (BILL-03 partial)
- COMMIT 53f72c2: feat(06-01): add inline bill editing to BillsCard (BILL-03 complete)
