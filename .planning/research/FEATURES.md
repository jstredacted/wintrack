# Feature Landscape

**Domain:** Personal finance management, rich text journaling, PIN authentication, mobile responsiveness -- integrated into personal accountability tracker (wintrack v2.0)
**Researched:** 2026-03-16
**Confidence:** HIGH (finance patterns validated against YNAB, Monarch Money, PocketGuard, Goodbudget; editor validated against Tiptap docs; PIN patterns from PWA best practices)

---

## Table Stakes

Features users expect once a finance module exists. Missing = feels incomplete or broken.

### Finance: Budget Tracking

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Month-based budget view | Every budget app organizes by month -- users think in monthly cycles (rent, salary, bills). Without this the finance section has no temporal anchor | LOW | Single month at a time with nav arrows. Match existing DayStrip pattern of temporal navigation |
| Starting cash / current balance | Users need to know "what do I have right now?" before anything else. Goodbudget and YNAB both open with balance | LOW | Manual entry per month. No bank sync (out of scope for personal tool) |
| Budget limit with visual progress | The "how much have I spent vs how much can I spend" bar is universal across YNAB, PocketGuard, Monarch Money. Without it, budget tracking is just a list of numbers | LOW | Simple progress bar or pulse visualization. The existing "budget pulse" concept from the source app covers this |
| Expected salary / income tracking | Users set a monthly income expectation so they can see budget vs actual. EveryDollar, YNAB, Goodbudget all require income as first step | LOW | Single field per month. Salary toggle (received yes/no) is the idempotent pattern from the source app |
| Transaction CRUD (add/edit/delete) | Core data entry. Users must log expenses and income. Without this the budget is fiction | MEDIUM | Form with amount, description, type, date. Types: expense/income/investment/transfer. Manual entry only -- no bank sync |
| Transaction categorization | Every finance app categorizes spending (food, transport, utilities, etc.). Users expect to see "where did my money go" | LOW | Freeform text category or predefined set. Keep it simple -- the source app likely had a fixed set |
| Expense vs income distinction | Users need to know money in vs money out. Every app separates these visually | LOW | Transaction type field. Color or icon differentiation in lists |

### Finance: Bill Management

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Bill list with due dates | Users track recurring obligations (rent, utilities, subscriptions). TimelyBills, Monarch Money, PocketGuard all show bills as a dated list | LOW | Name, amount, due date (day of month), paid status per month |
| Paid/unpaid toggle per month | The core interaction -- "did I pay this bill?" Feels identical to the win completion toggle already in wintrack | LOW | Binary toggle per bill per month. Direct parallel to win completion UX |
| Recurring bill rollover | Bills recur monthly by default. Users expect bills to automatically appear in next month without re-entering them | MEDIUM | When a new month starts, unpaid bills from template carry forward. Source app has this pattern |
| Due date visibility (upcoming/overdue) | Users need to see what's coming up and what's late. Every bill tracker highlights overdue items | LOW | Sort by due date, visual indicator for past-due |

### Finance: Investment Allocation

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Account list with current amounts | Users track money across ETF, crypto, savings, etc. Rebalancer and Empower both show account-level balances | LOW | Manual entry of account name + current value |
| Target allocation percentages | Users set desired portfolio split (e.g., 60% ETF, 30% crypto, 10% cash). This is the core value prop of allocation tracking | LOW | Percentage per account that sums to 100% |
| Current vs target comparison | Users need to see drift -- "am I over-allocated in crypto?" Rebalancer's core feature is showing deviation from target | MEDIUM | Visual comparison (bar chart or simple table) of actual % vs target % |

### Finance: Dashboard

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Cash overview (total liquid) | Users want one number: "how much cash do I have across all accounts?" | LOW | Sum of starting cash minus expenses plus income |
| Monthly summary (spent/remaining) | The top-level "how am I doing this month" signal. Every budget app shows this prominently | LOW | Budget limit minus total expenses = remaining |

