# Stack Research

**Domain:** Personal productivity / accountability tracker SPA (React + Supabase)
**Researched:** 2026-03-09
**Confidence:** HIGH (core stack confirmed via official docs and multiple sources)

---

## Recommended Stack

### Core Technologies (Already in Scaffold — Do Not Change)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vite | ^7.3.1 | Build tool + dev server | Fastest HMR in class; ESM-native; zero config for React |
| React | ^19.2.0 | UI framework | Project constraint. React 19 concurrent features (useTransition, useDeferredValue) help with animated step flows |
| Tailwind CSS | ^4.2.1 | Utility-first CSS | Project constraint. v4 is CSS-first (no tailwind.config.js); `@custom-variant` replaces darkMode config |
| shadcn/ui | ^4.0.2 | Component primitives | Project constraint. Nova preset. Copy-paste components built on Radix, fully owned in your codebase |
| @supabase/supabase-js | ^2.98.0 | Database client | Project constraint. Anon key + RLS-disabled tables is the correct pattern for a single-user, no-auth app |
| Lucide React | ^0.577.0 | Icon set | Project constraint. Consistent stroke-based icons; tree-shakeable |
| tw-animate-css | ^1.4.0 | Animation utilities | Already in scaffold as Tailwind v4 replacement for tailwindcss-animate. Handles accordion/fade primitives |

### State Management

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Zustand | ^5.0.11 | Client-side global state | Minimal boilerplate, no Provider wrapper, React 19 compatible. `persist` middleware handles dark mode preference in localStorage with zero extra code. Surgically re-renders only subscribed components — critical for a live stopwatch ticking every 100ms alongside static UI |

**Decision rationale over alternatives:**
- React Context: fine for theme; disastrous for stopwatch state — every tick would re-render the entire tree
- Jotai: atom granularity is overkill for this app's state shape (a handful of stores, not hundreds of atoms)
- Redux Toolkit: 10x the boilerplate for a personal tool with no team

### Animation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| motion (framer-motion) | ^12.x (install as `framer-motion`) | Typeform-style step transitions, enter/exit animations | `AnimatePresence` handles unmount animations declaratively. Variant orchestration (`staggerChildren`, `when: "beforeChildren"`) makes multi-step flows read like a script. React 19 compatible as of v12. |

**Install note:** The package was rebranded from `framer-motion` to `motion` in late 2024. Both npm packages are maintained and identical. `framer-motion` is the safe install for now; import from `motion/react` if using the new package. The API is identical.

**Decision rationale over alternatives:**
- React Spring: physics-based, excellent for gesture interactions, but `AnimatePresence` and variant trees are the specific features needed here; Motion's API is more declarative and beginner-friendly
- CSS Transitions only: fine for hover states, not for orchestrated step sequences with exit animations
- tw-animate-css (already in scaffold): handles simple class-based enter/exit but cannot do sequential orchestration across components

### Forms

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| react-hook-form | ^7.71.2 | Form state, validation | Uncontrolled inputs = zero re-renders during typing. 8.6 kB gzipped. Integrates cleanly with controlled shadcn/ui inputs via `Controller`. For a single text field per Typeform step, `register` is even simpler. |

**Note:** For this app's win-input flow (one field per step), react-hook-form is used lightly — primarily for submit handling and validation. Zod integration (`@hookform/resolvers`) is optional; plain HTML validation rules are sufficient for simple required-text fields.

### Data Access Pattern (Supabase)

No dedicated Supabase data-fetching library is needed. The recommended pattern is:

1. **Singleton client** — create `lib/supabase.ts` exporting one `createClient()` instance (already implied by scaffold)
2. **Custom hooks** — `useWins()`, `useJournalEntries()` etc. wrapping `useEffect` + Supabase queries. No third-party abstraction layer
3. **No auth, no RLS** — with a single user and no sensitive data, disable RLS on all tables and use the anon key directly from the client. This is the correct Supabase pattern for a personal tool: no JWT, no session management, direct table access

**Why not TanStack Query (React Query)?**
React Query adds cache invalidation, background refetch, and deduplication — all valuable in multi-user apps. For a single-user local tool writing to Supabase, optimistic state in Zustand + direct Supabase calls is simpler and has fewer moving parts. Adds it if offline sync or complex cache invalidation becomes needed.

### Dark Mode

