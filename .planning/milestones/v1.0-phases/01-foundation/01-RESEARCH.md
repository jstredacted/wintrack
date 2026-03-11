# Phase 1: Foundation - Research

**Researched:** 2026-03-09
**Domain:** App shell, routing, dark mode, design system, Supabase schema + RLS, date utilities
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**RLS / Data Access Posture**
- Generate a random UUID once (`crypto.randomUUID()`) — store in `.env` as `VITE_USER_ID`
- Create a custom JWT signed with Supabase's JWT secret, embedding the UUID as the `sub` claim — store as `VITE_USER_JWT`
- Initialize the Supabase client with this JWT so `auth.uid()` resolves to the user UUID
- RLS policies are permissive per table: `USING (auth.uid() = user_id)` for SELECT/UPDATE/DELETE; `WITH CHECK (auth.uid() = user_id)` for INSERT
- All three tables (wins, check_ins, journal_entries) get the same RLS pattern — no exceptions

**App Shell Structure**
- Bottom tab bar navigation: three tabs — Today | History | Journal
- Install `react-router` and wire up three routes: `/` (Today), `/history`, `/journal`
- Each route renders a placeholder/empty state in Phase 1 — feature phases fill them in
- Today view empty state: styled with current date, monospaced label "No wins logged yet", dot grid backdrop

**Design Language**
- Primary font: Geist Mono (replace Geist Variable as the global `--font-sans`). Install `@fontsource-variable/geist-mono`.
- Dot grid background: subtle CSS `background-image` radial-gradient dot pattern on the `body`/root element — very low opacity. Applied globally.
- All design tokens established now: spacing scale, border weights, border-radius (tight/none), monospaced sizing scale.
- Color remains strictly zero-chroma.

**Dark Mode Toggle UX**
- Placement: Sun/moon icon button in the top-right corner of the app header
- Persistence: `localStorage` key `wintrack-theme` — instant reads on load, no async
- Default on first load: Read `prefers-color-scheme` media query — honors OS dark/light setting
- Flash prevention: Inline script in `index.html` `<head>` sets `.dark` class before React hydrates

**Date Utilities**
- `getLocalDateString()`: uses `Intl.DateTimeFormat` with the user's local timezone — never `.toISOString().slice(0,10)`

**Supabase Schema**
- Tables: `wins`, `check_ins`, `journal_entries`
- `wins` includes timer columns: `timer_elapsed_seconds` (integer, default 0) and `timer_started_at` (timestamptz, nullable)
- All tables include `user_id` (uuid) column for RLS checks

### Claude's Discretion

- Exact dot grid CSS values (dot size, spacing, opacity) — stay very subtle
- Geist Mono font weights/sizes for specific UI elements
- Tab bar icon choices from Lucide
- Exact spacing/padding of the app header
- Migration file naming and SQL organization

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SHELL-01 | User can toggle between dark and light mode | Dark mode pattern with `@custom-variant dark` + flash-prevention inline script + localStorage; theme hook pattern documented below |
| SHELL-02 | App uses the Nothing Phone Glyph Matrix design language — dot grid patterns, monospaced type, structured negative space, strictly black and white palette | Geist Mono Variable font install + @theme override; CSS dot grid via radial-gradient; zero-chroma CSS vars already in index.css |
</phase_requirements>

---

## Summary

Phase 1 is a pure infrastructure phase: no feature logic, only the skeleton everything else builds on. The key work is four independent tracks that can mostly be done in parallel — (1) Supabase schema + RLS, (2) React Router app shell, (3) Tailwind/design-system tokens + Geist Mono, and (4) the dark mode toggle with flash prevention.

All four have a narrow, well-understood scope. The most complex is the Supabase RLS track, which requires generating a static JWT offline (one-time setup), storing it as an env var, and passing it to `createClient` via the `accessToken` async function (added in supabase-js 2.45, project is on 2.98 — confirmed compatible). The react-router track is straightforward: v7 consolidates into the `react-router` package; import `createBrowserRouter` + `Outlet` from `"react-router"` and define three routes under a layout shell.

The design system work is additive — the project's existing `index.css` already has correct zero-chroma CSS vars and `@custom-variant dark`. Phase 1 adds: swap `--font-sans` to `'Geist Mono Variable'`, add the dot grid background, tighten border-radius tokens, and add any missing spacing/sizing scale values. The flash-prevention script is a well-known one-liner that goes in `index.html <head>` before any module script.

