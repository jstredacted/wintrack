# Feature Research

**Domain:** Personal finance — continuous ledger timeline, budget spending caps, recurring debt tracking, fixed sidebar (wintrack v2.1)
**Researched:** 2026-03-23
**Confidence:** MEDIUM (patterns drawn from Monarch Money, Copilot Money, YNAB, Undebt.it, Kualto; WebSearch verified; no WebFetch available for deep page scraping)

---

## Context: What Already Exists (v2.0)

These are BUILT and must be preserved or migrated — not rebuilt from scratch:

- Monthly MonthBarrel navigation (< Month > arrows, query param deep-linking)
- Balance display with manual edit + balance change history + revert
- Bills with recurrence (one-time, recurring, ongoing) + bill edit/delete
- Income sources with currency conversion (Wise/PayPal fees) + one-off income
- Budget progress bar (single per-month spending limit)
- Year overview page with 12-month grid, sparkline, journal count

The v2.1 milestone replaces the month-navigation model with a continuous timeline. All existing data schemas must be migrated, not discarded.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that users assume exist in a ledger-style finance view. Missing = feels broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Continuous scrollable timeline | Apps like Copilot Money organize transactions by day in a single scrollable list — users expect to scroll up for history, not navigate "months" like pages | MEDIUM | Replace MonthBarrel nav with a vertical timeline. Current month at top (or anchored), past months above. This is the central architectural change of v2.1 |
| Collapsible past-month sections | Past months should be accessible but not dominate the view. Accordion pattern with "Mar 2026", "Feb 2026" headers that expand/collapse is the standard | MEDIUM | shadcn/ui Accordion component is the right primitive. Past months default-collapsed, current month default-expanded |
| Past months read-only | Closed months should not allow edits — data integrity. YNAB and Monarch lock closed periods | LOW | Visual indicator (lock icon or greyed header). Clicks on past entries open a detail view, not an edit form |
| Four distinct expense categories | Budget apps distinguish expense types: fixed recurring (rent), variable recurring (subscriptions/debts), one-off (spontaneous), budget envelopes (groceries cap). Users need to understand "what kind of spending is this?" | MEDIUM | Four categories map directly to the v2.1 spec: fixed monthly, recurring debts, one-off, budgets. Separate visual sections within each month |
| Balance carried forward | End-of-month balance becomes start of next month. Users expect continuity — the "running total" mental model | MEDIUM | This is the core ledger primitive. Each month section shows opening balance, inflows, outflows, closing balance. Closing balance feeds next month opening |
| Projected end-of-month balance | Users want to know "if I pay all my bills this month, what will I have left?" Kualto and Monarch both surface this prominently | LOW | Simple calculation: current balance + remaining expected income - unpaid fixed bills - remaining budget caps. Display in sidebar panel |
| Spending progress per budget category | A bar or fill indicator per budget envelope (e.g., "Food: $340 / $500"). Table stakes across YNAB, Monarch, Copilot | LOW | Existing single progress bar extends to per-category bars. Each "budget" item gets its own cap + spent indicator |
| Quick expense log for budgets | The tap-to-add flow for logging a spend against a budget category. Fast Budget and Spendee both make this the primary interaction | MEDIUM | Inline "+" button per budget category opens a small popover/drawer: amount + optional note. Not a full form |
| Recurring debt with remaining balance | Users track loans/credit with principal remaining, minimum payment, and ability to log flexible extra payments. Undebt.it and Debt Payoff Planner are dedicated apps for this | MEDIUM | Each recurring debt entry stores: name, total_principal, current_balance, minimum_payment, interest_rate (optional). Payments reduce current_balance |
| Flexible payment above minimum | For debts, users want to log "I paid $500 this month instead of the $200 minimum." Undebt.it calls these "debt snowflakes" | LOW | Payment input accepts any amount >= 0, no minimum enforcement. Logs against the debt for that month, reduces remaining balance |

### Differentiators (Competitive Advantage)

