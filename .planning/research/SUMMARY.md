# Project Research Summary

**Project:** wintrack
**Domain:** Personal accountability and focus tracker SPA (single-user, no auth)
**Researched:** 2026-03-09
**Confidence:** HIGH

## Executive Summary

wintrack is a single-user personal productivity SPA centered on a daily ritual loop: declare wins in the morning, track focused time during the day, and close out with an evening check-in. The genre is well-studied — Stoic, Streaks, Centered, and Reflect all solve adjacent problems — but no existing app combines the Typeform-style single-question commitment flow with an embedded per-win stopwatch and a Nothing Phone-inspired monochrome aesthetic. The recommended approach is to build a vertical slice through the complete daily loop (log → track → check-in → streak) before adding any secondary features. The scaffold is already healthy: Vite 7 + React 19 + Tailwind v4 + shadcn/ui + Supabase is the correct foundation, and four libraries need to be added (Zustand, framer-motion, react-hook-form, date-fns).

The primary UX bet is the Typeform-style full-screen win input flow. Research confirms this pattern achieves 2x completion rates by eliminating multi-field cognitive load. It also introduces the most concentrated set of technical risks in the project: AnimatePresence layout containment, focus management on step transitions, and prefers-reduced-motion compliance must all be addressed in the same phase they are built — retrofitting any of these is expensive. The architecture is deliberately flat: feature hooks own their DB queries, no global state library is needed beyond Zustand for theme and stopwatch running-state, and streak is computed from the wins table rather than stored as a derived column.

The most critical risk is deceptively invisible: timer state must be modeled as wall-clock timestamps from day one, not as incrementing counters. setInterval drift, background tab throttling, and page-refresh state loss are three separate failure modes that all stem from the same root cause — treating setInterval as a metronome rather than a render trigger. The fix is the same for all three: store startedAt as a timestamp, compute elapsed as Date.now() - startedAt, and persist accumulated milliseconds to Supabase on pause/stop. The Supabase schema must include timer columns before any UI is built. RLS must be enabled before any application code runs.

## Key Findings

### Recommended Stack

The scaffold already contains the right core: Vite 7, React 19, Tailwind v4 (CSS-first, no config file), shadcn/ui with Nova preset, @supabase/supabase-js, and Lucide React. Four additions are needed. Zustand 5 handles global state (dark mode preference via persist middleware, stopwatch running state) without a Provider wrapper and with surgical per-component re-renders — critical when a 100ms timer interval must not re-render the entire app. framer-motion 12 (React 19 compatible) handles the Typeform-style AnimatePresence transitions; its useReducedMotion() hook is the correct accessibility escape hatch. react-hook-form 7 handles the per-step form submission with zero re-renders during typing. date-fns 4 handles date display and is the shadcn/ui ecosystem standard.

No additional data-fetching abstraction is needed. The correct Supabase pattern for a single-user no-auth app is a singleton client + custom feature hooks (useWins, useCheckIn, useJournal, useStreak). TanStack Query adds cache complexity with no benefit when there is only one writer. The dark mode pattern for Tailwind v4 is a one-line @custom-variant directive in index.css — the tailwind.config.js darkMode option does not exist in v4.

**Core technologies:**
- Vite 7 + React 19: already in scaffold — fastest HMR, concurrent features for step flow transitions
- Tailwind v4 + shadcn/ui: already in scaffold — CSS-first config, copy-owned components on Radix primitives
- Supabase (@supabase/supabase-js 2): already in scaffold — anon key + RLS = correct single-user pattern
- Zustand 5: add immediately — dark mode persistence and stopwatch running-state without Provider
- framer-motion 12: add at Typeform flow phase — AnimatePresence + useReducedMotion + variant orchestration
- react-hook-form 7: add at win input phase — uncontrolled inputs, zero re-renders during typing
- date-fns 4: add at win card / history phase — tree-shakeable, shadcn/ui ecosystem standard

### Expected Features

Research validated all nine v1 features against the genre's established patterns and confirmed clear feature dependencies. Win logging is the root domain object — check-in, stopwatch, streak, and roll-forward all depend on wins existing. The journal is fully independent of wins and can be built in any order. Visual history requires both win and check-in data to be meaningful.