**Primary recommendation:** Implement the four tracks as separate waves — (1) schema migration, (2) Supabase client + env setup, (3) router shell, (4) design system — in that order, with the dark mode toggle as part of the router shell wave.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-router` | ^7.x (latest) | SPA routing — `createBrowserRouter`, `Outlet`, `Link`, `useNavigate` | v7 consolidated `react-router-dom` into this package; official recommendation for new projects |
| `@fontsource-variable/geist-mono` | ^5.x | Self-hosted Geist Mono variable font | Same install pattern as the already-installed `@fontsource-variable/geist`; no CDN latency |
| `@supabase/supabase-js` | 2.98.0 (already installed) | DB client + RLS integration | Already present; `accessToken` API available since 2.45 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `jsonwebtoken` (Node, offline) | any | One-time JWT generation at setup | Used once in a setup script to generate `VITE_USER_JWT`; NOT bundled into the app |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `react-router` v7 | `react-router-dom` v7 | `react-router-dom` is now a re-export; use `react-router` directly |
| `accessToken` async function | `global.headers` with Authorization | `accessToken` is the official v2 pattern; header approach is v1-era |
| `@fontsource-variable/geist-mono` | Google Fonts CDN | Fontsource is self-hosted — no CDN dependency, no GDPR concerns |

### Installation

```bash
npm install react-router @fontsource-variable/geist-mono
```

JWT generation is a one-time local operation — `jsonwebtoken` is not added to the project dependencies. Use Node's built-in `crypto` and a local script, or a JWT tool.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn components (button.tsx already here)
│   ├── layout/
│   │   ├── AppShell.jsx       # Root layout — header + tab bar + <Outlet />
│   │   ├── Header.jsx         # App header with theme toggle button
│   │   └── BottomTabBar.jsx   # Three-tab bottom navigation
│   └── theme/
│       └── ThemeToggle.jsx    # Sun/Moon icon button (uses shadcn Button)
├── pages/
│   ├── TodayPage.jsx          # Route: /   — empty state in Phase 1
│   ├── HistoryPage.jsx        # Route: /history — placeholder
│   └── JournalPage.jsx        # Route: /journal — placeholder
├── lib/
│   ├── supabase.js            # createClient with accessToken
│   └── utils/
│       └── date.js            # getLocalDateString()
├── hooks/
│   └── useTheme.js            # localStorage + class toggle logic
├── index.css                  # Tailwind + design tokens (already exists)
├── App.jsx                    # createBrowserRouter + RouterProvider
└── main.jsx                   # entry point (already exists)
```

### Pattern 1: React Router v7 Shell with Layout Route

**What:** A single root layout route wraps all three pages; child routes render into `<Outlet />`.

**When to use:** Any SPA with persistent chrome (tab bar, header).

```jsx
// src/App.jsx
// Source: https://reactrouter.com/start/data/routing
import { createBrowserRouter, RouterProvider } from "react-router";
import AppShell from "./components/layout/AppShell";
import TodayPage from "./pages/TodayPage";
import HistoryPage from "./pages/HistoryPage";
import JournalPage from "./pages/JournalPage";

const router = createBrowserRouter([
  {
    path: "/",
    Component: AppShell,
    children: [
      { index: true, Component: TodayPage },
      { path: "history", Component: HistoryPage },
      { path: "journal", Component: JournalPage },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
```

```jsx
// src/components/layout/AppShell.jsx
import { Outlet } from "react-router";
import Header from "./Header";
import BottomTabBar from "./BottomTabBar";

export default function AppShell() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  );
}
```

### Pattern 2: Dark Mode Toggle (Flash-Free)

**What:** Inline script in `index.html <head>` reads `localStorage` before React loads; React hook syncs state to the same class on `<html>`.

**When to use:** Any Vite SPA with class-based dark mode.

```html
<!-- index.html <head> — runs BEFORE any module script -->
<script>
  (function () {
    try {
      var stored = localStorage.getItem('wintrack-theme');
      if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {}
  })();
</script>
```

```js
// src/hooks/useTheme.js
import { useState, useEffect } from "react";

const STORAGE_KEY = "wintrack-theme";

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    // Read what the inline script already applied
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return { theme, toggle };
}
```

**Critical:** The inline script uses `document.documentElement.classList.add('dark')` — the `.dark` class on `<html>` is what `@custom-variant dark (&:is(.dark *))` in `index.css` responds to. They must match.