Features that distinguish wintrack's finance view from generic budget apps.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Fixed sidebar with live balance + projections | Most mobile finance apps collapse their overview into a collapsible header or separate dashboard page. A persistent sidebar on desktop gives instant context without navigation. Kualto pioneered cash-flow-forward projection in a panel | MEDIUM | Left-anchored sidebar (desktop only): current balance, projected EOM balance, year overview table (12-month sparkline). Mobile: collapses to a sticky header bar above the timeline |
| Year overview table in sidebar | The existing year overview page surfaced as a compact table within the sidebar makes it persistent context without requiring navigation | LOW | Reuse existing year overview data/queries, just render in a compact sidebar layout. 12 rows, 3 cols: month, balance, income |
| Debt payoff progress as timeline artifact | Showing debt remaining balance as a diminishing bar within the timeline, rather than a separate "debt tracker" page, keeps it in context with monthly spending | LOW | Within each month's "recurring debts" section, each debt card shows a balance progress bar (remaining / original). Not a roadmap to payoff date — just current state |
| `#7CF5A5` accent throughout | Monochrome + one accent color is a distinctive design signature. Checkmarks, active states, balance numbers, progress fills — all use the same accent. Rare in personal finance apps which tend toward blue/green palettes | LOW | CSS variable `--color-accent: #7CF5A5`. Replace current focus rings, active nav items, completion checkmarks. One pass across all components |
| Integrated discipline + finance | No other personal tool puts daily wins and financial health on the same screen. The journal "Financial" category entries can appear in context alongside the month they belong to | LOW | Optional: surface journal entries tagged "Financial" as a callout card within the relevant month section of the timeline |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Debt payoff projections (payoff date, interest total) | Users want to see "you'll be debt-free in 14 months." Undebt.it's core feature | Requires accurate interest rate input, consistent payment modeling, and recalculation on every payment. Adds significant complexity and surface for confusion when reality diverges from projection | Show remaining balance and let users draw their own conclusions. Simple is honest |
| Infinite scroll with all historical data | Feels like a complete ledger — all history always available | Very old months create DOM bloat and slow renders. More importantly, users don't actually read 18-month-old data during normal use | Collapsible month accordion handles this — collapsed months are in DOM as headers only, content renders on expand |
| Automatic category assignment for budgets | ML-style "this looks like groceries" | Requires training data and will misclassify. Worse than no suggestion for a personal tool | User manually selects the budget category on quick-log. Four categories is small enough that selection is instant |
| Shared budget views (family mode) | Multi-user seems natural for household budgets | Single-user is a core constraint and simplifies everything. Shared state = conflicts, sync complexity, auth overhead | Out of scope per PROJECT.md. Single-user, PIN-gated |
| Debt avalanche/snowball automated strategies | Automatically redistribute extra payments across debts | Requires user to fully commit and not deviate. Personal tool should let the user decide where extra money goes | User logs any payment against any debt. No automated redistribution |
| Category carryover/rollover between months | YNAB's "age your money" — unspent budget rolls to next month | Adds state machine complexity (what rolled from where?) and makes monthly summaries misleading | Hard monthly resets. Budget caps are per-month. Simple, clean |

---

## Feature Dependencies

```
[Continuous Timeline Layout]
    -- requires --> [Database migration: month_settings, bills to support timeline queries]
    -- requires --> [Balance carry-forward logic]
    -- enhances --> [Fixed sidebar projections] (sidebar reads same calculated balances)

[Collapsible Month Sections]
    -- requires --> [Continuous Timeline Layout]
    -- uses --> [shadcn/ui Accordion primitive]

[Four Expense Categories]
    -- requires --> [Database schema: category field on expense records]
    -- replaces --> [Existing single budget progress bar]
    -- enables --> [Budget spending caps with quick-log]

[Budget Spending Caps + Quick-Log]
    -- requires --> [Four Expense Categories]
    -- requires --> [Per-category progress bars]
    -- depends on --> [Quick-log popover/drawer component]

[Recurring Debt Tracking]
    -- NEW table --> [debts: name, original_balance, current_balance, minimum_payment]
    -- NEW table --> [debt_payments: debt_id, month, amount, paid_at]
    -- independent of --> [Budget categories] (separate data model)
    -- enhances --> [Balance carry-forward] (debt payments affect monthly outflow)

[Fixed Sidebar]
    -- requires --> [Balance carry-forward logic] (to show projected EOM)
    -- reads --> [Year overview data] (existing query, new render location)
    -- desktop only --> [Responsive: collapses to sticky header on mobile]

[App-Wide #7CF5A5 Accent]
    -- independent --> [Can be applied in a single CSS pass]
    -- cross-cutting --> [All components: nav active states, checkmarks, progress fills, balance numbers]

[Responsive Two-Panel Layout]
    -- requires --> [Fixed sidebar implementation]
    -- requires --> [Mobile card stack fallback for sidebar content]
    -- last --> [Apply after all feature components exist]
```

### Dependency Notes

- **Balance carry-forward requires timeline layout:** The running total calculation depends on months being ordered and linked, not independently navigated. This is why the MonthBarrel pattern must be replaced before carry-forward can be implemented.
- **Recurring debt is independent:** Debt tracking has its own tables and doesn't conflict with or require budget categories. Can be built in parallel.
- **Accent color is a final pass:** `#7CF5A5` replacement is non-functional. Do it last to avoid re-work as new components are built.
- **Collapsible past months requires read-only state:** The read-only enforcement must be in the data layer (not just UI) so that past month queries return non-editable shapes.

---

## MVP Definition

This is a milestone, not a v1 — "MVP" here means "minimum to ship v2.1 as complete."

### Ship With (v2.1)

- [ ] Continuous timeline replacing MonthBarrel navigation — the core UX shift
- [ ] Collapsible past-month sections (accordion, default-closed) — manages visual density
- [ ] Four expense categories with per-category sections — structural change
- [ ] Budget spending caps with quick-log expense entry — replaces single progress bar
- [ ] Recurring debt tracking: name, remaining balance, flexible payment logging — new feature
- [ ] Fixed sidebar with balance + projected EOM balance — desktop two-panel layout
- [ ] Balance carry-forward (closing balance feeds next month opening) — ledger integrity
- [ ] App-wide `#7CF5A5` accent color pass — visual identity milestone