### Rich Text Journal

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Bold and italic formatting | Absolute baseline for any "rich text" claim. Users expect Cmd+B and Cmd+I | LOW | Tiptap StarterKit includes both out of the box |
| Bullet and numbered lists | Second most expected formatting. Journal entries naturally contain lists | LOW | Tiptap StarterKit includes both |
| Headings (H2, H3) | Users structure longer entries with sections. Bear, Notion, Apple Notes all support headings | LOW | Tiptap StarterKit includes headings |
| Keyboard shortcuts | Cmd+B for bold, Cmd+I for italic, etc. Users from any text editor expect these | LOW | Tiptap provides these by default with StarterKit |
| Backward-compatible rendering | Existing plain-text journal entries must still display correctly after migration to rich text | MEDIUM | Treat plain text as paragraphs. Tiptap can render plain strings as content |

### PIN Authentication

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| PIN entry screen on app open | The whole point -- gate access to personal data. Users expect a lock screen before any content shows | MEDIUM | Full-screen overlay with 4-6 digit PIN input. Blocks all routes until authenticated |
| PIN setup flow (first time) | User must create their PIN. Confirm-twice pattern is standard | LOW | Enter PIN, confirm PIN, save |
| PIN stored securely | Users expect their lock to actually work. PIN hash stored in Supabase, session token in memory/localStorage | MEDIUM | bcrypt or SHA-256 hash server-side. Session timeout configurable |
| Session persistence (don't ask on every page) | Users don't want to re-enter PIN on every navigation. Session should persist for reasonable duration | LOW | Session token with TTL (e.g., 30 min idle timeout). Store in memory or sessionStorage |

### Mobile Responsiveness

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Touch-friendly tap targets | Buttons and interactive elements must be easily tappable (44x44px minimum) | MEDIUM | Audit all existing components. shadcn/ui buttons are generally fine, but custom elements may need adjustment |
| Responsive layout at 320-428px | App must work on iPhone SE through iPhone Pro Max. Current max-w-[1100px] centered layout should scale down | MEDIUM | Existing Tailwind responsive prefixes (sm:, lg:) are partially used. Need comprehensive pass |
| No horizontal scroll | Content must fit viewport width. Tables and wide layouts must adapt | LOW | Audit finance tables/grids for overflow |
| Viewport meta tag correct | PWA must declare viewport correctly for mobile rendering | LOW | Should already exist from vite-plugin-pwa setup |

### TypeScript Migration

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Gradual .jsx to .tsx conversion | TypeScript adds safety to a growing codebase. Standard practice for v2+ codebases | HIGH | ~50+ files to convert. Can be done incrementally -- new files in TS, migrate existing file-by-file |
| Type definitions for Supabase schema | Database types generated from schema ensure data layer safety | MEDIUM | Use Supabase CLI `gen types` or manual type definitions matching migration schema |
| Strict mode eventually | Full strict TypeScript catches the most bugs | LOW | Start with basic TS (no strict), enable strict after full migration |

---

## Differentiators

Features that set wintrack's finance module apart from generic finance apps. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Unified accountability + finance in one app | No other personal tool combines daily win tracking with budget management. Users get "life dashboard" not just "finance app" | LOW | Architecture benefit -- shared Supabase, shared design system, shared navigation. The integration IS the differentiator |
| Budget pulse visualization | A visual heartbeat/progress indicator instead of a boring progress bar. The source app's signature element | MEDIUM | Custom SVG or canvas animation. Fits the Nothing Phone aesthetic if done in monochrome |
| Financial journal category integration | Journal entries tagged "Financial" can appear alongside budget data, creating narrative context for spending decisions | LOW | Already exists -- journal_entries has `category = 'financial'`. Just surface these entries in the finance dashboard |
| Investment drift alerts (visual) | Show when portfolio drifts beyond a threshold from target allocation. Rebalancer's core feature, rare in personal tools | LOW | Simple percentage comparison with visual indicator. No notifications needed -- just visual on the dashboard |
| Bento grid dashboard layout | A modern, information-dense layout that feels premium. Source app already uses this pattern | MEDIUM | CSS Grid with varied card sizes. Fits the Nothing Phone structured-negative-space aesthetic |
| PIN with biometric fallback (future) | WebAuthn allows fingerprint/face unlock as alternative to PIN. Premium feel for a personal tool | HIGH | Web Authentication API. Defer to v2.x -- PIN alone is sufficient for v2.0 |
| Markdown export for journal | Rich text stored as Tiptap JSON, but exportable as Markdown for portability | LOW | Tiptap has built-in Markdown serializer. Low effort, high trust signal |
| Dev branch isolation | Dev tools only on develop branch, main is clean production. Professional workflow for a personal project | LOW | Vite environment variable or build-time flag. Simple conditional render |

---

## Anti-Features

Features to explicitly NOT build. These seem logical but are wrong for wintrack.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Bank account sync (Plaid/Yodlee) | Massive complexity (API costs, credential management, institution coverage, error handling). YNAB charges $109/yr largely because of this. Single-user personal tool doesn't need it | Manual transaction entry. The discipline of logging transactions is itself an accountability feature that matches wintrack's philosophy |
| Multi-currency support | Adds conversion logic, API dependency, and UI complexity. The source app uses Philippine Peso -- pick one currency and stay | Single currency, no symbol enforcement. User knows what currency they use |
| Receipt scanning / OCR | AI/ML feature that requires image upload, processing pipeline, and accuracy management. Completely out of scope | Manual entry. Keep the intentional, mindful logging pattern |
| Recurring transaction auto-creation | Seems helpful but creates ghost data that users must verify. Better to have users explicitly log each transaction for accountability | Bill management covers recurring obligations. Transactions are logged when they happen |
| Investment price fetching (API) | Real-time prices require API integration, rate limiting, and staleness management. Not worth it for a personal allocation tracker | Manual entry of current values. User updates when they check their brokerage. The allocation percentages are what matter, not live prices |
| Complex budget categories (envelope system) | YNAB's envelope system is powerful but adds significant UI complexity (category groups, assignment flows, rolling over unspent). Overkill for a personal tool | Simple budget limit per month + transaction list. The user's brain does the envelope math |
| Financial reports / charts beyond basics | Monthly spending pie charts, year-over-year trends, etc. -- these require significant charting infrastructure and are the domain of dedicated finance apps | Cash overview + budget pulse + spent/remaining. Three numbers tell the story |
| Biometric auth as primary (v2.0) | WebAuthn is not universally supported, especially on older mobile browsers. Adding it to v2.0 scope creeps the PIN feature | PIN only for v2.0. WebAuthn is a v2.x differentiator if PIN proves insufficient |
| Full WYSIWYG editor (tables, images, embeds) | Tiptap supports all of this but each feature adds toolbar complexity, storage size, and edge cases. A journal editor is not Google Docs | Bold, italic, lists, headings only. This covers 95% of journal formatting needs. Add more only if users ask |
| Offline-first finance | Transaction conflict resolution across devices is genuinely hard. The existing online-only Supabase pattern is fine | Same pattern as v1.0 -- Supabase for persistence, works when online. Offline is undefined and acceptable for personal tool |

---

## Feature Dependencies

```
[TypeScript Migration]
    -- independent, can happen in parallel with everything
    -- but should be FIRST so new finance code is written in TS from day one

[PIN Authentication]
    -- independent of finance features
    -- should be EARLY because it gates access to all data including finance
    -- depends on: Supabase (for PIN hash storage)

[Rich Text Journal]
    -- depends on: existing journal_entries table (migration needed: body text -> body jsonb)
    -- independent of finance
    -- backward compatibility: existing plain text entries must render in Tiptap

[Finance: Month Settings]
    -- NEW table: month_settings (starting_cash, budget_limit, expected_salary, salary_received)
    -- foundation for all other finance features

[Finance: Transactions]
    -- depends on: month_settings (transactions belong to a month context)
    -- NEW table: transactions (amount, description, type, category, transaction_date)

[Finance: Bills]
    -- depends on: month_settings (bills are checked per month)
    -- NEW table: bills (name, amount, due_day, is_recurring)
    -- NEW table: bill_payments (bill_id, month, paid_at) OR paid status on bill per month

[Finance: Investments]
    -- independent of budget/bills (different data model)
    -- NEW table: investment_accounts (name, current_value, target_percentage)
    -- can be built in parallel with bills

[Finance: Dashboard]
    -- depends on: month_settings + transactions + bills + investments
    -- aggregation layer, must be LAST in the finance build order

[Mobile Responsiveness]
    -- cross-cutting concern, applies to ALL features
    -- best done AFTER finance UI exists so there's something to make responsive
    -- test with vite --host on real devices

[Dev Branch Workflow]
    -- independent, can happen early
    -- enables cleaner development of all other features
```

### Critical Dependency Chain

```
TypeScript setup --> PIN auth --> Month Settings --> Transactions --> Bills --> Dashboard
                                                                 \-> Investments --/
                                 Rich Text Journal (parallel track)
                                 Mobile Responsiveness (final pass)
```

---

## MVP Recommendation

### Phase 1: Foundation (do first)
1. **TypeScript migration** -- set up tsconfig, convert entry points, establish patterns. All new code in TS
2. **Dev branch workflow** -- establish develop/main split before feature work begins

### Phase 2: Security Gate
3. **PIN authentication** -- gate the app before adding sensitive finance data

### Phase 3: Finance Core
4. **Month settings** (starting cash, budget limit, salary)
5. **Transaction CRUD** (the core data entry loop)
6. **Budget pulse / progress visualization**

### Phase 4: Finance Extended
7. **Bill management** (list, due dates, paid toggle, recurring rollover)
8. **Investment allocation** (accounts, targets, drift view)
9. **Finance dashboard** (bento grid, cash overview, monthly summary)

### Phase 5: Editor & Polish
10. **Rich text journal** (Tiptap integration, backward-compatible rendering)
11. **Mobile responsiveness** (comprehensive audit and fixes)

### Defer to v2.x
- Biometric/WebAuthn authentication
- Markdown export
- Investment drift alerts/notifications
- Financial reports/charts beyond basics

---

## Complexity Budget

| Feature Area | Estimated Effort | Risk Level | Notes |
|--------------|-----------------|------------|-------|
| TypeScript migration | HIGH | LOW | Tedious but well-understood. No architectural risk |
| PIN authentication | MEDIUM | LOW | Simple pattern. Hash + session. No auth provider needed |
| Month settings + transactions | MEDIUM | LOW | Standard CRUD. Mirrors existing wins pattern |
| Bill management | MEDIUM | MEDIUM | Recurring rollover logic needs careful date handling |
| Investment allocation | LOW | LOW | Simple percentage math. Manual entry |
| Finance dashboard | MEDIUM | MEDIUM | Bento grid layout + aggregation queries |
| Rich text journal (Tiptap) | MEDIUM | MEDIUM | Migration of existing plain text data. Tiptap setup is straightforward but editor UX polish takes time |
| Mobile responsiveness | MEDIUM | LOW | Audit + fix. Tailwind handles most of it |
| Dev branch workflow | LOW | LOW | Git + Vite env config |

---

## Sources

- [NerdWallet: Best Budget Apps 2026](https://www.nerdwallet.com/finance/learn/best-budget-apps) -- table stakes for budget apps
- [Financial Panther: Key Features Every Personal Finance App Needs 2026](https://financialpanther.com/key-features-every-personal-finance-app-needs-in-2026/) -- feature expectations
- [WalletHub: Best Bill Tracker Apps 2026](https://wallethub.com/edu/b/best-bill-tracker-app/152603) -- bill management patterns
- [Rebalancer App](https://rebalancer.app/) -- investment allocation tracking UX
- [Kubera: Portfolio Rebalancing Tools](https://www.kubera.com/blog/portfolio-rebalancing-tools) -- investment tracker comparison
- [Liveblocks: Rich Text Editor Framework Comparison 2025](https://liveblocks.io/blog/which-rich-text-editor-framework-should-you-choose-in-2025) -- Tiptap vs Slate vs Lexical
- [DEV Community: Best Rich Text Editor for React 2025](https://dev.to/codeideal/best-rich-text-editor-for-react-in-2025-3cdb) -- editor ecosystem overview
- [Tiptap React Installation Docs](https://tiptap.dev/docs/editor/getting-started/install/react) -- official setup guide
- [DEV Community: PWA Authentication Best Practices](https://dev.to/azure/27-best-practices-for-pwa-authentication-29md) -- PIN/auth patterns for PWAs
- [MDN: PWA Best Practices](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Best_practices) -- responsive design for PWAs
- [YNAB](https://www.ynab.com/) -- zero-based budgeting UX reference
- [Goodbudget](https://goodbudget.com/) -- envelope budgeting with manual entry (no bank sync)
- [Monarch Money bill tracker](https://www.nerdwallet.com/finance/learn/best-budget-apps) -- recurring bill detection and calendar view

---

*Feature research for: wintrack v2.0 -- Finance, rich text journal, PIN auth, TypeScript, mobile responsiveness*
*Researched: 2026-03-16*