### Pattern 3: Supabase Client with accessToken

**What:** Pass the pre-generated static JWT via an async function. The `accessToken` option (supabase-js 2.45+) replaces the old `global.headers` approach and disables `supabase.auth.*` intentionally.

**When to use:** Single-user app with a static custom JWT rather than Supabase Auth.

```js
// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const USER_JWT = import.meta.env.VITE_USER_JWT;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  accessToken: async () => USER_JWT,
});
```

**Note:** `supabase.auth.*` methods will throw when `accessToken` is set — that is expected and correct for this single-user pattern.

### Pattern 4: Geist Mono in Tailwind v4

**What:** Import the variable font, then override `--font-sans` in the `@theme inline` block.

```css
/* src/index.css — add after the existing @import "@fontsource-variable/geist" */
@import "@fontsource-variable/geist-mono";

/* In the existing @theme inline block, change --font-sans: */
@theme inline {
  --font-sans: 'Geist Mono Variable', monospace;
  /* ... rest of existing tokens ... */
}
```

**Font-family name is exactly** `'Geist Mono Variable'` — this is the family name registered by the fontsource package.

### Pattern 5: CSS Dot Grid Background

**What:** A `radial-gradient` used as `background-image` to create a dot texture. Applied to `:root` or `body` so it covers the full viewport.

```css
/* src/index.css — add inside @layer base or directly on body */
body {
  background-image: radial-gradient(
    circle,
    oklch(0.5 0 0 / 0.06) 1px,
    transparent 1px
  );
  background-size: 24px 24px;
}

.dark body {
  background-image: radial-gradient(
    circle,
    oklch(1 0 0 / 0.05) 1px,
    transparent 1px
  );
  background-size: 24px 24px;
}
```

**Discretion values (per CONTEXT.md):** dot size 1px, spacing 24px, opacity 5–6% in light / 4–5% in dark. Adjust to stay at the "texture of graph paper" level, not decorative noise.

### Pattern 6: getLocalDateString()

**What:** Returns `YYYY-MM-DD` in the user's local timezone, never UTC.

```js
// src/lib/utils/date.js
export function getLocalDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  // en-CA locale produces YYYY-MM-DD format natively
}
```

**Why `en-CA`:** The Canadian locale format is `YYYY-MM-DD` — it gives ISO-date formatting using `Intl.DateTimeFormat` without string manipulation.

### Pattern 7: Supabase Schema Migration

