# Phase 3: Finance Core - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the core finance module: current balance as single source of truth with manual override, monthly budget limit with circular gauge progress visualization, configurable income streams with Wise/PayPal USD→PHP conversion, and MonthStrip navigation between months. This phase creates the Finance page, database schema, and month model. Bills, year overview, waterfall view, and external balances are Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Finance Page Layout
- New route at `/finance` under AppShell
- SideNav order: Today → Journal → Finance → Settings
- Wallet icon (Lucide) for the Finance tab
- MonthStrip at very top of the page (like DayStrip on TodayPage), then content below
- Content below MonthStrip: large balance hero, then budget progress, then income source cards

### Balance & Budget Display
- Large hero number for current balance — big monospaced ₱ amount front and center with "Current Balance" label
- Tap-to-edit for balance override — tap the number itself to make it editable inline, type new amount, press enter
- Circular gauge (donut/ring chart) for budget progress — fills as expenses approach limit, color changes at thresholds (neutral/approaching/critical)
- Currency formatting: ₱45,000.00 — Philippine Peso sign prefix, two decimal places, comma thousands separator

### Income Source Cards
- Full card per income source showing: source name, USD amount, expected PHP conversion, payday date, and a toggle button to mark received
- When toggled as received: card collapses to a single-line summary (e.g., "Wise: ₱78,500 received") with an undo option
- Expandable fee detail — show net PHP by default, tap to expand and see USD amount → exchange rate → fee deducted → net PHP
- Income sources configured in Settings (name, amount, currency USD/PHP, conversion method Wise/PayPal/None, expected payday)

### Month Navigation
- MonthStrip styled like DayStrip — horizontal scrollable row of month labels, current month centered and highlighted
- All-time range — every month that has data plus current month (not limited to current year)
- Past months are read-only except balance override (can correct final balance for past months, but can't mark income/toggle bills)
- Current balance carries forward to next month as starting point

### Claude's Discretion
- Database schema design for months, income_sources, monthly_income tables
- Supabase RLS policies for new finance tables
- Wise/PayPal API integration approach for live rates
- Circular gauge SVG implementation (existing ConsistencyGraph uses SVG patterns)
- MonthStrip scroll behavior and centering logic

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Finance requirements
- `.planning/REQUIREMENTS.md` — BAL-01..05, BUD-01..02, INC-01..06, FIN-01

### Source app reference
- `/Users/justin/Repositories/Personal/₱350` — Original finance app to port from (Next.js + TypeScript). Key files: `lib/domain/finance.ts` (calculation logic), `supabase/migrations/` (schema), `app/actions.ts` (server actions for salary toggle, month management)

### Milestone research
- `.planning/research/ARCHITECTURE.md` — Finance integration architecture recommendations
- `.planning/research/STACK.md` — Recharts via shadcn/ui for charts, currency utility patterns
- `.planning/research/PITFALLS.md` — Finance RLS pitfalls, stored procedure porting concerns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/history/DayStrip.tsx` — MonthStrip can follow the same pattern (horizontal scroll, centered selection, date rendering)
- `src/components/history/ConsistencyGraph.tsx` — SVG patterns for the circular gauge
- `src/lib/supabase.ts` — Typed Supabase client with `createClient<Database>()`
- `src/lib/database.types.ts` — Generated types, will need regeneration after finance table migrations
- `src/stores/settingsStore.ts` — Zustand store pattern for settings; income sources config could follow same pattern

### Established Patterns
- Hooks for data fetching: useState/useEffect/useCallback pattern (useWins, useJournal, useHistory)
- Supabase queries with anon key + RLS
- Zustand v5 `create()` for stores
- Nothing Phone aesthetic: monospaced type, structured negative space, monochrome

### Integration Points
- `src/App.tsx` — Add `/finance` route under AppShell children
- `src/components/layout/SideNav.tsx` — Add Finance tab with Wallet icon between Journal and Settings
- `src/pages/SettingsPage.tsx` — Add income sources configuration section

</code_context>

<specifics>
## Specific Ideas

- MonthStrip should feel like DayStrip — same visual weight, same scroll behavior, just months instead of days
- Balance hero number should be the biggest text on the finance page — this is the "what do I have right now" anchor
- Income cards should feel like win cards in the Today view — cards you interact with by toggling state
- The ₱350 source app has `formatCurrencyPhp()` in `lib/domain/finance.ts` — reuse the formatting logic
- Circular gauge should be monochrome (not colored) to match Nothing aesthetic — use foreground opacity levels like the heatmap

</specifics>

<deferred>
## Deferred Ideas

- Year overview with 12-month trajectory — Phase 4 (FIN-05)
- Waterfall view showing balance cascade as bills are paid — Phase 4 (FIN-02)
- Past month read-only view with historical data — Phase 4 (FIN-03)
- Future month projections — Phase 4 (FIN-04)
- Bills management — Phase 4 (BILL-01..07)
- External balances (Polymarket, SOL DCA) — Phase 4 (EXT-01..03)

</deferred>

---

*Phase: 03-finance-core*
*Context gathered: 2026-03-17*
