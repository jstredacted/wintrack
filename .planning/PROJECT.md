# wintrack

## What This Is

wintrack is a personal accountability tracker with a deliberate, distraction-free interface. Declare intentions each morning, complete them through the day, reflect in your journal at night. Built with Nothing Phone's monochrome design language — dot grids, monospaced type, structured negative space, strictly black and white.

## Core Value

The daily discipline loop: set intentions in the morning, complete them through the day, reflect honestly at night.

## Requirements

### Validated

- ✓ Multi-win entry with Typeform-style full-screen flow — v1.0
- ✓ Inline win completion toggle with strikethrough styling — v1.0
- ✓ Win categories (work/personal/health) with badges and completion counts — v1.0
- ✓ Night-owl day boundary (configurable dayStartHour) — v1.0
- ✓ GitHub-style 84-day consistency heatmap with intensity shading — v1.0
- ✓ Category radar chart showing win distribution — v1.0
- ✓ Push notifications via Web Push API, service worker, Supabase Edge Function — v1.0
- ✓ Configurable morning/evening notification hours — v1.0
- ✓ Journal with categories (Daily/Milestone/Financial) and FAB entry — v1.0
- ✓ Unified daily view with DayStrip carousel (Today + History merged) — v1.0
- ✓ Streak counter based on completed wins per day — v1.0
- ✓ Roll-forward incomplete wins to next day — v1.0
- ✓ Dark/light mode toggle — v1.0
- ✓ Dev tools panel (Ctrl+Shift+D) for test data seeding — v1.0
- ✓ Settings page with persistence to Supabase + localStorage cache — v1.0

### Active

(None — next milestone not yet planned)

### Out of Scope

- Multi-user / auth — personal tool, no accounts needed
- AI coaching or suggestions — not this product's character
- Social / sharing — personal accountability, not social
- Mobile app — web-first, Vercel deployment covers mobile browser
- Streak freeze / grace mechanics — roll-forward is the compassion mechanism

## Context

- **v1.0 shipped:** 2026-03-16
- **Scale:** 3,274 LOC (src), 2,270 LOC (tests), 264 commits, 7 phases, 18 plans
- **Tests:** 149 passing across 25 files
- **Timeline:** 8 days (Mar 9-16, 2026)
- **Stack:** Vite + React 19, Tailwind v4, shadcn/ui (Nova preset), Supabase JS, Lucide icons, vite-plugin-pwa
- **Deploying to:** Vercel
- **Single user** — no auth; Supabase for persistence only (anon key + RLS)
- **Design:** Nothing Phone Glyph Matrix — strictly black/white, monospaced type, dot grids, structured negative space

## Constraints

- **Tech stack**: Vite + React 19, Tailwind v4, shadcn/ui, Supabase, Vercel — no deviations
- **Design**: Black/white only, no color accents, no gradients — enforced aesthetic
- **Scope**: Single user, no auth — keeps architecture simple
- **Animations**: Plain @keyframes + state machine pattern (tw-animate-css conflicts with motion v12)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| No auth layer | Personal tool — single user | ✓ Simple, no friction |
| Supabase for persistence | Cross-device sync, anon key + RLS | ✓ Works well |
| `motion` package (not framer-motion) | Rebranded at v12 | ✓ Import from "motion/react" |
| Timer uses wall-clock timestamps | Survives background tabs | ✓ Accurate |
| Streak uses Intl.DateTimeFormat | Avoids timezone boundary corruption | ✓ Never corrupts |
| Tailwind v4 dark mode via @custom-variant | v3 `darkMode: 'class'` syntax doesn't work | ✓ Correct v4 approach |
| Plain @keyframes over tw-animate-css | CSS `translate` vs `transform: translate3d()` conflict | ✓ State machine pattern |
| Remove check-in flow | Redundant — toggle on wins is sufficient | ✓ Simpler UX |
| Streak from wins.completed directly | No check_ins table dependency | ✓ Clean data model |
| Unified daily view (Today + History) | DayStrip carousel replaces separate pages | ✓ Better navigation |
| Journal FAB (Nothing design) | Fixed circular button, monochrome | ✓ Clean, accessible |
| SVG heatmap with inline fill | Tailwind bg-* doesn't work on SVG rect | ✓ CSS variables for fill |
| Night-owl day offset | Configurable dayStartHour for late users | ✓ Correct attribution |
| Web Push via Edge Function + pg_cron | Hourly check against user settings | ✓ Free tier compatible |

---
*Last updated: 2026-03-16 after v1.0 milestone*
