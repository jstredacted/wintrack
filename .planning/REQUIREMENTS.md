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

- [ ] **AUTH-01**: User can set a 4-digit PIN on first app load (setup flow with confirm)
- [ ] **AUTH-02**: User must enter PIN on app load; active sessions stay unlocked until 15 minutes idle
- [x] **AUTH-03**: PIN stored as SHA-256 hash in Supabase (not plaintext)
- [x] **AUTH-04**: Session persists in sessionStorage; idle timer resets on user interaction
- [ ] **AUTH-05**: App access gated behind PIN entry (JWT retained for Supabase RLS, but not user-facing)

### Finance: Balance

- [ ] **BAL-01**: User sees current balance as the single source of truth ("what I have right now")
- [ ] **BAL-02**: User can manually override current balance at any time
- [ ] **BAL-03**: When income is marked received, net PHP amount auto-adds to current balance
- [ ] **BAL-04**: When a bill/expense is marked paid, amount auto-deducts from current balance
- [ ] **BAL-05**: Current balance carries forward to next month as starting point

### Finance: Budget

- [ ] **BUD-01**: User can set a monthly budget limit
- [ ] **BUD-02**: User sees budget progress visualization showing total paid expenses vs budget limit (neutral/approaching/critical states)

### Finance: Income Streams

- [ ] **INC-01**: User can configure income sources in Settings with name, amount, currency (USD or PHP), and conversion method (Wise/PayPal/None)
- [ ] **INC-02**: User can set expected payday (day of month) per income source
- [ ] **INC-03**: Each income source appears as a toggleable card in the Finance view per month
- [ ] **INC-04**: When toggled as received, USD sources auto-fetch live rate and deduct Wise/PayPal fees; PHP sources add directly
- [ ] **INC-05**: Received income auto-adds net PHP amount to current balance; toggle greys out the card
- [ ] **INC-06**: User can add, edit, and remove income sources from Settings

### Finance: Bills

- [ ] **BILL-01**: User can add a bill with name, amount, due date, and recurrence type (one-time / recurring for N months / recurring until end date / ongoing)
- [ ] **BILL-02**: User can toggle a bill as paid per month (deducts from current balance)
- [ ] **BILL-03**: User can edit and delete bills
- [ ] **BILL-04**: Recurring and ongoing bills automatically appear each month until their end condition
- [ ] **BILL-05**: User sees unpaid bills highlighted by due date urgency
- [ ] **BILL-06**: One-time bills disappear after being paid
- [ ] **BILL-07**: Recurring bills show remaining months/payments

### Finance: Dashboard

- [ ] **FIN-01**: MonthStrip navigation to move between months (past shows history, future shows projections)
- [ ] **FIN-02**: Current month waterfall view — balance cascading as each bill/expense is paid, showing remaining after each
- [ ] **FIN-03**: Past months show final balance, paid bills, income received (read-only)
- [ ] **FIN-04**: Future months show projected balance (expected income minus upcoming bills)
- [ ] **FIN-05**: Year overview showing 12 months with balance trajectory, total income, total expenses

### Finance: External Balances

- [ ] **EXT-01**: User can manually enter current Polymarket Bot balance
- [ ] **EXT-02**: User can manually enter current SOL DCA balance
- [ ] **EXT-03**: External balances display alongside current cash balance for total net worth view

### Journal Rich Text

- [ ] **JRNL-01**: User can format journal entries with bold, italic, bullet lists, numbered lists, and headings (H2, H3)
- [ ] **JRNL-02**: Formatting via keyboard shortcuts only (Cmd+B, Cmd+I, etc.) — no visible toolbar
- [ ] **JRNL-03**: Existing plain-text journal entries render correctly after migration (backward compatible)
- [ ] **JRNL-04**: Journal content stored as HTML in Supabase with body_format column for migration safety

### Mobile Responsiveness

- [ ] **MOB-01**: All pages usable on iPhone 15 Pro Max viewport (430px width)
- [ ] **MOB-02**: SideNav collapses to bottom tab bar on mobile widths
- [ ] **MOB-03**: Touch targets minimum 44x44px on all interactive elements
- [ ] **MOB-04**: No horizontal scroll on any page at mobile widths
- [ ] **MOB-05**: Finance pages responsive with stacked layout on mobile
- [ ] **MOB-06**: DayStrip centers the current/selected day with carousel scrolling left (past) and right (future)
- [ ] **MOB-07**: Fix DayStrip/header date mismatch when dayStartHour offset is active (off-by-one between strip dates and displayed date)

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
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 2 | Complete |
| AUTH-04 | Phase 2 | Complete |
| AUTH-05 | Phase 2 | Pending |
| BAL-01 | Phase 3 | Pending |
| BAL-02 | Phase 3 | Pending |
| BAL-03 | Phase 3 | Pending |
| BAL-04 | Phase 3 | Pending |
| BAL-05 | Phase 3 | Pending |
| BUD-01 | Phase 3 | Pending |
| BUD-02 | Phase 3 | Pending |
| INC-01 | Phase 3 | Pending |
| INC-02 | Phase 3 | Pending |
| INC-03 | Phase 3 | Pending |
| INC-04 | Phase 3 | Pending |
| INC-05 | Phase 3 | Pending |
| INC-06 | Phase 3 | Pending |
| FIN-01 | Phase 3 | Pending |
| BILL-01 | Phase 4 | Pending |
| BILL-02 | Phase 4 | Pending |
| BILL-03 | Phase 4 | Pending |
| BILL-04 | Phase 4 | Pending |
| BILL-05 | Phase 4 | Pending |
| BILL-06 | Phase 4 | Pending |
| BILL-07 | Phase 4 | Pending |
| FIN-02 | Phase 4 | Pending |
| FIN-03 | Phase 4 | Pending |
| FIN-04 | Phase 4 | Pending |
| FIN-05 | Phase 4 | Pending |
| EXT-01 | Phase 4 | Pending |
| EXT-02 | Phase 4 | Pending |
| EXT-03 | Phase 4 | Pending |
| JRNL-01 | Phase 5 | Pending |
| JRNL-02 | Phase 5 | Pending |
| JRNL-03 | Phase 5 | Pending |
| JRNL-04 | Phase 5 | Pending |
| MOB-01 | Phase 5 | Pending |
| MOB-02 | Phase 5 | Pending |
| MOB-03 | Phase 5 | Pending |
| MOB-04 | Phase 5 | Pending |
| MOB-05 | Phase 5 | Pending |
| MOB-06 | Phase 5 | Pending |
| MOB-07 | Phase 5 | Pending |

**Coverage:**
- v2.0 requirements: 51 total
- Mapped to phases: 51
- Unmapped: 0

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after roadmap creation*
