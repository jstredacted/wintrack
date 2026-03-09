# wintrack

## What This Is

wintrack is a personal accountability and focus tracker for solo use. It helps you declare what you're committing to each day, check in on whether you followed through, and track time spent — all wrapped in a deliberate, distraction-free interface that treats focus as a ritual.

## Core Value

The daily discipline loop: declare wins in the morning, complete them through the day, evaluate honestly at night.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can log wins using a full-screen Typeform-style input flow (one step at a time, animated transitions)
- [ ] User can declare wins anytime; 9am notification prompts if none logged yet
- [ ] User can complete evening check-in (binary yes/no per win + optional reflection note); 9pm notification prompts if not done
- [ ] User can roll incomplete wins to the next day
- [ ] User can start/stop/pause a stopwatch per win; cumulative time displayed on win card
- [ ] User can write a daily journal entry (title + body only, separate from wins)
- [ ] Streak counter increments when at least one win is marked complete for the day
- [ ] Dark/light mode toggle

### Out of Scope

- Multi-user / auth — personal tool, no accounts needed
- Win types/categories — freeform text only, user decides meaning
- Journal tags or categories — deliberately minimal
- Notifications infrastructure (v1 will stub/document the 9am/9pm times; actual push/browser notifications are v2)

## Context

- Existing scaffold: Vite + React 19, Tailwind v4, shadcn/ui (Nova preset, Radix primitives), Supabase JS client, Lucide icons
- Deploying to Vercel
- Single user — no auth layer needed; Supabase used for persistence only
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
| No auth layer | Personal tool — single user, no accounts needed | — Pending |
| Supabase for persistence | Already in scaffold; persistent across devices/sessions | — Pending |
| Typeform UX for win input | Focused input reduces friction, forces one commitment at a time | — Pending |
| Stoic app UX for check-ins | Ritual feeling over task management feeling | — Pending |
| Incomplete wins roll forward | Supports honesty without penalty — you decide tomorrow | — Pending |

---
*Last updated: 2026-03-09 after initialization*