The primary differentiator is the Typeform-style win input UX — no app in this space uses it for daily commitment logging. The rollover mechanic (roll incomplete wins forward rather than marking them as failures) is a genuine gap in the market; Stoic and Streaks both lack it. The Nothing Phone monochrome aesthetic is an enforced design constraint, not ongoing feature work.

**Must have (table stakes):**
- Win logging (Typeform-style full-screen flow) — the core commitment act; all other features depend on it
- Evening check-in (binary yes/no per win + optional reflection note) — closes the daily loop
- Streak counter — genre lingua franca; simple to implement, high perceived value
- Roll incomplete wins forward — compassion mechanic; explicit confirmation required
- Per-win stopwatch (start/stop/pause, cumulative time) — embedded focus tracking; differentiator
- Daily journal (title + body, one per day) — independent of wins; supports evening ritual
- Visual history (past days, win/completion status) — makes streak meaningful
- Dark/light mode — Tailwind v4 handles cheaply
- Notification time stubs (9am/9pm shown in UI, no actual push) — sets v2 expectations

**Should have (competitive):**
- Typeform-style step transitions with full-screen layout — the primary UX differentiator
- Evening reflection note per win — qualitative texture alongside the binary check-in
- Streak opt-out toggle — product respect for intrinsic motivation over engagement metrics
- Nothing Phone / dot-grid aesthetic — distinct visual identity

**Defer (v2+):**
- Browser push notifications (Service Worker + vite-plugin-pwa) — validate demand first
- Offline-first with conflict resolution — requires auth layer reconsideration
- Weekly pattern review — add after daily loop proves stable
- Export / data portability — important for trust, not urgent

**Anti-features to avoid:**
- Win categories/types: adds input friction at exactly the wrong moment
- AI coaching/prompts: changes the emotional register from deliberate self-accountability to "the app is talking to me"
- Social features/leaderboards: undermines the private reflective ritual
- Streak freeze mechanic: make the required action small instead (one win = streak continues)

### Architecture Approach

The architecture is a feature-sliced SPA with four vertical modules (wins, checkin, timer, journal) plus a shared StepFlow component, a lib layer (Supabase singleton, date utilities), and thin page composition layers. No global state library beyond Zustand is needed — each feature hook owns its DB queries and local state. The streak is computed from wins table queries, not stored as a derived column. Pages import from features; features never import from pages. This is a deliberately flat architecture appropriate for a single-user personal tool.

The Supabase schema needs three tables from day one: wins (with timer columns: elapsed_ms, and the schema must accommodate timer_started_at for running-state recovery), check_ins (one row per win per day, enforced by unique index), and journal_entries (one row per day, upsert pattern). RLS must be enabled before application code runs.

**Major components:**
1. WinInputFlow (StepFlow + useWins) — Typeform-style win creation; local step state, single DB insert on completion
2. CheckInFlow (useCheckIn + useWins) — Evening step-per-win review; batch upsert to check_ins on completion
3. useStopwatch hook — Wall-clock timestamp model, 100ms interval for display only, elapsed flushed to DB on pause/stop
4. useStreak hook — Computes streak from wins table query; re-queried after check-in completion
5. TodayPage — Composes wins list, add CTA, streak badge, check-in entry point
6. ThemeProvider + Zustand persist — Class-based dark mode via @custom-variant, localStorage via Zustand persist middleware

### Critical Pitfalls

1. **Timer drift (setInterval as elapsed accumulator)** — Use wall-clock delta: store startedAt = Date.now() on start, compute elapsed = Date.now() - startedAt + accumulated on each tick. Never use setElapsed(prev => prev + 100). Apply from the first line of useStopwatch.

2. **Timer state lost on page refresh** — The wins table must include timer columns (elapsed_ms at minimum, timer_started_at for running-state recovery) from day one of schema design. Do not treat timer state as ephemeral UI state.

