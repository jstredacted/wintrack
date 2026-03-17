# Phase 5: Journal Rich Text & Mobile - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Three workstreams: (1) Tiptap rich text editor for journal entries with slash commands, markdown shortcuts, and keyboard shortcuts. (2) Mobile-responsive layout with bottom tab bar, touch targets, and stacked views. (3) Bug fixes for dayStartHour offset in DayStrip, heatmap, and rollover logic. Also includes layout consistency audit across all pages and journal count summary.

</domain>

<decisions>
## Implementation Decisions

### Rich Text Editor
- Tiptap StarterKit for bold, italic, bullet/numbered lists, headings (H2, H3)
- THREE discovery methods: slash commands (type "/" for menu like Notion), markdown shortcuts (auto-convert **bold**, ## heading, - list), AND keyboard shortcuts (Cmd+B, Cmd+I)
- No visible toolbar — formatting is discoverable through slash menu and keyboard
- Existing plain-text entries render as paragraphs (line breaks become <p> tags)
- Keep word count display (use Tiptap character-count extension)
- Content stored as HTML in Supabase with body_format column for migration safety

### Mobile Navigation
- Bottom tab bar with 5 items: Today, Journal, Finance, Settings, Lock
- Theme toggle moves to Settings page on mobile
- Finance barrel navigation works the same on mobile with touch swipe
- Finance cards stack vertically on mobile (single column)
- Breakpoint: `sm` (640px) — only phones get mobile layout, tablets keep desktop

### DayStrip + Night Owl Fixes
- dayStartHour offset applies to wins and journal only — finance is NOT affected
- DayStrip centers on the "logical today" (offset-aware): at 2:30 AM with dayStartHour=3, "today" is yesterday
- This applies universally to: DayStrip date cells, header date display, win date attribution, journal date, heatmap cell dates
- Heatmap: days with no wins show as empty cells (0 count, border only)
- Rollover: must respect dayStartHour — wins completed before the boundary count as that "logical day"'s completions, not rollover candidates

### Layout Consistency
- Universal max-w-[1000px] centered container for ALL pages (Today, Journal, Settings, Finance)
- Settings page: tabbed sections (General, Notifications, Income, Security) — reduces scroll, organized
- Mobile: no card borders/backgrounds — just content with dividers (iOS settings style)
- Mobile: full-width content with consistent padding
- Desktop: constrained content widths, no edge-to-edge stretching

### Journal Count Summary
- Per-month entry count visible on Finance/Year overview
- Total for the year in the year overview summary stats row

### Claude's Discretion
- Tiptap extension configuration and slash command menu design
- Bottom tab bar exact sizing and safe-area handling
- DayStrip centering algorithm for mobile touch
- Tab component for Settings sections
- How journal count integrates into existing year overview RPC

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Journal requirements
- `.planning/REQUIREMENTS.md` — JRNL-01..05

### Mobile requirements
- `.planning/REQUIREMENTS.md` — MOB-01..10

### Bug reports
- `.planning/todos/pending/daystrip-date-mismatch.md` — DayStrip date mismatch bug details
- `.planning/todos/pending/night-owl-daystart-bugs.md` — Heatmap NaN and rollover bugs

### Milestone research
- `.planning/research/STACK.md` — Tiptap v3.20 recommendation
- `.planning/research/ARCHITECTURE.md` — Tiptap integration pattern, mobile responsiveness approach
- `.planning/research/PITFALLS.md` — Tiptap + motion v12 conflict warning, journal body migration pitfalls

### Prior phase context
- `.planning/phases/04-finance-extended/04-CONTEXT.md` — Finance barrel navigation decisions (affects mobile)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/journal/JournalEditorOverlay.tsx` — Current full-screen editor, Tiptap replaces the textarea
- `src/components/journal/JournalEntryCard.tsx` — Entry display, needs to render HTML from Tiptap
- `src/components/layout/SideNav.tsx` — Desktop nav, needs mobile bottom tab bar variant
- `src/components/layout/AppShell.tsx` — Layout wrapper, needs responsive breakpoint logic
- `src/components/history/DayStrip.tsx` — DayStrip centering + date generation (bug fix target)
- `src/components/history/ConsistencyGraph.tsx` — Heatmap (NaN bug fix target)
- `src/hooks/useWins.ts` — Rollover logic (bug fix target)
- `src/lib/utils/date.ts` — `getLocalDateString` with dayStartHour offset (core of the night owl bugs)

### Established Patterns
- Full-screen overlays via createPortal (JournalEditorOverlay pattern)
- Plain @keyframes for animations (not motion library for overlays)
- Zustand stores for UI state
- formatPHP/formatUSD for currency

### Integration Points
- `src/App.tsx` — Router, may need mobile-specific route layouts
- `src/pages/SettingsPage.tsx` — Needs tab refactor
- `src/pages/YearOverviewPage.tsx` — Journal count integration
- `src/hooks/useYearOverview.ts` — Extend RPC to include journal counts

</code_context>

<specifics>
## Specific Ideas

- Slash commands should appear as a minimal floating menu (like Notion but monochrome) — just text labels, no icons, matches Nothing Phone aesthetic
- Bottom tab bar should feel native — safe-area padding for iPhone home indicator, thin top border
- The iOS-style mobile layout (no card borders, just dividers) should make the app feel like a native tool, not a web app
- Settings tabs: clean horizontal tab row at top, content switches below — same monospaced uppercase style as section headers
- The offramp-style income source UI (from todo) is NOT in this phase — just the tabbed Settings reorganization

</specifics>

<deferred>
## Deferred Ideas

- Income source add/edit with Wise offramp-style conversion UI — captured in `.planning/todos/pending/income-source-offramp-ui.md`
- Biometric auth (WebAuthn) — v2.1
- External balances (Polymarket, SOL DCA) — v2.1
- Journal entry tagging/search — not in current scope

</deferred>

---

*Phase: 05-journal-rich-text-and-mobile*
*Context gathered: 2026-03-18*
