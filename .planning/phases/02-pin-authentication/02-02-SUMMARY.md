---
phase: 02-pin-authentication
plan: "02"
subsystem: auth
tags: [pin, sha256, zustand, web-crypto, idle-timer]

requires:
  - phase: 02-01
    provides: hashPin, pinStore, usePinAuth, useIdleTimer, CSS keyframes
provides:
  - PinDots component (dot display with fill animation, shake on error)
  - PinScreen component (full-screen lock screen, keyboard-driven)
  - PinSetup component (two-step enter/confirm flow)
  - PinGate layout route (wraps AppShell, conditional rendering)
  - Lock button in SideNav
  - Change PIN with admin password in Settings
affects: [all-pages, router, settings]

tech-stack:
  added: []
  patterns: [module-level state for cross-render persistence, layout route gating]

key-files:
  created:
    - src/components/auth/PinDots.tsx
    - src/components/auth/PinScreen.tsx
    - src/components/auth/PinSetup.tsx
    - src/components/auth/PinGate.tsx
  modified:
    - src/App.tsx
    - src/components/layout/SideNav.tsx
    - src/pages/SettingsPage.tsx
    - src/stores/pinStore.ts
    - src/hooks/usePinAuth.ts
---

## What was built

PIN authentication UI and integration:

1. **PinDots** — 4-dot indicator with fill animation, shake + destructive color on error. No digit reveal (removed per user preference).
2. **PinScreen** — Full-screen vertically-centered lock screen. Keyboard-driven auto-submit on 4th digit.
3. **PinSetup** — Two-step creation flow (enter → confirm → mismatch resets after 1.5s).
4. **PinGate** — Layout route wrapping AppShell in React Router. Conditional rendering prevents data fetching while locked. States: loading → setup/locked → unlocked.
5. **Lock button** — Lock icon in SideNav above theme toggle for instant lock.
6. **Change PIN** — Security section in Settings, gated behind admin password.
7. **Idle timer** — Locks after 15 min of no interaction.

## Deviations from plan

- **Digit reveal removed** — User preferred dots go straight from empty to filled, no number flash
- **Blur overlay removed** — User found it unnecessary, removed entirely (Page Visibility blur)
- **Lock button added** — Not in original plan, added per user request in SideNav
- **Change PIN with admin password** — Not in original plan, added per user request with hardcoded admin password gate
- **storedHash bug fixed** — Module-level variable instead of hook-local to persist across re-renders
- **Vertical centering** — PIN screens centered vertically, not top-aligned

## Self-Check: PASSED

- [x] PinSetup appears on first load when no pin_hash exists
- [x] PinScreen appears on subsequent loads
- [x] Wrong PIN triggers shake animation
- [x] Correct PIN unlocks the app
- [x] Lock button in SideNav locks immediately
- [x] Change PIN requires admin password
- [x] 15-min idle timer locks the app
- [x] All tests passing, TypeScript clean