### Add After If Time Permits (v2.1.x)

- [ ] Journal "Financial" entries surfaced within timeline month sections — low effort, high coherence
- [ ] Debt balance progress bar (remaining/original) within debt card — visual polish
- [ ] Year overview compact table in sidebar (vs. separate page navigation) — reduce nav burden

### Future Consideration (v2.2+)

- [ ] Debt payoff date projection — requires interest rate input and careful UX to avoid misleading projections
- [ ] Budget rollover (intentionally deferred, adds state complexity)
- [ ] Export/import of ledger data

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Continuous timeline layout | HIGH | MEDIUM | P1 |
| Collapsible past months | HIGH | LOW | P1 |
| Four expense categories | HIGH | MEDIUM | P1 |
| Budget spending caps + quick-log | HIGH | MEDIUM | P1 |
| Recurring debt tracking | HIGH | MEDIUM | P1 |
| Balance carry-forward | HIGH | MEDIUM | P1 |
| Fixed sidebar (desktop) | MEDIUM | MEDIUM | P1 |
| App-wide accent color | MEDIUM | LOW | P1 |
| Past-months read-only enforcement | MEDIUM | LOW | P1 |
| Projected EOM balance | MEDIUM | LOW | P2 |
| Year overview in sidebar | LOW | LOW | P2 |
| Financial journal entries in timeline | LOW | LOW | P3 |
| Debt balance progress bar | LOW | LOW | P3 |

**Priority key:**
- P1: Required to call v2.1 "done"
- P2: Should ship with v2.1, add after P1 items are stable
- P3: Nice polish, only if time permits

---

## Competitor Feature Analysis

| Feature | YNAB | Monarch Money | Copilot Money | wintrack v2.1 Approach |
|---------|------|---------------|---------------|------------------------|
| Timeline organization | Month-based with budget view | Month-based with flex/category budgets | Scrollable transactions grouped by day | Continuous timeline with collapsible month accordion |
| Budget categories | Envelope system (assign every dollar) | ~60 categories, flex or category mode | Automatic + manual categorization | Four explicit types: fixed, debt, one-off, budgets |
| Spending caps | Per-category envelope limits | Per-category spending limits with progress bars | Budget targets with alerts | Per-budget-item spending cap + quick-log |
| Debt tracking | YNAB has a "debt" category type | Liability tracking in net worth view | Not primary focus | Explicit recurring debt section: balance, min payment, flexible payments |
| Sidebar/panel layout | Full left sidebar (web) | Full left sidebar (web) | Transactions focused, sidebar nav | Fixed right sidebar: balance, projection, year overview |
| Past periods | Locked months, read-only | Previous months navigable, not editable | All transactions scrollable | Collapsed past months, read-only on expand |
| Balance projection | "Assigned" amount vs income | Cash flow forecast in Goals | Not prominent | Projected EOM balance in sidebar |

---

## Sources

- [YNAB vs. Monarch vs. Copilot vs. WalletHub (2026)](https://wallethub.com/edu/b/ynab-vs-monarch-vs-copilot-vs-wallethub/150687) — feature comparison across leading budgeting apps
- [Monarch Money Budget Features](https://www.monarchmoney.com/features/budget) — category budgeting vs flex budgeting distinction
- [Copilot Money Review 2026 (Money with Katie)](https://moneywithkatie.com/copilot-review-a-budgeting-app-that-finally-gets-it-right/) — transaction ledger UX and design patterns
- [Kualto Forecast Budgeting](https://www.kualto.com/) — balance projection and forward-looking cash flow panel
- [Undebt.it Debt Tracker](https://undebt.it/) — flexible payment ("debt snowflakes"), remaining balance display
- [Debt Payoff Planner Overview](https://www.debtpayoffplanner.com/overview/) — minimum payment + extra payment UI patterns
- [Best Debt Payoff Apps 2026 (InCharge)](https://www.incharge.org/tools-resources/best-debt-payoff-apps/) — common debt tracker features and UX patterns
- [How Great Budget App Design Increases User Retention (Onething Design)](https://www.onething.design/post/budget-app-design) — quick expense entry, retention patterns
- [Budget App Design Tips (Eleken)](https://www.eleken.co/blog-posts/budget-app-design) — spending cap + notification patterns
- [Accordion UI Best Practices (Eleken)](https://www.eleken.co/blog-posts/accordion-ui) — collapsible section patterns and animation guidance
- [State of Personal Finance Apps 2025 (Bountisphere)](https://bountisphere.com/blog/personal-finance-apps-2025-review) — overall market landscape

---

*Feature research for: wintrack v2.1 — Finance redesign, continuous ledger timeline, recurring debt, fixed sidebar*
*Researched: 2026-03-23*
