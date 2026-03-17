# Phase 4: Finance Extended - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend the finance module with: unified bills system (one-time/recurring/ongoing with paid toggle), balance change history with audit trail and revert, one-off income entries (bonuses, receivables), financial dashboard views (waterfall step chart, past month snapshots, future projections), and year overview at /finance/year. External balances (Polymarket, SOL DCA) are deferred to v2.1.

</domain>

<decisions>
## Implementation Decisions

### Bills UI & Recurrence
- Compact list rows (not full cards like income) — bills are more numerous, need tighter layout
- Name | amount | due date | paid toggle per row
- Due date urgency: all three indicators combined — text label ("Due in 3 days" / "Overdue"), left border thickness/brightness increasing with urgency, AND sorted most urgent first
- Recurrence display: repeat icon only for recurring, no icon for one-time — details available on tap/expand
- One-time bills disappear from active list after being paid
- Recurring bills show remaining count on tap
- CRUD: quick add on Finance page ("+ Add Bill" inline form) AND full management in Settings

### Waterfall & Month Views
- Current month waterfall: SVG visual step chart showing balance as a stepped line going down with each bill paid — not a text list, a proper chart
- Past months: full snapshot — show all bills (paid status), all income (received status), budget progress, final balance — frozen read-only
- Future months: simple projected balance = current ending balance + expected income - recurring bills — one number, not itemized

### Year Overview
- Separate route at `/finance/year` — not a section on the Finance page
- 12-month columns layout — clean, minimal, not cluttered like a spreadsheet
- Each month column shows: month label, ending balance, progress bar where income = full bar and expenses fill it showing consumption
- One-off income extends the progress bar beyond 100% with a visually distinct segment (different opacity, not dashed) showing additional income came in on top of regular
- Sparkline in header area showing balance trajectory across 12 months — compact, not dominant
- Tap a month column to navigate to that month's detailed view

### Balance Change History
- Every manual balance override recorded with timestamp and amount change (+/- delta)
- Finance page shows last change indicator next to balance hero (e.g., greyed out "+₱30,000 from last change")
- History modal accessible from the indicator — shows all changes with dates, amounts, and notes
- User can delete a change entry, which reverts balance to the value before that change
- History is per-month (each month has its own change log)

### One-Off Income
- Add one-off income with: amount (PHP), date, note/description (e.g., "Debt paid by John", "Year-end bonus", "Freelance project")
- One-off income adds to current balance immediately when recorded
- Appears on the year overview as the extended segment on the progress bar (beyond regular income)
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Finance requirements
- `.planning/REQUIREMENTS.md` — BILL-01..07, FIN-02..05, HIST-01..04, ONEOFF-01..04

### Prior phase context
- `.planning/phases/03-finance-core/03-CONTEXT.md` — Finance page layout, balance/budget display, income cards, MonthStrip decisions
- `.planning/phases/03-finance-core/03-RESEARCH.md` — Finance DB schema, RPC patterns, currency utilities

### Source app reference
- `/Users/justin/Repositories/Personal/₱350` — Original finance app: `lib/domain/finance.ts` (calculations), `supabase/migrations/` (bills table schema), `components/finance/lists.tsx` (BillsList pattern)

### Milestone research
- `.planning/research/ARCHITECTURE.md` — Finance integration architecture
- `.planning/research/FEATURES.md` — Bill management table stakes, recurring rollover patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/finance/MonthStrip.tsx` — Month navigation with centering, snap scroll (year overview can link to month views via this)
- `src/components/finance/BalanceHero.tsx` — Tap-to-edit balance display (history indicator goes next to this)
- `src/components/finance/BudgetGauge.tsx` — SVG circular gauge (waterfall step chart follows similar SVG patterns)
- `src/components/finance/IncomeCard.tsx` — Toggle + collapse pattern (bills use compact variant of this)
- `src/hooks/useFinance.ts` — Month lifecycle, balance mutations (extend with bill toggle, history logging)
- `src/lib/utils/currency.ts` — formatPHP, formatUSD (reuse for bill amounts)
- `src/types/finance.ts` — Month, IncomeSource, MonthlyIncome types (extend with Bill, BalanceChange, OneOffIncome)

### Established Patterns
- Supabase RPC for atomic operations (apply_income_received pattern → apply_bill_paid)
- Zustand stores for UI state
- TDD: tests first in hooks, then implementation
- Nothing Phone monochrome aesthetic with foreground opacity levels

### Integration Points
- `src/pages/FinancePage.tsx` — Add bills section, waterfall chart, balance history indicator
- `src/App.tsx` — Add `/finance/year` route
- `src/pages/SettingsPage.tsx` — Add bills management section alongside income sources
- `src/hooks/useFinance.ts` — Extend with bill toggle, balance history, one-off income

</code_context>

<specifics>
## Specific Ideas

- Bills as compact rows, not cards — bills are recurring noise, income is the exciting event
- Year overview should feel like a dashboard you open to see the big picture — clean 12 columns, not a spreadsheet
- The income progress bar with one-off extension is the signature visual of the year view — regular income as base, bonus income visually extends beyond, expenses consume from the left
- Balance history indicator should be subtle (greyed out text) — not a primary UI element, but available when needed

</specifics>

<deferred>
## Deferred Ideas

- External balances (Polymarket Bot, SOL DCA) — deferred to v2.1, will be API-driven
- Net worth breakdown card — deferred until external balances are added
- Unexpected payment/bonus mechanic as a first-class concept — captured in ONEOFF requirements for now, may evolve in v2.1

</deferred>

---

*Phase: 04-finance-extended*
*Context gathered: 2026-03-17*