3. **Streak corrupted by UTC vs local date boundary** — Never use new Date().toISOString().slice(0, 10) for date comparisons. Write a single getLocalDateString() utility using Intl.DateTimeFormat with the browser's resolved timezone and use it everywhere. Write it in lib/dates.ts before building any date-dependent feature.

4. **AnimatePresence layout shift (entering and exiting steps stack vertically)** — The StepFlow container must use position: relative with overflow: hidden, and each step must use position: absolute; inset: 0. Establish this layout scaffolding before building individual step content. Use AnimatePresence mode="wait".

5. **Typeform focus management broken for keyboard users** — After each step transition, call requestAnimationFrame(() => inputRef.current?.focus()) via useEffect. Exiting elements must be removed from tab order (tabIndex={-1} or aria-hidden). Write a Tab-key-only navigation smoke test as part of the definition of done for the win input flow.

6. **Supabase RLS disabled exposes all data** — Enable RLS on all tables before writing application code. With no auth layer, the correct posture is RLS enabled with restrictive policies. Configure in the Supabase setup phase; do not defer.

7. **prefers-reduced-motion ignored** — Use framer-motion's useReducedMotion() hook in every animation variant. The form still steps through questions; it cross-fades instead of sliding. Add this at the same time as the base animation, not as a later accessibility cleanup.

## Implications for Roadmap

Based on research, the dependency graph of features and the concentration of technical risk in the timer and animation subsystems suggest a 6-phase structure. The wins data model is the root dependency for most features; timer correctness must be established before the stopwatch UI exists; the Typeform flow is the primary UX bet and its pitfalls must be addressed in one focused phase.

### Phase 1: Foundation — Schema, Client, Theme
**Rationale:** RLS must be enabled before application code. Timer columns belong in the schema from day one, not retrofitted. Dark mode architecture in Tailwind v4 requires a one-time CSS setup that affects every subsequent component.
**Delivers:** Supabase project with all three tables (wins, check_ins, journal_entries) and RLS configured; singleton Supabase client in lib/supabase.ts; Zustand store with persist middleware; ThemeProvider with @custom-variant dark mode; lib/dates.ts with getLocalDateString() utility.
**Addresses:** Win logging (data model), streak (date utility), dark/light mode (table stakes)
**Avoids:** RLS exposure (Pitfall 5), UTC date boundary corruption (Pitfall 4), hardcoded colors creating high-recovery-cost debt
**Research flag:** Standard patterns — skip research-phase. Supabase schema design, Zustand persist, and Tailwind v4 dark mode are all well-documented.

### Phase 2: Win Logging — Core Domain Object
**Rationale:** Wins are the root dependency. Check-in, stopwatch, streak, and roll-forward cannot be built without win records. The Typeform UX is the primary differentiator and deserves its own focused phase.
**Delivers:** WinInputFlow (StepFlow component + useStepFlow hook + step content), WinCard, WinList, useWins hook, TodayPage skeleton. Full keyboard navigation. AnimatePresence layout containment. prefers-reduced-motion compliance.
**Uses:** framer-motion (AnimatePresence, useReducedMotion), react-hook-form, Zustand (step index), Supabase (insert on final step)
**Implements:** StepFlow component, Wins feature module
**Avoids:** AnimatePresence layout shift (Pitfall 7), focus management breakage (Pitfall 6), prefers-reduced-motion violation (Pitfall 8)
**Research flag:** Needs research-phase during planning. The AnimatePresence + focus management + reduced-motion combination has specific implementation nuances. The pitfalls research provides the patterns, but a planning-phase review of the StepFlow implementation before building is recommended.

### Phase 3: Focus Tracking — Stopwatch
**Rationale:** Stopwatch attaches to win records (which now exist). All three timer failure modes (drift, background throttling, page-refresh loss) must be solved together in this phase — they share the same root fix and cannot be deferred independently.
**Delivers:** useStopwatch hook (wall-clock timestamp model), TimerDisplay component, WinCard integration, elapsed_ms persistence to Supabase on pause/stop, Page Visibility API integration, beforeunload flush.
**Uses:** useRef for startTimeRef/intervalRef, useState for display only, Supabase update on pause/stop
**Implements:** Timer feature module
**Avoids:** Timer drift (Pitfall 1), background tab throttling (Pitfall 2), timer state lost on refresh (Pitfall 3)
**Research flag:** Standard patterns — the exact useStopwatch implementation is documented in both STACK.md and ARCHITECTURE.md. No additional research needed.

