# Phase 1: Foundation - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Supabase schema + RLS, app shell with bottom-tab routing, theme toggle with dark/light persistence, Nothing Phone design system tokens, and date utilities. Everything feature phases (2–4) depend on to build without revisiting infrastructure.

</domain>

<decisions>
## Implementation Decisions

### RLS / Data Access Posture
- Generate a random UUID once (`crypto.randomUUID()`) — store in `.env` as `VITE_USER_ID`
- Create a custom JWT signed with Supabase's JWT secret, embedding the UUID as the `sub` claim — store as `VITE_USER_JWT`
- Initialize the Supabase client with this JWT so `auth.uid()` resolves to the user UUID
- RLS policies are **permissive** per table: `USING (auth.uid() = user_id)` for SELECT/UPDATE/DELETE; `WITH CHECK (auth.uid() = user_id)` for INSERT
- All three tables (wins, check_ins, journal_entries) get the same RLS pattern — no exceptions

### App Shell Structure
- **Bottom tab bar** navigation: three tabs — Today | History | Journal
- Install `react-router` and wire up three routes: `/` (Today), `/history`, `/journal`
- Each route renders a placeholder/empty state in Phase 1 — feature phases fill them in
- Today view empty state: styled with current date, monospaced label "No wins logged yet", dot grid backdrop — establishes visual identity, not a blank page

### Design Language (full Nothing Phone character in Phase 1)
- **Primary font**: Geist Mono (replace Geist Variable as the global `--font-sans`). Install `@fontsource-variable/geist-mono`.
- **Dot grid background**: Subtle CSS `background-image` radial-gradient dot pattern on the `body`/root element — very low opacity so content reads clearly. Applied globally, not per-component.
- **All design tokens established now**: spacing scale, border weights, border-radius (tight/none for that precision feel), monospaced sizing scale. Downstream phases use the tokens, not ad-hoc values.
- Color remains strictly zero-chroma (already correct in CSS vars — no changes needed there)

### Dark Mode Toggle UX
- **Placement**: Sun/moon icon button in the top-right corner of the app header — always visible, no menu required
- **Persistence**: `localStorage` key `wintrack-theme` — instant reads on load, no async
- **Default on first load**: Read `prefers-color-scheme` media query — honors OS dark/light setting
- **Flash prevention**: Inline script in `index.html` `<head>` sets the `.dark` class before React hydrates — prevents flash of wrong theme

### Date Utilities
- `getLocalDateString()`: uses `Intl.DateTimeFormat` with the user's local timezone to return `YYYY-MM-DD` — never `.toISOString().slice(0,10)` which is UTC and corrupts streak boundaries at midnight

### Supabase Schema
- Tables: `wins`, `check_ins`, `journal_entries`
- `wins` includes timer columns: `timer_elapsed_seconds` (integer, default 0) and `timer_started_at` (timestamptz, nullable) — wall-clock recovery from day one
- All tables include `user_id` (uuid) column for RLS checks

### Claude's Discretion
- Exact dot grid CSS values (dot size, spacing, opacity) — stay very subtle
- Geist Mono font weights/sizes for specific UI elements
- Tab bar icon choices from Lucide
- Exact spacing/padding of the app header
- Migration file naming and SQL organization

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/button.tsx`: shadcn Button component — use for the theme toggle button
- `src/index.css`: Already has correct zero-chroma CSS vars for both light and dark modes, `@custom-variant dark` pattern in place. Only changes needed: swap font to Geist Mono, add dot grid background, add any additional design tokens.
- Tailwind v4 with `@theme inline` block already present — add new tokens here

### Established Patterns
- Dark mode: `@custom-variant dark (&:is(.dark *))` in index.css — the `.dark` class on `<html>` drives all dark variants. The flash-prevention script must target `<html>`.
- Geist Variable is already installed (`@fontsource-variable/geist`). Geist Mono is the companion package (`@fontsource-variable/geist-mono`) — same install pattern.

### Integration Points
- `App.jsx` is a blank slate — Phase 1 rewrites it completely to the routed shell
- `src/lib/` directory exists but is empty — `supabase.js` and `utils/date.js` go here
- `index.html` needs the theme flash-prevention inline script in `<head>`

</code_context>

<specifics>
## Specific Ideas

- Nothing Phone Glyph Matrix reference: dot grid is technical precision, not decorative noise. Keep opacity very low (think: 3–5% visible, the texture of graph paper).
- Tab bar should feel like a device nav bar — minimal, no labels if icons are clear enough, or very small uppercase mono labels.
- The Today view empty state is the app's "first impression" — it should already feel like wintrack, not a loading screen.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-09*