| Technology | Purpose | Implementation |
|------------|---------|----------------|
| Tailwind v4 `@custom-variant` | Class-based dark mode toggle | Add `@custom-variant dark (&:where(.dark, .dark *));` to `index.css`. Toggle `.dark` class on `<html>`. Persist preference to `localStorage` via Zustand `persist` middleware. |

**Tailwind v4 breaking change:** `darkMode: 'class'` in `tailwind.config.js` no longer exists — the config file is gone entirely in v4. The `@custom-variant` directive in CSS is the only correct approach. The `dark:` utility prefix works identically after this one-line CSS addition.

### Timer / Stopwatch

No library needed. The correct pattern is a custom hook:

```
useStopwatch(winId):
  - startTimeRef: useRef<number | null>  — stores Date.now() at last start
  - accumulatedRef: useRef<number>        — ms accumulated before last pause
  - intervalRef: useRef<ReturnType<typeof setInterval>>
  - elapsedMs: useState<number>           — drives re-render display only

On start: record Date.now() in startTimeRef, start interval
Interval callback: setElapsedMs(accumulatedRef.current + Date.now() - startTimeRef.current)
On pause: accumulatedRef.current += Date.now() - startTimeRef.current; clearInterval
On reset: clear all refs, setState(0)
Persist cumulative time to Supabase on pause/stop, not on every tick
```

**Why timestamp-based over increment-based:** `setInterval` is not guaranteed to fire exactly on time; accumulated drift over minutes becomes visible. Subtracting `Date.now()` from the start timestamp gives wall-clock accuracy regardless of tab visibility or browser throttling.

### Notifications (v2 — stub in v1)

Per PROJECT.md, v1 stubs the 9am/9pm times; actual notifications are v2.

**When v2 arrives:** Use the native `Notification` API + a Service Worker for scheduled push. No library needed for basic browser notifications. For scheduled delivery (not just on-tab), a Service Worker is required — Vite + `vite-plugin-pwa` is the standard scaffold for this.

**v1 approach:** Export constants `MORNING_PROMPT_TIME = '09:00'` and `EVENING_CHECKIN_TIME = '21:00'`. No implementation, just documented stubs.

### Date Formatting

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| date-fns | ^4.x | Formatting display dates, relative time | Fully tree-shakeable (each function is its own ESM export). Functional API — `format(date, 'MMM d')` not a chained builder. No Moment.js global state. |

**Decision over dayjs:** dayjs is slightly smaller (~6 kB vs date-fns ~18 kB without tree-shaking), but date-fns is already the shadcn/ui ecosystem standard (used in `shadcn/ui` DatePicker components). Consistent choice across the stack.

---

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zustand | ^5.0.11 | Global state + persist | Install immediately; needed for dark mode and stopwatch state |
| motion (framer-motion) | ^12.x | Animated step transitions | Install when building Typeform-style win input flow |
| react-hook-form | ^7.71.2 | Form handling | Install when building win input and journal entry forms |
| date-fns | ^4.x | Date display | Install when building win cards, streak counter, journal view |

---

