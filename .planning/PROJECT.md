# wintrack

## What This Is

wintrack is a personal accountability and focus tracker for solo use. It helps you declare what you're committing to each day, check in on whether you followed through, and track time spent — all wrapped in a deliberate, distraction-free interface that treats focus as a ritual. The v1.0 daily discipline loop shipped 2026-03-11 across 7 phases, 34 plans, and 2 days of execution.

## Core Value

The daily discipline loop: declare wins in the morning, complete them through the day, evaluate honestly at night.

## Requirements

### Validated

- ✓ User can log wins using a full-screen Typeform-style input flow (one step at a time, animated transitions) — v1.0
- ✓ User can declare wins anytime; 9am notification prompts if none logged yet — v1.0
- ✓ User can complete evening check-in (binary yes/no per win + optional reflection note); 9pm notification prompts if not done — v1.0
- ✓ User can roll incomplete wins to the next day — v1.0
- ✓ User can start/stop/pause a stopwatch per win; cumulative time displayed on win card — v1.0
- ✓ User can write a daily journal entry (title + body only, separate from wins) — v1.0
- ✓ Streak counter increments when at least one win is marked complete AND journal entry written for the day — v1.0
- ✓ Dark/light mode toggle — v1.0

### Out of Scope

- Multi-user / auth — personal tool, no accounts needed
- Win types/categories — freeform text only, user decides meaning
- Journal tags or categories — deliberately minimal
- Notifications infrastructure (v1 stubs the 9am/9pm times with documented path; actual push/browser notification delivery is v2)

## Context

- **v1.0 shipped:** 2026-03-11
- **Scale:** 4,786 LOC (src), 164 commits, 7 phases, 34 plans, 2 days (Mar 9-11 2026)
- **Tests:** 117 passing
- **Stack:** Vite + React 19, Tailwind v4, shadcn/ui (Nova preset, Radix primitives), Supabase JS client, Lucide icons
- **Deploying to:** Vercel
- **Single user** — no auth layer needed; Supabase used for persistence only
- Design language: strictly black and white, dark/light mode toggle. Inspired by Nothing Phone Glyph Matrix — dot grid patterns, monospaced type, structured negative space, technical precision. No gradients, no color accents, no illustrations.
- Win input UX: Typeform energy — full-screen, one question at a time, smooth transitions
- Check-in and journal UX: Stoic app energy — whitespace-heavy, serif or mono font, meditative pacing

## Constraints

- **Tech stack**: Vite + React 19, Tailwind v4, shadcn/ui, Supabase, Vercel — no deviations
- **Design**: Black/white only, no color accents, no gradients — enforced aesthetic constraint
- **Scope**: Single user, no auth — keeps architecture simple

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| No auth layer | Personal tool — single user, no accounts needed | Validated — simple, no friction |
| Supabase for persistence | Already in scaffold; persistent across devices/sessions | Validated — anon key + RLS works well |
| Typeform UX for win input | Focused input reduces friction, forces one commitment at a time | Validated — high-quality feel |
| Stoic app UX for check-ins | Ritual feeling over task management feeling | Validated — meditative, distraction-free |
| Incomplete wins roll forward | Supports honesty without penalty — you decide tomorrow | Validated — natural daily flow |
| Use `motion` package (not framer-motion) | Rebranded at v12; framer-motion is the legacy alias | Validated — import from "motion/react" |
| Timer uses wall-clock timestamps | `Date.now() - startedAt` survives background tabs and page refreshes; setInterval drifts | Validated — accurate across all scenarios |
| Streak uses Intl.DateTimeFormat | `en-CA` format gives YYYY-MM-DD in local timezone; `.toISOString().slice(0,10)` corrupts on timezone boundaries | Validated — streak never corrupts |
| Tailwind v4 dark mode via @custom-variant | `@custom-variant dark` in CSS; `darkMode: 'class'` config is v3 syntax | Validated — correct v4 approach |
| Combined streak requires both check-in AND journal | Stronger accountability signal — both acts of reflection required | Validated — motivates full loop completion |
| Animation pattern: plain @keyframes + state machine | tw-animate-css conflicts with motion v12 (CSS `translate` vs `transform: translate3d()`); direct @keyframes avoid conflict | Validated — `visible/exiting` useState + `onAnimationEnd` to unmount |
| CHECKIN-04 push notifications deferred to v2 | Service worker / Web Push infrastructure out of scope for v1; stubs document intent | Validated — UI stubs in place, delivery is v2 |

---
*Last updated: 2026-03-11 after v1.0 milestone*
