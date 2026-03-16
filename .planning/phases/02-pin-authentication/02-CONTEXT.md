# Phase 2: PIN Authentication - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Gate all app access behind a 4-digit PIN lock screen. First-time users must set a PIN before accessing any content. Returning users enter their PIN on every app load, with sessions staying unlocked until 15 minutes of inactivity. Static JWT auth is removed.

</domain>

<decisions>
## Implementation Decisions

### Lock Screen Design
- Dot circles only — no visible keypad, just dots that fill as user types on any keyboard
- Masked number display — show each digit briefly then mask to •
- Shake + reset animation on wrong PIN — dots shake horizontally, then clear
- Unlimited wrong attempts — no lockout, no cooldown (personal tool)

### PIN Setup Flow
- 4-digit PIN
- Setup appears on first app load — must set PIN before accessing anything
- Enter-twice confirmation: Enter PIN → "Confirm your PIN" → enter again. Mismatch starts over

### Session & Idle Behavior
- 15-minute idle timeout based on no user interaction (clicks, taps, scrolls, keystrokes)
- Don't lock just because tab is hidden — only track interaction
- Instant switch to PIN screen on lock — no transition, no content flash
- Blur content on tab visibility change (Page Visibility API) — hide financial data in app switcher

### PIN Recovery
- No recovery mechanism — if forgotten, clear browser data and re-setup
- Accept the risk for a personal 4-digit PIN

### Claude's Discretion
- PIN hash storage approach (SHA-256 via Web Crypto API vs Supabase function)
- Session token implementation (sessionStorage vs memory)
- Idle timer reset throttling (debounce interval for interaction events)
- PinGate component architecture (layout route wrapper vs provider)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above.

### Project context
- `.planning/REQUIREMENTS.md` — AUTH-01 through AUTH-05 requirements
- `.planning/research/ARCHITECTURE.md` — PIN gate architecture recommendations
- `.planning/research/PITFALLS.md` — PIN auth security limitations and session management pitfalls

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/layout/AppShell.tsx` — Layout route wrapping all pages via Outlet; PinGate can wrap this
- `src/stores/uiStore.ts` — Zustand store pattern for UI state; could hold session/lock state
- `src/lib/supabase.ts` — Uses `accessToken` callback with static JWT; needs replacement

### Established Patterns
- Zustand v5 `create()` pattern for stores
- State machine pattern for overlays (visible/exiting states, onAnimationEnd to unmount)
- `createPortal(…, document.body)` for full-screen overlays

### Integration Points
- `src/lib/env.ts` — exports `USER_JWT`, `USER_ID`; JWT vars to be removed
- `src/lib/supabase.ts` — `accessToken` callback needs PIN-session-aware replacement
- `src/App.tsx` — Router setup; PinGate wraps before AppShell
- `index.html` — Flash prevention script may need awareness of lock state

</code_context>

<specifics>
## Specific Ideas

- Nothing Phone aesthetic: the lock screen should feel like a phone lock screen — minimal, black/white, monospaced type
- The dot display is the centerpiece — large, centered, breathing negative space
- Shake animation should be subtle but clear, matching the app's animation patterns (plain @keyframes, not motion library)

</specifics>

<deferred>
## Deferred Ideas

- Biometric auth (WebAuthn fingerprint/face) — v2.1
- PIN change from Settings — could add later but not required for v2.0

</deferred>

---

*Phase: 02-pin-authentication*
*Context gathered: 2026-03-16*
