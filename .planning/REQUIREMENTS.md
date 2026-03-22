# Requirements: wintrack

**Defined:** 2026-03-16
**Core Value:** The daily discipline loop: set intentions in the morning, complete them through the day, reflect honestly at night — now expanded with personal finance management.

## v2.0 Requirements

Requirements for v2.0 Finance & Platform milestone. Each maps to roadmap phases.

### Dev Workflow

- [x] **DW-01**: Develop branch created from main as primary development branch
- [x] **DW-02**: Dev tools (DevToolsPanel, Ctrl+Shift+D) only render on develop branch, stripped from main
- [x] **DW-03**: Vite dev server runs with `--host` for mobile testing on local network

### TypeScript

- [x] **TS-01**: All existing .jsx/.js source files converted to .tsx/.ts
- [x] **TS-02**: Supabase database types generated for all tables
- [x] **TS-03**: All new code written in TypeScript from day one
- [x] **TS-04**: tsconfig.json configured with strict mode enabled after full migration

### Authentication

- [x] **AUTH-01**: User can set a 4-digit PIN on first app load (setup flow with confirm)
- [x] **AUTH-02**: User must enter PIN on app load; active sessions stay unlocked until 15 minutes idle
- [x] **AUTH-03**: PIN stored as SHA-256 hash in Supabase (not plaintext)
- [x] **AUTH-04**: Session persists in sessionStorage; idle timer resets on user interaction
- [x] **AUTH-05**: App access gated behind PIN entry (JWT retained for Supabase RLS, but not user-facing)

### Finance: Balance

- [x] **BAL-01**: User sees current balance as the single source of truth ("what I have right now")
- [x] **BAL-02**: User can manually override current balance at any time
- [x] **BAL-03**: When income is marked received, net PHP amount auto-adds to current balance
- [x] **BAL-04**: When a bill/expense is marked paid, amount auto-deducts from current balance
- [x] **BAL-05**: Current balance carries forward to next month as starting point

### Finance: Budget

- [x] **BUD-01**: User can set a monthly budget limit
- [x] **BUD-02**: User sees budget progress visualization showing total paid expenses vs budget limit (neutral/approaching/critical states)

### Finance: Income Streams

- [x] **INC-01**: User can configure income sources in Settings with name, amount, currency (USD or PHP), and conversion method (Wise/PayPal/None)
- [x] **INC-02**: User can set expected payday (day of month) per income source
- [x] **INC-03**: Each income source appears as a toggleable card in the Finance view per month
- [x] **INC-04**: When toggled as received, USD sources auto-fetch live rate and deduct Wise/PayPal fees; PHP sources add directly
- [x] **INC-05**: Received income auto-adds net PHP amount to current balance; toggle greys out the card
- [x] **INC-06**: User can add, edit, and remove income sources from Settings

### Finance: Bills

- [x] **BILL-01**: User can add a bill with name, amount, due date, and recurrence type (one-time / recurring for N months / recurring until end date / ongoing)
- [x] **BILL-02**: User can toggle a bill as paid per month (deducts from current balance)
- [ ] **BILL-03**: User can edit and delete bills
- [x] **BILL-04**: Recurring and ongoing bills automatically appear each month until their end condition
- [x] **BILL-05**: User sees unpaid bills highlighted by due date urgency
- [x] **BILL-06**: One-time bills disappear after being paid
- [x] **BILL-07**: Recurring bills show remaining months/payments

### Finance: Dashboard

- [x] **FIN-01**: MonthStrip navigation to move between months (past shows history, future shows projections)
- [x] **FIN-02**: Current month waterfall view — balance cascading as each bill/expense is paid, showing remaining after each
- [x] **FIN-03**: Past months show final balance, paid bills, income received (read-only)
- [x] **FIN-04**: Future months show projected balance (expected income minus upcoming bills)
- [ ] **FIN-05**: Year overview showing 12 months with balance trajectory, total income, total expenses

### Finance: Balance History

- [x] **HIST-01**: Every manual balance override is recorded with timestamp and amount change
- [x] **HIST-02**: Finance page shows last change indicator (e.g., "+₱30,000 from last change") next to balance
- [x] **HIST-03**: User can open a history modal showing all balance changes with dates and amounts
- [x] **HIST-04**: User can delete a balance change entry, reverting balance to the previous value

### Finance: One-Off Income

- [x] **ONEOFF-01**: User can add a one-off income entry with amount, date, and note (e.g., "Debt paid by John", "Year-end bonus")
- [x] **ONEOFF-02**: One-off income adds to current balance when recorded
- [x] **ONEOFF-03**: One-off income appears as an extended segment on the year overview progress bar (beyond regular income)
- [x] **ONEOFF-04**: User can edit and delete one-off income entries

### Finance: External Balances (Deferred to v2.1)

~~- [ ] **EXT-01**: User can manually enter current Polymarket Bot balance~~
~~- [ ] **EXT-02**: User can manually enter current SOL DCA balance~~
~~- [ ] **EXT-03**: External balances display alongside current cash balance for total net worth view~~

### Journal Rich Text

- [x] **JRNL-01**: User can format journal entries with bold, italic, bullet lists, numbered lists, and headings (H2, H3)
- [x] **JRNL-02**: Formatting via keyboard shortcuts only (Cmd+B, Cmd+I, etc.) — no visible toolbar
- [x] **JRNL-03**: Existing plain-text journal entries render correctly after migration (backward compatible)
- [x] **JRNL-04**: Journal content stored as HTML in Supabase with body_format column for migration safety
- [x] **JRNL-05**: Journal count summary — per-month entry count on Finance/Year overview and total for the year