### Phase 4: Daily Loop Closure — Check-in, Streak, Roll-forward
**Rationale:** These three features form the accountability half of the daily loop. They share a data dependency (all read/write wins.status) and a UX pattern (the check-in flow reuses StepFlow). Streak is a cheap byproduct of having check-in data. Roll-forward completes the compassion mechanic.
**Delivers:** CheckInFlow (step-per-win yes/no + optional reflection), useCheckIn hook, batch upsert to check_ins, wins.status update, useStreak hook (client-side computation, no DB column), StreakBadge, RollForwardDialog (explicit confirmation UI).
**Uses:** StepFlow (reused from Phase 2), Supabase (batch upsert, wins.status update), date-fns (streak date comparison via getLocalDateString)
**Implements:** CheckIn feature module, Streak feature module
**Avoids:** Streak UTC/timezone corruption (Pitfall 4), silent roll-forward without confirmation (UX pitfall)
**Research flag:** Standard patterns for the streak computation. The roll-forward state machine (pending → rolled, rolled_from lineage) is straightforward but deserves a planning sketch before implementation.

### Phase 5: Journal and History
**Rationale:** Journal is fully independent of wins and can be built any time after the foundation. History is a read-only view that requires wins and check-in data to exist. Both are lower-complexity features that complete the v1 feature set.
**Delivers:** JournalEditor, JournalEntry, useJournal hook (upsert pattern), HistoryPage (calendar or list view of past days with win/completion status), visual streak calendar grid.
**Uses:** Supabase (upsert for journal, date-range query for history), date-fns (date formatting, relative time)
**Implements:** Journal feature module, History page
**Avoids:** Fetching all wins without date filter (performance trap — use .gte() filter for history queries)
**Research flag:** Standard patterns. No research-phase needed.

### Phase 6: Polish — Notification Stubs, Settings, Aesthetic Refinement
**Rationale:** Settings (theme toggle) and notification stubs (showing 9am/9pm times in UI) are low-complexity features that should come last to avoid the hardcoded-color anti-pattern. The aesthetic system (near-black/near-white tokens, dot-grid patterns, monospaced type) is best locked in here with a full component audit.
**Delivers:** SettingsPage, notification time display (UI only, no push), full dark/light mode audit (no hardcoded text-white/text-black), near-black (#0A0A0A) / near-white (#F5F5F5) color token enforcement, dot-grid aesthetic implementation.
**Uses:** Zustand persist (theme), Tailwind v4 dark: variants across all components
**Avoids:** Pure #000/#FFF eye strain (UX pitfall), hardcoded colors requiring high-recovery-cost refactor
**Research flag:** Standard patterns. No research-phase needed.

### Phase Ordering Rationale

- Schema must precede all feature phases because timer columns, RLS, and the date utility are required infrastructure — retrofitting any of these is rated MEDIUM to HIGH recovery cost in pitfalls research.
- Win logging must precede check-in, stopwatch, streak, and roll-forward because wins is the root dependency for all of them (FEATURES.md dependency graph confirms this explicitly).
- Stopwatch is isolated in its own phase because its three failure modes (drift, throttling, refresh loss) must be solved atomically — a partial implementation creates invisible data corruption.
- Check-in, streak, and roll-forward are grouped because they share wins.status as a communication channel and form a coherent user-facing ritual.
- Journal and history are decoupled and can technically slot into any phase after Phase 1, but are best deferred until the core loop is stable.
- Polish comes last to avoid the high-recovery-cost pitfall of hardcoded colors scattered across components.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Win Logging / Typeform UX):** The combination of AnimatePresence + position:absolute layout + focus management + useReducedMotion has multiple interacting concerns. A planning-phase implementation sketch is recommended before full build. The pitfalls research provides the exact patterns but the StepFlow component is architecturally central and worth careful upfront design.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Supabase schema design, Zustand persist, Tailwind v4 dark mode are all documented with high confidence.
- **Phase 3 (Stopwatch):** The exact useStopwatch implementation pattern is fully specified in STACK.md and ARCHITECTURE.md.
- **Phase 4 (Check-in / Streak / Roll-forward):** Streak computation pattern is fully documented; batch upsert is a standard Supabase pattern.
- **Phase 5 (Journal / History):** Simple CRUD + read-only view; no novel patterns.
- **Phase 6 (Polish):** Theme audit and notification stubs are mechanical tasks.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core stack confirmed via official docs; version compatibility table validated; all alternatives explicitly evaluated |
| Features | HIGH | Validated against 4 competitor apps (Stoic, Streaks, Centered, Reflect) and UX research literature; feature dependencies mapped explicitly |
| Architecture | HIGH | Patterns derived from first principles with PostgreSQL best practices; component boundaries are unambiguous; build order confirmed by dependency analysis |
| Pitfalls | HIGH | 8 critical pitfalls documented with prevention code, warning signs, and recovery cost ratings; most verified via official docs or multiple sources |