## Development Tools (Already Configured)

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint 9 | Linting | Already configured with react-hooks and react-refresh plugins |
| TypeScript (via @types/*) | Type checking | Types are installed; migrate JSX to TSX for strict prop contracts |
| Vite | Dev server | `vite.config.js` already has `@vitejs/plugin-react` |

---

## Installation

```bash
# State management
npm install zustand

# Animation
npm install framer-motion

# Forms
npm install react-hook-form

# Date formatting
npm install date-fns
```

No dev-only installs needed for these packages — all are runtime dependencies.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Zustand | Jotai | When you have 50+ independent atoms that need surgical per-atom reactivity (e.g., a spreadsheet or a complex editor) |
| Zustand | TanStack Query | When you need server-state cache, background refetch, or pagination — multi-user apps, not personal tools |
| framer-motion | React Spring | When building physics-accurate gesture interactions (drag, throw, spring curves) rather than declarative orchestrated sequences |
| framer-motion | CSS transitions | When you only need hover/focus state changes — no enter/exit orchestration needed |
| react-hook-form | Controlled state in Zustand | When form fields need to be observable outside the form (e.g., live preview) |
| date-fns | dayjs | When bundle size is the primary concern and you won't use shadcn/ui date components |
| Custom hook | react-timer-hook | When you want a drop-in with no control over timer accuracy or persistence |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Redux Toolkit | 10x the boilerplate for a personal tool with no team, no time-travel debugging need | Zustand |
| React Context for stopwatch state | Every tick re-renders entire Context consumer tree; causes jank in the rest of the UI | Zustand with granular selectors |
| Moment.js | Deprecated; 230 kB unminified; mutable API causes subtle bugs | date-fns |
| tailwindcss-animate | Not compatible with Tailwind v4's CSS-first architecture | tw-animate-css (already in scaffold) |
| tailwind.config.js `darkMode: 'class'` | Config file does not exist in Tailwind v4 | `@custom-variant dark` in CSS |
| setInterval-only timer (no timestamp) | Accumulates drift; visible error after 2-3 minutes | `Date.now()` timestamp subtraction pattern |
| Service Worker for v1 notifications | Unnecessary complexity; PROJECT.md explicitly defers this to v2 | Export time constants as stubs |
| @supabase/auth-helpers or @supabase/ssr | These packages add auth session management — a personal single-user tool has no auth | Direct `@supabase/supabase-js` client |

---

## Stack Patterns by Variant

**For the Typeform-style win input flow:**
- Use `motion` (`AnimatePresence` + `motion.div`) for slide/fade transitions between steps
- Use `react-hook-form` with `mode: 'onSubmit'` — validate on Enter key press
- Use Zustand to hold the current step index so the step counter in the UI stays in sync
- Wrap each step in a unique `key` prop so `AnimatePresence` treats step changes as unmount/mount

**For the stopwatch per win card:**
- Use the custom `useStopwatch` hook described above
- Store `accumulatedMs` in Supabase on pause — not in Zustand (it's persistent data, not UI state)
- Store `isRunning` in Zustand (UI state, not persistent)

**For dark mode toggle:**
- Store `theme: 'light' | 'dark' | 'system'` in Zustand with `persist` middleware (localStorage key: `wintrack-theme`)
- On mount, read the persisted value and toggle `document.documentElement.classList`
- `'system'` reads `window.matchMedia('(prefers-color-scheme: dark)')` and applies class accordingly

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| framer-motion ^12.x | React ^19.x | v12 added React 19 support; earlier versions had peer dep conflicts |
| zustand ^5.0.x | React ^19.x | Confirmed compatible; uses React 18+ stable API |
| @supabase/supabase-js ^2.98.x | React ^19.x | Supabase JS is framework-agnostic; no React peer dep |
| react-hook-form ^7.71.x | React ^19.x | Actively maintained; React 19 testing noted in changelog |
| tailwindcss ^4.2.x | tw-animate-css ^1.4.x | tw-animate-css was written specifically for Tailwind v4 CSS-first architecture |
| date-fns ^4.x | TypeScript 5.x | v4 ships its own types; no @types/date-fns needed |

---

## Sources

- Tailwind CSS official docs — dark mode `@custom-variant` pattern confirmed: https://tailwindcss.com/docs/dark-mode (MEDIUM confidence — page rendered CSS-only, content verified)
- WebSearch consensus (multiple DEV.to, makersden.io, mikul.me articles) — Zustand recommended for medium apps 2025 (MEDIUM confidence)
- GitHub pmndrs/zustand releases — v5.0.11 latest, Feb 2025 (MEDIUM confidence)
- npmjs.com framer-motion — v12.35.1 latest, React 19 compatible (MEDIUM confidence via search result)
- motion.dev GitHub — `npm install motion`, import from `motion/react` (MEDIUM confidence)
- Framer community forums — v12 alpha specifically targeted React 19 RC compatibility (MEDIUM confidence)
- WebSearch consensus — react-hook-form v7.71.2, 8.6 kB, actively maintained (MEDIUM confidence)
- GitHub Wombosvideo/tw-animate-css — explicit Tailwind v4 replacement for tailwindcss-animate (HIGH confidence)
- Supabase official docs — anon key + RLS disabled = valid single-user pattern (MEDIUM confidence via search result)
- WebSearch consensus — timestamp-based timer accuracy over setInterval-only increment (HIGH confidence)
- WebSearch consensus — date-fns is shadcn/ui ecosystem standard, tree-shakeable (MEDIUM confidence)

---
*Stack research for: wintrack — personal accountability and focus tracker SPA*
*Researched: 2026-03-09*
