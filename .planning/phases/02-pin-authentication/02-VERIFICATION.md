---
phase: 02-pin-authentication
verified: 2026-03-17T02:35:00Z
status: gaps_found
score: 15/17 must-haves verified
gaps:
  - truth: "Tab hide shows blur overlay, tab show removes it"
    status: failed
    reason: "Blur overlay intentionally removed per user preference during plan 02-02 execution. PinGate has no visibilitychange listener or backdrop-blur. This was a deliberate deviation documented in 02-02-SUMMARY.md, not a bug."
    artifacts:
      - path: "src/components/auth/PinGate.tsx"
        issue: "No visibilitychange listener, no blur overlay rendering"
    missing:
      - "If blur is desired: add visibilitychange listener and conditional backdrop-blur div in PinGate"
      - "If blur is NOT desired: update must_haves in 02-02-PLAN.md to reflect deviation, fix stale test"
  - truth: "AUTH-05 — Static JWT authentication removed in favor of PIN-gated access"
    status: failed
    reason: "VITE_USER_JWT and USER_JWT are still fully in use in env.ts and supabase.ts. The PIN gate is layered on top of JWT, not replacing it. The static JWT auth mechanism was never removed."
    artifacts:
      - path: "src/lib/env.ts"
        issue: "Still exports USER_JWT from VITE_USER_JWT env var"
      - path: "src/lib/supabase.ts"
        issue: "Still uses accessToken: async () => USER_JWT"
    missing:
      - "Remove static JWT dependency or document that AUTH-05 is deferred/descoped"
  - truth: "AUTH-01 — User can set a 4-6 digit PIN on first app load"
    status: partial
    reason: "Implementation supports only 4-digit PINs. PinDots has DOT_COUNT=4, all length checks hardcoded to 4. Requirements says 4-6 digit. Plans deliberately narrowed to 4-digit only."
    artifacts:
      - path: "src/components/auth/PinSetup.tsx"
        issue: "Hardcoded to 4-digit (digits.length !== 4)"
      - path: "src/components/auth/PinScreen.tsx"
        issue: "Hardcoded to 4-digit (digits.length !== 4)"
      - path: "src/components/auth/PinDots.tsx"
        issue: "DOT_COUNT = 4, no variable length support"
    missing:
      - "Either update requirement AUTH-01 to say '4-digit PIN' or add variable PIN length support"
human_verification:
  - test: "Full PIN setup flow in browser"
    expected: "First load shows Set your PIN, confirm step, then app unlocks"
    why_human: "Visual layout, centering, animation feel cannot be verified programmatically"
  - test: "Wrong PIN shake animation"
    expected: "Dots turn red, row shakes horizontally, then resets to empty"
    why_human: "Animation timing and visual feel"
  - test: "Idle lock after 15 minutes"
    expected: "App transitions to lock screen after inactivity"
    why_human: "Requires real-time wait or temporary constant change"
---

# Phase 2: PIN Authentication Verification Report

**Phase Goal:** User's data is gated behind a PIN lock screen on every app load
**Verified:** 2026-03-17T02:35:00Z
**Status:** gaps_found
**Re-verification:** No -- initial verification

## Goal Achievement