**Overall confidence:** HIGH

### Gaps to Address

- **RLS implementation detail:** PITFALLS.md identifies three options (Option A/B/C) for RLS posture. Option B (hardcoded UUID in settings table, service role key server-side) is the most secure but requires deciding whether to use Vercel serverless functions as a proxy. Option C (RLS with USING (false) for anon role, accepting that Supabase calls must be proxied) is a valid pragmatic minimum. This decision should be made and documented in Phase 1 before writing any application code.

- **Timer running-state recovery:** PITFALLS.md notes that persisting timer_started_at enables recovery of a running timer across a page refresh. ARCHITECTURE.md's schema shows elapsed_ms but does not include timer_started_at. The schema design in Phase 1 should explicitly decide whether to support mid-session refresh recovery (requires timer_started_at column) or to accept that a page refresh during an active session loses the current-session increment (only the previously accumulated elapsed_ms is preserved). For a personal tool, the latter is acceptable but should be a conscious decision.

- **Streak leniency model:** FEATURES.md notes a potential v1.x "grace window" for streak (midnight + 1 hour) and a "lenient streak" (count days with any activity, not just complete wins) as alternatives. PITFALLS.md flags streak anxiety as a UX pitfall. The streak definition should be finalized in Phase 4 planning rather than discovered during implementation.

## Sources

### Primary (HIGH confidence)
- Supabase official docs — RLS configuration, anon key pattern, schema design
- tw-animate-css GitHub (Wombosvideo) — Tailwind v4 replacement for tailwindcss-animate confirmed
- Framer Motion / Motion.dev official docs — AnimatePresence, useReducedMotion, React 19 compatibility (v12)
- WCAG 2.3.3 — Animation from Interactions (prefers-reduced-motion requirement)
- MDN — Page Visibility API

### Secondary (MEDIUM confidence)
- WebSearch consensus (multiple sources) — Zustand v5 recommended for mid-size React apps 2025
- WebSearch consensus — react-hook-form v7.71.2, 8.6 kB, actively maintained
- WebSearch consensus — date-fns is shadcn/ui ecosystem standard
- WebSearch consensus — timestamp-based timer accuracy vs setInterval increment
- Tailwind CSS official docs — dark mode @custom-variant pattern
- Typeform one-field onboarding UX research (Startup Spells) — 2x completion rate uplift
- Streaks app gamification case study (Trophy.so) — deliberate exclusions, streak philosophy
- Smashing Magazine — Designing a streak system: UX and psychology
- Stoic App features page and 2025 update blog post

### Tertiary (contextual)
- Feature-Sliced Design architecture documentation
- React folder structure guides (Robin Wieruch, multiple sources)
- Framer Motion multistep wizard recipe (buildui.com)
- Pure black and pure white in UI design (Supercharge Design)

---
*Research completed: 2026-03-09*
*Ready for roadmap: yes*