```sql
-- migration: 001_initial_schema.sql

-- wins
CREATE TABLE IF NOT EXISTS wins (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL,
  title         text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  timer_elapsed_seconds integer NOT NULL DEFAULT 0,
  timer_started_at      timestamptz
);

ALTER TABLE wins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wins_select" ON wins FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "wins_insert" ON wins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wins_update" ON wins FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wins_delete" ON wins FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- check_ins
CREATE TABLE IF NOT EXISTS check_ins (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  win_id     uuid NOT NULL REFERENCES wins(id) ON DELETE CASCADE,
  completed  boolean NOT NULL DEFAULT false,
  note       text,
  checked_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "check_ins_select" ON check_ins FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "check_ins_insert" ON check_ins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "check_ins_update" ON check_ins FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "check_ins_delete" ON check_ins FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- journal_entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  title      text NOT NULL,
  body       text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_entries_select" ON journal_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "journal_entries_insert" ON journal_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "journal_entries_update" ON journal_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "journal_entries_delete" ON journal_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

### Anti-Patterns to Avoid

- **`FOR ALL` in RLS policies:** Supabase docs warn against this — use four separate policies (SELECT, INSERT, UPDATE, DELETE) for clarity and correct `WITH CHECK` semantics.
- **`.toISOString().slice(0,10)` for dates:** Returns UTC — corrupts streak boundaries for users west of UTC. Always use `Intl.DateTimeFormat`.
- **`darkMode: 'class'` in a Tailwind config file:** Tailwind v4 has no `tailwind.config.js` for this project — dark mode is handled via `@custom-variant dark` in CSS only.
- **`react-router-dom` import in v7:** Import from `"react-router"` — `react-router-dom` is now just a re-export; using it adds a stale dependency.
- **`setInterval` for timer:** Out of scope for Phase 1, but the schema column `timer_started_at` is included now so Phase 2 uses wall-clock recovery from day one.
- **Exposing `SUPABASE_SERVICE_ROLE_KEY` in client code:** Never. Use `SUPABASE_ANON_KEY` + custom JWT via `accessToken`. The anon key is a publishable key; the service role key bypasses all RLS.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Routing / URL matching | Custom hash router or state machine | `react-router` v7 | History API, relative links, nested routes, scroll restoration all handled |
| Dark/light class toggling | Complex context provider + SSR concerns | Simple `useTheme` hook + inline script | The inline script pattern is the standard solution; no library needed |
| Supabase RLS auth bypass for single user | Service-role proxy, Cloudflare worker, custom backend | `accessToken` async function with static JWT | Direct pattern supported since supabase-js 2.45; no server needed |
| Local date string formatting | String manipulation on `.toISOString()` | `Intl.DateTimeFormat('en-CA', {...})` | Built-in browser API, respects user timezone, zero deps |
| CSS variable theming | Runtime CSS-in-JS | Tailwind v4 CSS vars in `@theme inline` + `:root` / `.dark` blocks | Already scaffolded in `index.css`; no runtime overhead |

**Key insight:** The anti-flash technique, the date utility, and the single-user RLS pattern are all cases where the correct solution is 5–15 lines of plain code, not a library. The only actual new dependency is `react-router`.

---

## Common Pitfalls

### Pitfall 1: Theme Flash (FOUC)
**What goes wrong:** React renders, then applies dark class from localStorage — user sees a white flash.
**Why it happens:** `useEffect` runs after paint; localStorage read happens too late.
**How to avoid:** Place the inline script in `index.html <head>` BEFORE `<script type="module" ...>`. It runs synchronously before React loads.
**Warning signs:** Opening app in dark mode shows a brief white flash on hard refresh.

### Pitfall 2: UTC Date Boundary Bug
**What goes wrong:** Streaks break at midnight for users in negative UTC offsets (US timezones).
**Why it happens:** `new Date().toISOString().slice(0,10)` returns the UTC date, which can be the previous day for US users after 7–8pm.
**How to avoid:** Always use `getLocalDateString()` with `Intl.DateTimeFormat`.
**Warning signs:** Streak resets unexpectedly in the evening.

### Pitfall 3: `supabase.auth.*` Throws After `accessToken`
**What goes wrong:** Code calls `supabase.auth.getUser()` or `supabase.auth.onAuthStateChange()` and gets a runtime error.
**Why it happens:** supabase-js intentionally disables auth methods when `accessToken` is configured — this is by design.
**How to avoid:** Never call `supabase.auth.*` in this project. Identify the user from `VITE_USER_ID` env var directly. Document this in code comments.
**Warning signs:** Console error: "Supabase Client is configured with the accessToken option, accessing supabase.auth.{method} is not possible"

### Pitfall 4: RLS Blocks All Reads/Writes
**What goes wrong:** Queries return empty arrays or permission denied errors after schema creation.
**Why it happens:** RLS enabled but JWT `role` claim is not `"authenticated"`, or `sub` claim doesn't match `user_id` values in the table.
**How to avoid:** The custom JWT must include `role: "authenticated"` and `sub: "<VITE_USER_ID>"`. When inserting rows, always provide `user_id: import.meta.env.VITE_USER_ID`.
**Warning signs:** Supabase query returns `[]` or `{ error: { code: 'PGRST301' } }`.

### Pitfall 5: Dot Grid Too Visible or Performance Issue
**What goes wrong:** Dot grid distracts from content, or `background-size` is too large causing rendering jank.
**Why it happens:** Opacity too high, dot too large, or gradient repainting on scroll.
**How to avoid:** Keep opacity 4–6%, dot size 1px, spacing 20–24px. Apply to `body` with `background-attachment: fixed` if scroll jank appears.
**Warning signs:** Content feels "noisy" or scrolling is choppy on mobile.

### Pitfall 6: Tab Bar Hidden Behind Keyboard / Safe Area
**What goes wrong:** Bottom tab bar overlaps keyboard on mobile, or clips behind iPhone home indicator.
**Why it happens:** Fixed bottom element doesn't account for viewport safe areas.
**How to avoid:** Use `pb-safe` or `padding-bottom: env(safe-area-inset-bottom)` on the tab bar. Tab bar `min-h-[56px]` plus safe area padding.
**Warning signs:** Tab bar invisible on iOS Safari, or overlaps soft keyboard.

### Pitfall 7: `@fontsource-variable/geist-mono` Import Missing
**What goes wrong:** Tailwind applies `font-mono` or `font-sans` but browser falls back to system monospace.
**Why it happens:** The CSS `@import` is not in `index.css`, so the font file never loads.
**How to avoid:** Add `@import "@fontsource-variable/geist-mono";` to `index.css` immediately after the existing Geist import.
**Warning signs:** UI renders in system monospace rather than Geist Mono.

---

## Code Examples

### JWT Generation (one-time setup script, NOT bundled)

```js
// scripts/gen-jwt.mjs  (run once: node scripts/gen-jwt.mjs)
// Requires: npm install -g jsonwebtoken  OR  npx jsonwebtoken
import { createHmac } from "node:crypto";

