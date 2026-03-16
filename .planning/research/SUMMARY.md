# Project Research Summary

**Project:** wintrack v2.0 — Finance & Platform
**Domain:** Personal accountability app expanding into finance management, rich text journaling, PIN auth, TypeScript migration, and mobile responsiveness
**Researched:** 2026-03-16
**Confidence:** HIGH

## Executive Summary

Wintrack v2.0 is a platform expansion of an existing React SPA (Vite, React 19, Tailwind v4, shadcn/ui, Supabase) that adds personal finance management, rich text journal editing, PIN-based access control, TypeScript adoption, and mobile responsiveness. The existing architecture is well-structured with clear patterns (hook-per-domain, overlay state machines, optimistic updates) that extend cleanly to new features. The recommended approach is to port finance data models from the source 350 app while replacing its Next.js Server Actions with Supabase client-side RPC calls under the existing anon-key + RLS pattern.

The new dependency surface is minimal: Tiptap (headless rich text editor, 3 packages), Recharts via shadcn chart scaffolding (1 package), and TypeScript (dev-only). PIN authentication and mobile responsiveness require zero new dependencies. All new packages are verified compatible with React 19 and Vite 7. The total addition is 4 runtime packages and 1 dev package -- deliberately lean.

The primary risks are: (1) journal plain-text to rich-text migration silently breaking existing entries if backward compatibility is not handled with a format discriminator, (2) finance stored procedures returning empty results when RLS policies are missing or misconfigured under anon-key context, and (3) TypeScript migration stalling in a two-language purgatory if not approached leaf-to-root with `allowJs: true`. All three are well-understood and have clear prevention strategies documented in the pitfalls research.

## Key Findings

### Recommended Stack

The existing stack (Vite, React 19, Tailwind v4, shadcn/ui, Supabase, Zustand, motion, Lucide) is validated and unchanged. Five additions cover all v2.0 requirements with minimal surface area.

**Core technologies:**
- **Tiptap** (`@tiptap/react` + `@tiptap/pm` + `@tiptap/starter-kit` ^3.20): Headless rich text editor -- fully style-controllable for Nothing aesthetic, StarterKit bundles bold/italic/lists/headings out of the box
- **Recharts** (^3.8 via `bunx shadcn@latest add chart`): SVG charting -- shadcn chart component wraps Recharts with automatic dark mode and Nova theming
- **TypeScript** (^5.8, dev-only): Type checking -- Vite already transpiles .tsx natively via esbuild, zero config changes
- **Web Crypto API** (browser-native): PIN hashing via `crypto.subtle.digest('SHA-256', ...)` -- zero dependencies
- **Tailwind v4 responsive** (existing): Mobile breakpoints via `sm:`/`md:`/`lg:` -- no new packages

### Expected Features

**Must have (table stakes):**
- Month-based budget view with starting cash, salary, and budget limit
- Transaction CRUD with categorization (expense/income/investment types)
- Bill management with due dates, paid/unpaid toggle, and recurring rollover
- Investment allocation tracking with target vs current percentages
- Finance dashboard with cash overview and monthly summary
- Rich text journal (bold, italic, lists, headings, keyboard shortcuts)
- Backward-compatible rendering of existing plain-text journal entries
- PIN entry gate on app open with session persistence
- Touch-friendly mobile layout with responsive navigation
- TypeScript adoption for all new code

**Should have (differentiators):**
- Unified accountability + finance in one app (the integration IS the differentiator)
- Budget pulse visualization (signature visual element from source app)
- Financial journal entries surfaced alongside budget data
- Investment drift visual indicators
- Bento grid dashboard layout

**Defer to v2.x:**
- Biometric/WebAuthn authentication
- Markdown export for journal
- Bank account sync (Plaid/Yodlee)
- Complex envelope budgeting system
- Investment live price fetching
- Full WYSIWYG editor features (tables, images, embeds)

### Architecture Approach

The v2.0 architecture extends the existing hook-per-domain pattern without introducing new state management paradigms. Finance data is page-scoped (no Zustand store needed), flowing through `FinancePage` which holds month state and passes it to child hooks. PIN gate is a layout route wrapping all children in the router tree. Tiptap replaces the textarea in JournalEditorOverlay. All new code is TypeScript from day one; existing .jsx files coexist and migrate incrementally.

**Major components:**
1. **PinGate** (layout route) -- client-side lock screen, sessionStorage-based session, SHA-256 hash verification
2. **FinancePage + finance hooks** -- month-scoped CRUD via 5 custom hooks (useTransactions, useBudget, useBills, useInvestments, useDashboard), Supabase RPC for atomic multi-table operations
3. **JournalEditorOverlay + Tiptap** -- headless editor replaces textarea, JournalToolbar for minimal formatting, HTML storage in existing body column
4. **Responsive AppShell** -- SideNav becomes bottom tab bar on mobile (<md), responsive padding throughout
5. **Finance database layer** -- 4 new tables (budgets, bills, investments, transactions) with RLS, 4+ stored procedures for atomic operations