The core goal -- data gated behind PIN lock screen on every app load -- IS achieved. The gaps are in requirement coverage (AUTH-05 JWT removal never happened, AUTH-01 specifies 4-6 digits but only 4 implemented) and a removed feature (blur overlay). The PIN gate itself is functional and well-tested.

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | hashPin('1234') produces deterministic 64-char hex SHA-256 hash | VERIFIED | `crypto.subtle.digest('SHA-256', ...)` in pin.ts, 4 tests pass |
| 2 | usePinAuth can fetch pin_hash and compare against user input | VERIFIED | Supabase query + hashPin comparison in usePinAuth.ts, 7 tests pass |
| 3 | usePinAuth can store a new pin_hash via upsert | VERIFIED | `supabase.from('user_settings').upsert(...)` in setup() |
| 4 | useIdleTimer calls onIdle after 15 minutes of no interaction | VERIFIED | IDLE_TIMEOUT_MS = 15 * 60 * 1000, 4 tests pass |
| 5 | pinStore tracks locked/unlocked/setup/loading state reactively | VERIFIED | Zustand store with 4 gate states, create()() pattern |
| 6 | Session unlock flag persists in sessionStorage | VERIFIED | sessionStorage get/setItem in pinStore.ts |
| 7 | First-time user sees PinSetup with 'Set your PIN' heading | VERIFIED | PinGate renders PinSetup when gateState='setup', copy confirmed |
| 8 | PinSetup requires entering same 4-digit PIN twice | VERIFIED | enter -> confirm step flow in PinSetup.tsx |
| 9 | PinSetup shows 'PINs didn't match' and resets on mismatch | VERIFIED | mismatch step with 1.5s timer reset |
| 10 | Returning user sees PinScreen with 'Enter your PIN' heading | VERIFIED | PinGate renders PinScreen when gateState='locked' |
| 11 | Correct PIN unlocks and renders app content (Outlet) | VERIFIED | markUnlocked() sets gateState='unlocked', PinGate renders Outlet |
| 12 | Wrong PIN triggers shake animation on dots, then resets | VERIFIED | error state -> pin-shake animation -> onShakeEnd clears |
| 13 | App locks after 15 minutes of no interaction | VERIFIED | useIdleTimer wired in PinGate with lock() callback |
| 14 | Tab hide shows blur overlay, tab show removes it | FAILED | Intentionally removed per user preference (02-02-SUMMARY deviation) |
| 15 | No content flash -- loading state renders blank bg-background | VERIFIED | PinGate returns fixed inset-0 bg-background div for 'loading' state |
| 16 | Keyboard digits 0-9 fill dots, Backspace removes last digit | VERIFIED | document keydown listeners in PinScreen and PinSetup |
| 17 | Auto-submit on 4th digit -- no submit button | VERIFIED | useEffect triggers on digits.length === 4 |