const userId = crypto.randomUUID();
const secret = process.env.SUPABASE_JWT_SECRET; // from Supabase dashboard: Project Settings → API → JWT Keys → Legacy JWT Secret

const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
const payload = Buffer.from(JSON.stringify({
  sub: userId,
  role: "authenticated",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 10, // 10 years
})).toString("base64url");

const sig = createHmac("sha256", secret)
  .update(`${header}.${payload}`)
  .digest("base64url");

console.log(`VITE_USER_ID=${userId}`);
console.log(`VITE_USER_JWT=${header}.${payload}.${sig}`);
```

This uses Node's built-in `crypto` — no npm install required for the project. Run once, copy output into `.env`.

### Env File Template

```bash
# .env.local  (gitignored)
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable-anon-key>
VITE_USER_ID=<generated-uuid>
VITE_USER_JWT=<generated-jwt>
```

### Bottom Tab Bar (Lucide icons)

```jsx
// src/components/layout/BottomTabBar.jsx
import { NavLink } from "react-router";
import { LayoutDashboard, Clock, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", icon: LayoutDashboard, label: "Today", end: true },
  { to: "/history", icon: Clock, label: "History" },
  { to: "/journal", icon: BookOpen, label: "Journal" },
];

export default function BottomTabBar() {
  return (
    <nav className="fixed bottom-0 inset-x-0 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-14">
        {TABS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center justify-center gap-1 cursor-pointer transition-colors duration-150",
                isActive ? "text-foreground" : "text-muted-foreground"
              )
            }
          >
            <Icon className="size-5" />
            <span className="text-[10px] font-mono uppercase tracking-widest">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
```

### Theme Toggle Button

```jsx
// src/components/theme/ThemeToggle.jsx
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
```

### Today Empty State

```jsx
// src/pages/TodayPage.jsx
import { getLocalDateString } from "@/lib/utils/date";

export default function TodayPage() {
  const today = getLocalDateString();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] gap-4 p-6 text-center">
      <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
        {today}
      </p>
      <p className="text-sm font-mono text-muted-foreground">
        No wins logged yet
      </p>
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `import { ... } from "react-router-dom"` | `import { ... } from "react-router"` | v7 (Nov 2024) | Simpler dep tree; same API |
| `global.headers: { Authorization: "Bearer ..." }` in createClient | `accessToken: async () => jwt` | supabase-js 2.45 (Jul 2024) | Auth methods properly disabled; cleaner pattern |
| `darkMode: 'class'` in `tailwind.config.js` | `@custom-variant dark` in CSS | Tailwind v4 (2024) | No config file; pure CSS |
| `@import url('...')` Google Fonts | `@fontsource-variable/geist-mono` npm import | ~2022 onward | Self-hosted; no CDN; works offline |

**Deprecated/outdated:**
- `react-router-dom` as a direct dependency: still works (it's a re-export) but adds noise — use `react-router`
- `supabase.auth.setAuth(token)` (v1 API): removed in v2; replaced by `accessToken` option

---

## Open Questions

1. **JWT expiry handling**
   - What we know: The generated JWT has a long expiry (10 years recommended for a personal tool)
   - What's unclear: Whether Supabase validates `exp` against current time strictly; if so, a JWT minted once will expire in 10 years and require regen
   - Recommendation: Generate with `exp` = 10 years out; add a comment in `supabase.js` noting when to regenerate

2. **Supabase migration tool vs. manual SQL**
   - What we know: The project has no migration tooling set up; Supabase CLI supports `supabase migration new` + `supabase db push`
   - What's unclear: Whether the team wants Supabase CLI in the project for Phase 1 or prefers running SQL directly in the Supabase dashboard
   - Recommendation: Write the migration as a `.sql` file in `supabase/migrations/`; running it via dashboard or CLI are both valid

3. **`wins` table: `date` column needed?**
   - What we know: Streaks are computed from wins queries. The streak logic (Phase 3) will need to group wins by local date.
   - What's unclear: Whether `created_at` (timestamptz) is sufficient for date grouping (requires timezone-aware SQL) or whether a stored `date` column (text `YYYY-MM-DD`) would simplify Phase 3 streak queries
   - Recommendation: Add a `win_date` column (text, `YYYY-MM-DD`) populated by the client using `getLocalDateString()` — avoids timezone math in SQL and keeps streak queries simple. This is a Phase 1 schema decision that is hard to change later.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — Vitest recommended |
| Config file | `vitest.config.js` (Wave 0 gap) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

Vitest is the natural test runner for Vite projects. No additional configuration beyond installing it is needed for unit tests.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHELL-01 | `useTheme` toggles `.dark` class on `<html>` and persists to localStorage | unit | `npx vitest run src/hooks/useTheme.test.js -x` | Wave 0 gap |
| SHELL-01 | `useTheme` reads system preference as default when no localStorage value | unit | `npx vitest run src/hooks/useTheme.test.js -x` | Wave 0 gap |
| SHELL-02 | `getLocalDateString()` returns local date (not UTC) in `YYYY-MM-DD` format | unit | `npx vitest run src/lib/utils/date.test.js -x` | Wave 0 gap |
| SHELL-02 | Geist Mono font-family token present in computed styles | manual-only | Visual inspection in browser DevTools | n/a |
| SHELL-02 | Dot grid renders at correct opacity in both modes | manual-only | Visual inspection | n/a |

**Notes on manual-only tests:** CSS/visual design verification cannot be automated meaningfully with unit tests. The two visual checks should be part of the Phase 1 acceptance review.

### Sampling Rate

- **Per task commit:** `npx vitest run src/hooks/ src/lib/utils/ --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/hooks/useTheme.test.js` — covers SHELL-01 (localStorage read/write, class toggle, system preference default)
- [ ] `src/lib/utils/date.test.js` — covers SHELL-02 date utility (en-CA locale, non-UTC output)
- [ ] `vitest.config.js` — Vitest config with jsdom environment for hook tests
- [ ] Vitest install: `npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom`

---

## Sources

### Primary (HIGH confidence)

- `https://reactrouter.com/start/data/routing` — createBrowserRouter, Outlet, layout route pattern, v7 import from "react-router"
- `https://supabase.com/docs/guides/auth/jwts` — JWT claims reference, auth.uid() behavior
- `https://github.com/supabase/supabase-js/pull/1004` — accessToken option added in supabase-js 2.45.0 (Jul 2024), behavior when auth.* is disabled
- `https://fontsource.org/fonts/geist-mono/install` — @fontsource-variable/geist-mono CSS import and font-family name
- `https://tailwindcss.com/docs/theme` — @theme inline, --font-sans override pattern
- Existing project files: `src/index.css`, `components.json`, `package.json` — confirmed current stack and CSS vars

### Secondary (MEDIUM confidence)

- `https://catjam.fi/articles/supabase-gen-access-token` — JWT payload structure verified against Supabase JWT fields docs; `role: "authenticated"` + `sub` confirmed required
- `https://dev.to/gaisdav/how-to-prevent-theme-flash-in-a-react-instant-dark-mode-switching-o20` — inline script pattern; implementation adapted for `.dark` class (vs. `data-theme` attribute) to match project's existing `@custom-variant dark` pattern
- `https://supabase.com/docs/guides/database/postgres/row-level-security` — separate SELECT/INSERT/UPDATE/DELETE policy pattern, NOT `FOR ALL`

### Tertiary (LOW confidence)

- ui-ux-pro-max skill search output — micro-interactions style, touch target sizes. Confirmed against WCAG 2.1 Touch Target guidance (44x44px minimum).

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from official docs and existing package.json
- Architecture: HIGH — patterns verified against react-router v7 official docs and supabase-js PR
- Pitfalls: HIGH — UTC date bug and theme flash are classic documented issues; RLS patterns from official docs
- Validation: MEDIUM — Vitest recommended based on project using Vite; no existing test infrastructure to inspect

**Research date:** 2026-03-09
**Valid until:** 2026-06-09 (90 days — all core libraries are stable; supabase-js and react-router release frequently but the APIs used here are stable)