### Critical Pitfalls

1. **Journal plain-text migration** -- Existing entries lose line breaks when loaded into Tiptap. Add `body_format` column to discriminate plain-text vs rich content; lazy-migrate on first edit.
2. **Finance RLS under anon key** -- Stored procedures ported from service-role context return empty results. Every migration must include RLS policies; test through client SDK, never the dashboard.
3. **TypeScript two-language purgatory** -- Converting one file triggers cascading type errors. Use `allowJs: true`, `strict: false`; convert leaf-to-root; convert tests alongside source files.
4. **Tiptap + motion CSS translate collision** -- ProseMirror cursor positioning breaks under animated parent transforms. Keep editor in a static container; animate only via opacity or CSS keyframes.
5. **Currency/locale hardcoding** -- Inline `Intl.NumberFormat` calls with hardcoded currency spread across components. Create `formatCurrency()` utility first; store amounts as integers (centavos) to avoid float rounding.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: TypeScript Foundation
**Rationale:** All new code must be TypeScript from day one. Setting up tsconfig, renaming entry points, and establishing type definitions must happen before any feature work begins. This is a blocker for clean feature development.
**Delivers:** Working TypeScript configuration with `allowJs: true`, converted entry points (main.tsx, App.tsx), shared type definitions file, `tsc --noEmit` passing.
**Addresses:** TypeScript migration (table stakes), type definitions for Supabase schema.
**Avoids:** Two-language purgatory pitfall by establishing conventions early.

### Phase 2: PIN Authentication Gate
**Rationale:** PIN must exist before finance data enters the system. Finance data (salary, budgets) is more sensitive than wins/journal. The PIN gate is independent and small-scoped.
**Delivers:** PinGate layout route, PinInput numpad UI, SHA-256 hash storage in user_settings, session timeout with idle detection, PIN setup/change/remove in Settings.
**Addresses:** PIN entry, setup flow, session persistence, secure storage.
**Avoids:** False security pitfall by documenting threat model explicitly and implementing idle timeout.

### Phase 3: Finance Database + Core Budget
**Rationale:** Database schema and RPC functions must exist before any finance UI. Month settings and transactions form the foundation that bills and investments build on.
**Delivers:** 4 Supabase tables with RLS, stored procedures for atomic operations, `formatCurrency()` utility, useTransactions and useBudget hooks, MonthSelector, basic FinancePage with budget view and transaction list.
**Addresses:** Month-based budget, starting cash, salary tracking, transaction CRUD, budget progress visualization.
**Avoids:** RLS silent failure pitfall by testing every query through client SDK. Currency hardcoding pitfall by establishing utility first.

### Phase 4: Finance Extended (Bills + Investments + Dashboard)
**Rationale:** Bills and investments are independent of each other but both depend on the month-settings foundation from Phase 3. Dashboard aggregates all finance data and must come last.
**Delivers:** BillsList with paid toggle and recurring rollover, InvestmentsList with target allocation, DashboardOverview with bento grid layout, Recharts integration via shadcn chart components.
**Addresses:** Bill management, investment tracking, cash overview, monthly summary, budget pulse visualization.
**Avoids:** Finance aggregation performance pitfall by using RPC for dashboard snapshot.

### Phase 5: Rich Text Journal (Tiptap)
**Rationale:** Independent of finance features. Isolated to JournalEditorOverlay replacement. Should come after finance so the team is not juggling two complex integrations simultaneously.
**Delivers:** Tiptap editor replacing textarea, JournalToolbar (bold/italic/list/heading), backward-compatible rendering of plain-text entries, word count via CharacterCount extension.
**Addresses:** Rich text formatting, keyboard shortcuts, backward compatibility.
**Avoids:** Plain-text migration pitfall via `body_format` column. Tiptap + motion cursor collision via static container pattern. Performance pitfall via `shouldRerenderOnTransaction: false` and lazy loading.

### Phase 6: Mobile Responsiveness
**Rationale:** Cross-cutting concern that must come after all new UI exists (finance pages, Tiptap editor, PIN screen). Making things responsive before they exist means doing the work twice.
**Delivers:** SideNav as bottom tab bar on mobile, responsive padding throughout, touch-friendly targets (44x44px minimum), DayStrip touch gesture support, finance page mobile layout.
**Addresses:** Touch targets, responsive layout, no horizontal scroll.
**Avoids:** SideNav mobile breakage pitfall by restructuring navigation component.

### Phase 7: TypeScript Completion + Polish
**Rationale:** By this point, most files have been touched and converted during feature work. This phase converts remaining .jsx stragglers, enables `strict: true`, and addresses any accumulated tech debt.
**Delivers:** All files in TypeScript, strict mode enabled, `tsc --noEmit` clean, dev branch workflow finalized.
**Addresses:** Full TypeScript coverage, dev branch isolation.

### Phase Ordering Rationale

