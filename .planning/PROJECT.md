# wintrack

## What This Is

wintrack is a personal accountability and finance tracker with a deliberate, distraction-free interface. Declare intentions each morning, complete them through the day, reflect in your journal at night, and manage your personal finances — all behind a PIN-protected gate. Built with Nothing Phone's monochrome design language — dot grids, monospaced type, structured negative space, strictly black and white.

## Core Value

The daily discipline loop: set intentions in the morning, complete them through the day, reflect honestly at night — now integrated with personal finance management for a complete life dashboard.

## Requirements

### Validated

**v1.0 — Daily Discipline Loop:**
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

**v2.0 — Finance & Platform:**
- ✓ TypeScript migration (strict mode, generated Supabase types) — v2.0
- ✓ Dev branch workflow with mobile dev server — v2.0
- ✓ PIN authentication with setup flow, idle timeout, session management — v2.0
- ✓ Balance tracking with manual override and history — v2.0
- ✓ Monthly budget with progress visualization — v2.0
- ✓ Income sources with currency conversion (Wise/PayPal fees) — v2.0
- ✓ Bills management with recurrence (one-time, recurring, ongoing) — v2.0
- ✓ Bill edit and delete from UI — v2.0
- ✓ Year overview with 12-month columns, balance sparkline, journal count — v2.0
- ✓ Month navigation with query param deep-linking — v2.0
- ✓ One-off income tracking — v2.0
- ✓ Balance change history with revert capability — v2.0
- ✓ Tiptap rich text editor with slash commands and markdown shortcuts — v2.0
- ✓ Mobile bottom tab bar with responsive layout across all pages — v2.0
- ✓ DayStrip centering and dayStartHour bug fixes — v2.0

### Active

(No active requirements — next milestone not yet defined)

### Out of Scope

- Multi-user / auth — personal tool, no accounts needed
- AI coaching or suggestions — not this product's character
- Social / sharing — personal accountability, not social
- Native mobile app — web-first, PWA covers mobile
- Streak freeze / grace mechanics — roll-forward is the compassion mechanism
- External balance integrations (bank APIs) — manual entry preferred
- Biometric auth — PIN is sufficient for personal use

## Context

- **v2.0 shipped:** 2026-03-23
- **Scale:** 12,891 LOC TypeScript, 240 tests passing, 176 commits in v2.0
- **Timeline:** v2.0 in 7 days (Mar 16-23, 2026)
- **Stack:** Vite + React 19, Tailwind v4, shadcn/ui (Nova preset), Supabase JS, Tiptap v3, Lucide icons, vite-plugin-pwa
- **Deploying to:** Vercel
- **Single user** — PIN gate for privacy; Supabase for persistence (anon key + RLS)
- **Design:** Nothing Phone Glyph Matrix — strictly black/white, monospaced type, dot grids, structured negative space
- **Mobile:** 16px base font on mobile (18px desktop), bottom tab bar, responsive layouts, visualViewport keyboard tracking

## Constraints

- **Tech stack**: Vite + React 19, Tailwind v4, shadcn/ui, Supabase, Vercel — no deviations
- **Design**: Black/white only, no color accents, no gradients — enforced aesthetic
- **Scope**: Single user, PIN-gated — keeps architecture simple
- **Animations**: Plain @keyframes + state machine pattern (tw-animate-css conflicts with motion v12)
- **Font**: Geist Mono Variable throughout — no font pairing

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
| Unified daily view (Today + History) | DayStrip carousel replaces separate pages | ✓ Better navigation |
| Journal FAB (Nothing design) | Fixed circular button, monochrome | ✓ Clean, accessible |
| PIN gate with SHA-256 | Simple 4-digit PIN, JS fallback for non-secure contexts | ✓ Works on LAN + HTTPS |
| HTML body_format for journal | Tiptap StarterKit HTML round-trips cleanly | ✓ Simple storage |
| Horizontal month nav (no swipe) | Vertical swipe conflicted with page scroll on mobile | ✓ Standard < Month > pattern |
| Module-level finance cache | Prevents "Loading..." flash when switching months | ✓ Instant revisits |
| 16px mobile base font | 18px desktop was too large on phone ("grandpa mode") | ✓ Native-feeling density |
| visualViewport keyboard tracking | iOS `position: sticky` doesn't work with virtual keyboard | ✓ Toolbar follows keyboard |

---
*Last updated: 2026-03-23 after v2.0 milestone*
