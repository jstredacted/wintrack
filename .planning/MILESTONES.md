# Milestones

## v2.0 Finance & Platform (Shipped: 2026-03-23)

**Phases completed:** 6 phases, 21 plans, 36 tasks

**Key accomplishments:**

- Develop branch with --host mobile testing, TypeScript project references (strict:false + allowJs), Supabase generated types, and __DEV_TOOLS_ENABLED__ env var gating
- All 39 source files migrated from JS/JSX to TS/TSX with typed Supabase client, Zustand stores, and component props interfaces
- Full TypeScript strict mode enabled with zero tsc errors across 28 renamed files and 26 source fixes
- SHA-256 hashPin utility, Zustand pinStore with sessionStorage backing, usePinAuth hook for gate/verify/setup, and useIdleTimer with 15-min throttled timeout
- Finance tables (months, income_sources, monthly_income) with RLS, 3 RPCs for atomic balance operations, currency/month utilities with 18 passing tests
- Three React hooks (useFinance, useExchangeRate, useIncomeConfig) forming the data access layer with RPC-based atomic operations and 16 passing tests
- Finance page with MonthStrip navigation, BalanceHero inline edit, SVG BudgetGauge with monochrome thresholds, and IncomeCards with toggle/collapse wired to Supabase hooks
- 3 new tables (bills, balance_changes, oneoff_income), 7 RPCs, 6 TypeScript types, 3 React hooks, and 2 utility functions for Phase 4 finance extended features
- Compact bill rows with urgency borders, paid toggle, one-time filtering, inline add form, and FinancePage integration
- Balance history indicator + revert modal and one-off income section with inline add/edit/delete, all wired into FinancePage
- Raw SVG waterfall step chart with solid/dashed bill cascade and three-mode FinancePage (current interactive, past read-only, future projected balance)
- MOB-07 — DayStrip date label mismatch:
- Tiptap v3 rich text editor integrated into journal with slash commands (/h2, /h3, /bullet, /numbered, /bold, /italic), markdown shortcuts, keyboard shortcuts, and backward-compatible plain-text rendering via body_format column
- SideNav.tsx
- Responsive finance card stacking, DayStrip date-centering via offsetLeft math, Settings refactored into 4 shadcn tabs with iOS-style mobile UI, and universal max-w-[1000px] applied to all pages
- Extended get_year_overview RPC and YearOverviewPage to show per-month journal entry count and year total alongside existing finance stats, completing Phase 5 visual verification.
- YearOverviewPage month-click now navigates correctly into FinancePage; bills support per-row delete (Trash2) and inline editing (Pencil) of name, amount, and due day
- Deleted 13 pre-redesign finance components (1609 lines of dead code) and closed all 60 v2.0 requirements to Complete with zero Pending items in the traceability table.

---

## v1.0 Daily Discipline Loop (Shipped: 2026-03-16)

**Phases completed:** 7 phases, 18 plans, 2 tasks

**Key accomplishments:**

- (none recorded)

---

## v1.0 Daily Discipline Loop (Shipped: 2026-03-11)

**Phases completed:** 7 phases, 34 plans, 0 tasks

**Key accomplishments:**

- (none recorded)

---