### Mobile Responsiveness

- [x] **MOB-01**: All pages usable on iPhone 15 Pro Max viewport (430px width)
- [x] **MOB-02**: SideNav collapses to bottom tab bar on mobile widths
- [x] **MOB-03**: Touch targets minimum 44x44px on all interactive elements
- [x] **MOB-04**: No horizontal scroll on any page at mobile widths
- [x] **MOB-05**: Finance pages responsive with stacked layout on mobile
- [x] **MOB-06**: DayStrip centers the current/selected day with carousel scrolling left (past) and right (future)
- [x] **MOB-07**: Fix DayStrip/header date mismatch when dayStartHour offset is active (off-by-one between strip dates and displayed date)
- [x] **MOB-08**: Fix consistency heatmap NaN wins count and incorrect intensity when dayStartHour offset is active
- [x] **MOB-09**: Fix rollover prompting for already-completed wins when completed after midnight but before dayStartHour boundary
- [x] **MOB-10**: Layout consistency audit — constrain all page content widths, align heatmap and category radar, cap card/list widths universally across all pages (Settings, Finance, Today, Journal) so nothing stretches edge-to-edge on desktop

## Future Requirements

### v2.1 — Bots & Investments

- **INV-01**: SOL DCA bot API integration (auto-fetch balance and transactions)
- **INV-02**: Polymarket bot API integration (current PnL, pending bets)
- **INV-03**: Investment allocation tracking with target percentages
- **BIO-01**: Biometric authentication (WebAuthn fingerprint/face as PIN alternative)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Transaction logging | User doesn't track individual transactions — balance override model |
| Bank sync | No automatic import from banks |
| Multi-currency display | PHP only as display currency; USD→PHP conversion at salary receipt only |
| Receipt scanning | No camera/OCR |
| Biometric auth | PIN only for v2.0; WebAuthn deferred to v2.1 |
| Investment allocation | Deferred to v2.1 — SOL DCA bot + Polymarket API planned |
| Bento grid layout | Finance UI follows wintrack's existing Nothing Phone aesthetic |
| Envelope budgeting | Balance override model, not YNAB-style envelopes |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DW-01 | Phase 1 | Complete |
| DW-02 | Phase 1 | Complete |
| DW-03 | Phase 1 | Complete |
| TS-01 | Phase 1 | Complete |
| TS-02 | Phase 1 | Complete |
| TS-03 | Phase 1 | Complete |
| TS-04 | Phase 1 | Complete |
| AUTH-01 | Phase 2 | Complete |
| AUTH-02 | Phase 2 | Complete |
| AUTH-03 | Phase 2 | Complete |
| AUTH-04 | Phase 2 | Complete |
| AUTH-05 | Phase 2 | Complete |
| BAL-01 | Phase 3 | Complete |
| BAL-02 | Phase 3 | Complete |
| BAL-03 | Phase 3 | Complete |
| BAL-04 | Phase 3 | Complete |
| BAL-05 | Phase 3 | Complete |
| BUD-01 | Phase 3 | Complete |
| BUD-02 | Phase 3 | Complete |
| INC-01 | Phase 3 | Complete |
| INC-02 | Phase 3 | Complete |
| INC-03 | Phase 3 | Complete |
| INC-04 | Phase 3 | Complete |
| INC-05 | Phase 3 | Complete |
| INC-06 | Phase 3 | Complete |
| FIN-01 | Phase 3 | Complete |
| BILL-01 | Phase 4 | Complete |
| BILL-02 | Phase 4 | Complete |
| BILL-03 | Phase 6 | Pending |
| BILL-04 | Phase 4 | Complete |
| BILL-05 | Phase 4 | Complete |
| BILL-06 | Phase 4 | Complete |
| BILL-07 | Phase 4 | Complete |
| FIN-02 | Phase 4 | Complete |
| FIN-03 | Phase 4 | Complete |
| FIN-04 | Phase 4 | Complete |
| FIN-05 | Phase 6 | Pending |
| HIST-01 | Phase 4 | Complete |
| HIST-02 | Phase 4 | Complete |
| HIST-03 | Phase 4 | Complete |
| HIST-04 | Phase 4 | Complete |
| ONEOFF-01 | Phase 4 | Complete |
| ONEOFF-02 | Phase 4 | Complete |
| ONEOFF-03 | Phase 4 | Complete |
| ONEOFF-04 | Phase 4 | Complete |
| JRNL-01 | Phase 5 | Complete |
| JRNL-02 | Phase 5 | Complete |
| JRNL-03 | Phase 5 | Complete |
| JRNL-04 | Phase 5 | Complete |
| JRNL-05 | Phase 5 | Complete |
| MOB-01 | Phase 5 | Complete |
| MOB-02 | Phase 5 | Complete |
| MOB-03 | Phase 5 | Complete |
| MOB-04 | Phase 5 | Complete |
| MOB-05 | Phase 5 | Complete |
| MOB-06 | Phase 5 | Complete |
| MOB-07 | Phase 5 | Complete |
| MOB-08 | Phase 5 | Complete |
| MOB-09 | Phase 5 | Complete |
| MOB-10 | Phase 5 | Complete |

**Coverage:**
- v2.0 requirements: 60 total
- Mapped to phases: 60
- Unmapped: 0

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after roadmap creation*