**Score:** 16/17 truths verified (1 intentionally removed by user)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/pin.ts` | SHA-256 hashing utility | VERIFIED | 7 lines, exports hashPin, uses crypto.subtle |
| `src/stores/pinStore.ts` | Zustand store for lock state | VERIFIED | 28 lines, 4 gate states, sessionStorage backing |
| `src/hooks/usePinAuth.ts` | PIN verify, setup, gate init | VERIFIED | 53 lines, module-level storedHash, supabase queries |
| `src/hooks/useIdleTimer.ts` | Idle timeout hook | VERIFIED | 37 lines, 6 events, throttle, interval check |
| `supabase/migrations/007_pin_hash.sql` | pin_hash column | VERIFIED | ALTER TABLE user_settings ADD COLUMN pin_hash text |
| `src/components/auth/PinDots.tsx` | 4-dot PIN indicator | VERIFIED | 80 lines, fill/shake/error states, a11y |
| `src/components/auth/PinScreen.tsx` | Full-screen lock screen | VERIFIED | 59 lines, keyboard-driven, auto-submit |
| `src/components/auth/PinSetup.tsx` | Two-step PIN creation | VERIFIED | 98 lines, enter/confirm/mismatch flow |
| `src/components/auth/PinGate.tsx` | Layout route gating content | VERIFIED | 53 lines, conditional rendering by gate state |
| `src/App.tsx` | Router with PinGate wrapping AppShell | VERIFIED | PinGate as root layout route |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| usePinAuth.ts | pin.ts | `import hashPin` | WIRED | Line 1: import { hashPin } from '@/lib/pin' |
| usePinAuth.ts | supabase.ts | `supabase.from('user_settings')` | WIRED | Lines 17, 45: select and upsert queries |
| pinStore.ts | sessionStorage | getItem/setItem | WIRED | Lines 14, 21, 26: read and write session flag |
| PinGate.tsx | usePinAuth.ts | usePinAuth() | WIRED | Line 11: const pinAuth = usePinAuth() |
| PinGate.tsx | pinStore.ts | usePinStore | WIRED | Line 10: reads gateState reactively |
| PinGate.tsx | useIdleTimer.ts | useIdleTimer() | WIRED | Lines 20-23: lock callback on idle |
| App.tsx | PinGate.tsx | Component: PinGate | WIRED | Line 11: root layout route |
| PinScreen.tsx | PinDots.tsx | renders PinDots | WIRED | Line 54: PinDots with digits/error/onShakeEnd |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| AUTH-01 | 02-02 | User can set a 4-6 digit PIN on first app load | PARTIAL | Implementation supports 4-digit only; plans deliberately narrowed to 4-digit |
| AUTH-02 | 02-02 | User must enter PIN on app load; active sessions stay unlocked until 15 min idle | SATISFIED | PinGate + useIdleTimer + sessionStorage persistence |
| AUTH-03 | 02-01 | PIN stored as SHA-256 hash in Supabase | SATISFIED | hashPin uses crypto.subtle.digest, upserts hash to user_settings |
| AUTH-04 | 02-01 | Session persists in sessionStorage; idle timer resets on interaction | SATISFIED | pinStore sessionStorage backing + useIdleTimer throttled event listeners |
| AUTH-05 | 02-02 | Static JWT authentication removed in favor of PIN-gated access | BLOCKED | JWT still fully in use: env.ts exports USER_JWT, supabase.ts uses it as accessToken |

No orphaned requirements found -- all 5 AUTH requirements mapped to Phase 2 in REQUIREMENTS.md traceability table are accounted for in plan frontmatter.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/components/auth/PinGate.test.tsx | 92 | Stale test expects removed blur overlay feature | Warning | 1 test failure; does not block functionality |
| src/pages/SettingsPage.tsx | 186 | Hardcoded admin password "P4ssthew0rd" for Change PIN | Warning | Security concern for production; acceptable for single-user app |

### Human Verification Required

### 1. Full PIN Setup Flow

**Test:** Clear sessionStorage, load app, complete setup flow
**Expected:** See "Set your PIN" -> type 4 digits -> "Confirm your PIN" -> type same 4 digits -> app unlocks to TodayPage
**Why human:** Visual layout centering, animation feel, keyboard responsiveness

### 2. Wrong PIN Shake Animation

**Test:** Reload app, enter wrong 4 digits on lock screen
**Expected:** Dots turn red, row shakes horizontally, then resets to empty for retry
**Why human:** Animation timing and visual quality

### 3. Lock Button in SideNav

**Test:** While unlocked, click lock icon in sidebar
**Expected:** App immediately returns to PIN entry screen
**Why human:** Transition smoothness, icon visibility

### Gaps Summary

Three gaps identified, ordered by severity:

1. **AUTH-05 (BLOCKED):** Static JWT was never removed. The PIN gate is correctly layered as a UI gate, but the Supabase client still authenticates via a static JWT from environment variables. This was likely a deliberate architectural decision (PIN protects UI, JWT protects data layer), but the requirement explicitly says "removed in favor of." Either the requirement needs descoping or the JWT needs removal.

2. **AUTH-01 (PARTIAL):** Requirement specifies "4-6 digit PIN" but implementation is strictly 4-digit. All components hardcode length checks to 4 and PinDots renders exactly 4 dots. The plans deliberately designed for 4-digit, so this appears to be a requirement narrowing that was not reflected back to REQUIREMENTS.md.

3. **Blur overlay removed:** PinGate has no tab visibility blur overlay. This was an intentional user-directed deviation documented in 02-02-SUMMARY.md. The stale test expecting blur is the only code artifact still referencing it. Not a functional gap -- just needs plan/test cleanup.

**Net assessment:** The core goal -- "User's data is gated behind a PIN lock screen on every app load" -- IS functionally achieved. The PIN setup, lock, unlock, idle timeout, and session persistence all work correctly with passing tests (15/15 foundation, 19/20 component). The gaps are in requirement precision (AUTH-01 digit range, AUTH-05 JWT removal) and test hygiene (1 stale blur test).

---

_Verified: 2026-03-17T02:35:00Z_
_Verifier: Claude (gsd-verifier)_