- **TypeScript first** because every subsequent phase writes new .ts/.tsx files. Establishing conventions once prevents inconsistency.
- **PIN before finance** because finance data is sensitive. The gate should exist before the data does.
- **Finance core before extended** because transactions and budget settings are the foundation that bills, investments, and dashboard build upon.
- **Tiptap after finance** because both are medium-complexity integrations. Sequencing avoids context-switching overhead and lets each get proper attention.
- **Mobile last** because it is a cross-cutting layout concern. Every new UI component needs responsive treatment, so this phase covers everything in one pass.
- **TS completion last** because incremental migration happens naturally during feature phases. The final phase just mops up untouched files and flips strict mode.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Finance Database):** Stored procedure design and RLS policy patterns for the 4 new tables need careful specification. The 350 source app's data model may need adaptation.
- **Phase 5 (Rich Text Journal):** Tiptap performance tuning (`shouldRerenderOnTransaction`, lazy loading) and the motion/translate collision need validation during implementation.

Phases with standard patterns (skip research-phase):
- **Phase 1 (TypeScript Foundation):** Well-documented Vite + TS setup. No unknowns.
- **Phase 2 (PIN Auth):** Simple SHA-256 + sessionStorage pattern. No dependencies.
- **Phase 4 (Finance Extended):** Standard CRUD + chart rendering. Recharts via shadcn is documented.
- **Phase 6 (Mobile Responsiveness):** CSS-only changes with Tailwind responsive utilities. Standard practice.
- **Phase 7 (TS Completion):** Mechanical file conversion. No research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages verified on npm with current versions; compatibility with React 19 + Vite 7 confirmed via official docs |
| Features | HIGH | Finance patterns validated against YNAB, Monarch Money, Goodbudget; editor validated against Tiptap docs; clear anti-features list prevents scope creep |
| Architecture | HIGH | Extends existing proven patterns (hook-per-domain, overlay state machines); no architectural novelty required |
| Pitfalls | HIGH | Based on codebase analysis of actual files + verified ecosystem documentation; known gotchas (motion + translate collision) documented from v1.0 experience |

**Overall confidence:** HIGH

### Gaps to Address

- **350 source app data model fidelity:** The finance schema is inferred from research, not directly audited from the source. During Phase 3 planning, the actual 350 app schema should be reviewed to ensure nothing is missed.
- **Tiptap JSON vs HTML storage decision:** STACK.md recommends JSON storage (body column migrated to JSONB), while ARCHITECTURE.md recommends HTML storage (body stays text). Resolution: use HTML storage for simplicity -- existing plain text is valid HTML, no schema migration needed, and Tiptap round-trips HTML perfectly. JSON storage can be reconsidered if querying document structure becomes necessary.
- **Integer vs numeric for currency:** PITFALLS.md recommends integer storage (centavos) to avoid float rounding. ARCHITECTURE.md schema uses `numeric` type. Resolution: use `integer` (centavos) as recommended by pitfalls research -- the rounding risk is real and the conversion is trivial.
- **Session timeout duration:** PIN auth needs an idle timeout but the optimal duration (5 min vs 24 hours) depends on user preference. Expose as a setting with sensible default (30 min).

## Sources

### Primary (HIGH confidence)
- [Tiptap React Install Docs](https://tiptap.dev/docs/editor/getting-started/install/react) -- editor setup, extensions, React integration
- [Tiptap StarterKit](https://tiptap.dev/docs/editor/extensions/functionality/starterkit) -- included extensions
- [Tiptap Performance Guide](https://tiptap.dev/docs/guides/performance) -- `shouldRerenderOnTransaction`, `useEditorState`
- [shadcn/ui Chart Component](https://ui.shadcn.com/docs/components/radix/chart) -- Recharts integration
- [Supabase RPC Documentation](https://supabase.com/docs/reference/javascript/rpc) -- stored procedure calls
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) -- RLS patterns
- [Vite TypeScript Features](https://vite.dev/guide/features) -- native .tsx support
- [MDN Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest) -- SHA-256 PIN hashing

### Secondary (MEDIUM confidence)
- [NerdWallet: Best Budget Apps 2026](https://www.nerdwallet.com/finance/learn/best-budget-apps) -- finance feature expectations
- [Liveblocks: Rich Text Editor Comparison 2025](https://liveblocks.io/blog/which-rich-text-editor-framework-should-you-choose-in-2025) -- Tiptap vs Slate vs Lexical
- [Vite JS-to-TS Migration](https://dev.to/rashidshamloo/migrating-a-vite-react-app-from-javascript-to-typescript-5dmn) -- migration strategy
- [Rebalancer App](https://rebalancer.app/) -- investment allocation tracking UX
- [Goodbudget](https://goodbudget.com/) -- manual-entry budget app patterns

### Tertiary (LOW confidence)
- None -- all findings corroborated by multiple sources

---
*Research completed: 2026-03-16*
*Ready for roadmap: yes*
