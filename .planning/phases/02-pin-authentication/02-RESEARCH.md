# Phase 2: PIN Authentication - Research

**Researched:** 2026-03-16
**Domain:** Client-side PIN gate, SHA-256 hashing, session management, idle detection
**Confidence:** HIGH

## Summary

Phase 2 gates the entire app behind a 4-digit PIN lock screen. This is a client-side privacy screen (not real authentication) -- the existing Supabase anon-key + static JWT pattern continues to handle data access. The PIN hash is stored in the `user_settings` table (new `pin_hash` column), verified client-side via Web Crypto API SHA-256, and session state lives in `sessionStorage`.

The implementation touches three clear boundaries: (1) a new `PinGate` layout route wrapping `AppShell`, (2) a `usePinAuth` hook managing hash comparison and session flags, and (3) an idle timer with Page Visibility API blur. The static `VITE_USER_JWT` and `VITE_USER_ID` env vars are NOT removed in this phase -- AUTH-05 means the PIN gate replaces the old auth *mechanism* (direct access), not the JWT itself. The JWT is still needed for Supabase RLS.

**Primary recommendation:** Implement PinGate as a React Router layout route that renders `<Outlet />` when unlocked or the PIN screen when locked. Use Web Crypto `crypto.subtle.digest('SHA-256', ...)` for hashing -- zero dependencies, built into all browsers. Store unlock state in a Zustand store (not sessionStorage reads on every render) with sessionStorage as persistence backing.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Dot circles only -- no visible keypad, just dots that fill as user types on any keyboard
- Masked number display -- show each digit briefly then mask to dot
- Shake + reset animation on wrong PIN -- dots shake horizontally, then clear
- Unlimited wrong attempts -- no lockout, no cooldown (personal tool)
- 4-digit PIN
- Setup appears on first app load -- must set PIN before accessing anything
- Enter-twice confirmation: Enter PIN -> "Confirm your PIN" -> enter again. Mismatch starts over
- 15-minute idle timeout based on no user interaction (clicks, taps, scrolls, keystrokes)
- Don't lock just because tab is hidden -- only track interaction
- Instant switch to PIN screen on lock -- no transition, no content flash
- Blur content on tab visibility change (Page Visibility API) -- hide financial data in app switcher
- No recovery mechanism -- if forgotten, clear browser data and re-setup
- Nothing Phone aesthetic: minimal, black/white, monospaced type
- Dot display is centerpiece -- large, centered, breathing negative space
- Shake animation: plain @keyframes, not motion library

### Claude's Discretion
- PIN hash storage approach (SHA-256 via Web Crypto API vs Supabase function)
- Session token implementation (sessionStorage vs memory)
- Idle timer reset throttling (debounce interval for interaction events)
- PinGate component architecture (layout route wrapper vs provider)

### Deferred Ideas (OUT OF SCOPE)
- Biometric auth (WebAuthn fingerprint/face) -- v2.1
- PIN change from Settings -- could add later but not required for v2.0
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can set a 4-6 digit PIN on first app load (setup flow with confirm) | CONTEXT locks to 4-digit. Web Crypto SHA-256 for hashing. Setup flow = PinSetup component with enter/confirm states. |
| AUTH-02 | User must enter PIN on app load; active sessions stay unlocked until 15 minutes idle | PinGate layout route checks sessionStorage on mount. Idle timer via event listeners (mousemove, keydown, scroll, touchstart) with 1s throttle. |
| AUTH-03 | PIN stored as SHA-256 hash in Supabase (not plaintext) | `crypto.subtle.digest('SHA-256', ...)` + `pin_hash text` column on `user_settings` table. |
| AUTH-04 | Session persists in sessionStorage; idle timer resets on user interaction | sessionStorage('wintrack-session') as backing store, Zustand for reactive state. Idle timer resets on throttled interaction events. |
| AUTH-05 | Static JWT authentication removed in favor of PIN-gated access | PIN gate replaces "open access" pattern. Note: JWT env vars remain for Supabase client -- the "removal" is that access is now gated, not that the JWT disappears from the codebase. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Web Crypto API | Browser built-in | SHA-256 hashing of PIN | Zero dependencies, available in all modern browsers, async by design |
| Zustand | 5.0.11 (existing) | Session lock/unlock state | Already in project, reactive state for PinGate rendering |
| React Router | 7.13.1 (existing) | Layout route for PinGate | Already in project, layout routes are the correct pattern for auth gates |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sessionStorage | Browser built-in | Session persistence (cleared on tab close) | Backing store for unlock flag -- Zustand reads on init |
| Page Visibility API | Browser built-in | Blur overlay when tab hidden | `document.visibilitychange` event to show/hide blur overlay |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Web Crypto SHA-256 | bcrypt.js / argon2 WASM | Overkill for 4-digit client-side PIN; adds 50KB+ dependency for no practical security gain |
| Zustand session store | React Context | Would work but Zustand is already the project pattern; Context requires provider nesting |
| sessionStorage | localStorage with expiry | sessionStorage auto-clears on tab close which matches the desired behavior |

**Installation:**
```bash
# No new packages needed -- all browser built-ins + existing dependencies
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    auth/
      PinGate.tsx          # Layout route: renders Outlet or lock screen
      PinScreen.tsx         # Full-screen PIN entry UI (dots, keyboard listener)
      PinSetup.tsx          # First-time setup flow (enter + confirm)
      PinDots.tsx           # 4-dot indicator component (reused in screen + setup)
  hooks/
    usePinAuth.ts           # Hash, verify, session management
    useIdleTimer.ts         # Interaction tracking, 15-min timeout
  stores/
    pinStore.ts             # Lock state, blur state (or extend uiStore)
```

### Pattern 1: PinGate as Layout Route
**What:** PinGate is a React Router layout route that wraps AppShell. It checks session state and renders either `<Outlet />` (unlocked) or the PIN screen (locked).
**When to use:** Always -- this is the single entry point for auth gating.
**Example:**
```tsx
// App.tsx -- PinGate wraps all routes
const router = createBrowserRouter([
  {
    path: "/",
    Component: PinGate,       // layout route
    children: [
      {
        Component: AppShell,
        children: [
          { index: true, Component: TodayPage },
          { path: "journal", Component: JournalPage },
          { path: "settings", Component: SettingsPage },
        ],
      },
    ],
  },
]);
```
Source: Existing App.tsx router structure + ARCHITECTURE.md recommendation

### Pattern 2: SHA-256 Hashing via Web Crypto
**What:** Hash PIN using `crypto.subtle.digest('SHA-256', ...)` and store as hex string.
**When to use:** On PIN setup (hash + store) and on PIN entry (hash + compare).
**Example:**
```typescript
// Source: MDN SubtleCrypto.digest()
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Pattern 3: Idle Timer with Throttled Event Listeners
**What:** Track user interaction events (mousemove, keydown, scroll, touchstart) with a throttled handler that resets a timestamp. A `setInterval` checks if 15 minutes have elapsed since last interaction.
**When to use:** Active whenever the app is unlocked.
**Example:**
```typescript
// useIdleTimer.ts
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const THROTTLE_MS = 1000; // Only update timestamp once per second

function useIdleTimer(onIdle: () => void) {
  useEffect(() => {
    let lastActivity = Date.now();
    let throttleTimer: number | null = null;

    const resetActivity = () => {
      if (throttleTimer) return;
      lastActivity = Date.now();
      throttleTimer = window.setTimeout(() => { throttleTimer = null; }, THROTTLE_MS);
    };

    const checkIdle = setInterval(() => {
      if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
        onIdle();
      }
    }, 10_000); // Check every 10 seconds

    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => document.addEventListener(e, resetActivity, { passive: true }));

    return () => {
      clearInterval(checkIdle);
      events.forEach(e => document.removeEventListener(e, resetActivity));
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [onIdle]);
}
```

### Pattern 4: Page Visibility Blur Overlay
**What:** When the tab becomes hidden (user switches to app switcher, another tab), show a blur overlay over content. This prevents financial data from being visible in app switcher previews.
**When to use:** Always when app is unlocked.
**Example:**
```typescript
// In PinGate or a dedicated hook
useEffect(() => {
  const handleVisibility = () => {
    if (document.hidden) {
      setBlurred(true);
    } else {
      setBlurred(false);
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);
  return () => document.removeEventListener('visibilitychange', handleVisibility);
}, []);

// Render: blurred && <div className="fixed inset-0 z-50 backdrop-blur-xl bg-background/80" />
```

### Pattern 5: PIN Dot Animation with CSS @keyframes
**What:** Dot indicators that briefly show each digit then mask, with shake animation on wrong PIN. Uses plain CSS @keyframes per project convention (not motion library).
**When to use:** PinDots component.
**Example:**
```css
/* index.css */
@keyframes pin-shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-8px); }
  40%, 80% { transform: translateX(8px); }
}
.pin-shake {
  animation: pin-shake 0.4s ease-in-out;
}

@keyframes pin-dot-fill {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
.pin-dot-enter {
  animation: pin-dot-fill 0.15s ease-out both;
}
```

### Anti-Patterns to Avoid
- **Checking sessionStorage on every render:** Read once on mount, use Zustand for reactive state. sessionStorage reads are synchronous but unnecessary on re-renders.
- **Using motion library for PIN animations:** CONTEXT explicitly says plain @keyframes. The shake and dot animations are simple CSS -- no need for a JS animation library.
- **Rendering children while locked:** PinGate must NOT render `<Outlet />` at all when locked. Conditional rendering, not CSS hiding. This prevents data fetching in child components.
- **Storing PIN in state/memory:** Only the hash is ever stored (in Supabase + localStorage cache). The raw PIN is used only during the hash computation and immediately discarded.
- **Using `visibilitychange` to lock:** CONTEXT says don't lock on tab hide -- only blur. Lock only on idle timeout.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SHA-256 hashing | Custom hash function or imported crypto lib | `crypto.subtle.digest('SHA-256', ...)` | Built into all browsers, zero bundle cost, async, cryptographically correct |
| Session persistence | Custom expiry logic with timestamps in localStorage | `sessionStorage` | Auto-clears on tab close -- exactly the desired behavior |
| Event throttling for idle timer | Complex debounce/throttle utility | Simple `setTimeout` flag pattern (see code example above) | 5 lines vs importing lodash.throttle; only one use case |

**Key insight:** This entire phase uses zero new dependencies. Every capability needed is a browser built-in (Web Crypto, sessionStorage, Page Visibility API, CSS @keyframes) or an existing project dependency (Zustand, React Router).

## Common Pitfalls

### Pitfall 1: Content Flash Before PIN Screen
**What goes wrong:** On app load, child routes briefly render (triggering Supabase queries, showing data) before PinGate determines lock state.
**Why it happens:** PinGate checks sessionStorage or Supabase for PIN hash asynchronously. During the async gap, React renders children.
**How to avoid:** PinGate starts in a "loading" state that renders nothing (or a blank screen matching background color). Only after determining lock state does it render either the PIN screen or `<Outlet />`. The loading state should be synchronous -- check sessionStorage (sync) first, then verify PIN hash existence from Supabase.
**Warning signs:** Brief flash of TodayPage content before PIN screen appears.

### Pitfall 2: PIN Hash Not Found After Browser Data Clear
**What goes wrong:** User clears browser data (including localStorage cache of settings). On next load, PinGate tries to fetch PIN hash from Supabase but the session/JWT setup hasn't completed yet, so the query fails or returns null. User sees the app without PIN protection.
**How to avoid:** The PIN hash lives in Supabase `user_settings.pin_hash`. On load, PinGate must fetch this from Supabase before deciding whether to show setup or entry screen. If fetch fails (network error), show an error state, not the app content.
**Warning signs:** App loads without PIN screen after clearing browser cache.

### Pitfall 3: Idle Timer Fires During Active Typing
**What goes wrong:** User is typing in journal or win input, idle timer expires because the timer only tracks mousemove/click, not keydown.
**Why it happens:** Incomplete event list in idle timer setup.
**How to avoid:** Track ALL interaction events: `mousemove`, `keydown`, `scroll`, `touchstart`, `click`, `pointerdown`. The throttle ensures this doesn't impact performance.
**Warning signs:** App locks while user is actively typing.

### Pitfall 4: `crypto.subtle` Undefined in Test Environment
**What goes wrong:** Tests for `usePinAuth` fail because jsdom does not implement `crypto.subtle`.
**Why it happens:** jsdom provides a partial `crypto` implementation but `subtle` may be missing or incomplete depending on the Node.js version.
**How to avoid:** Node 20+ (project uses 22.22.0 via mise) includes `globalThis.crypto` with `subtle`. If jsdom doesn't expose it, add to `test-setup.ts`: `Object.defineProperty(globalThis, 'crypto', { value: crypto })` using Node's built-in `crypto` module. Alternatively, mock the `hashPin` utility in tests.
**Warning signs:** `TypeError: Cannot read properties of undefined (reading 'digest')` in test output.

### Pitfall 5: Blur Overlay Flickers on Quick Tab Switch
**What goes wrong:** Rapidly switching tabs causes the blur overlay to flash on/off, creating a jarring visual.
**Why it happens:** `visibilitychange` fires on every switch. If blur uses a CSS transition, the enter/exit animations stack.
**How to avoid:** Use instant opacity (no transition) for the blur overlay. It should appear and disappear immediately with no animation.
**Warning signs:** Blur overlay flickers or has visible transition when quickly switching tabs.

### Pitfall 6: AUTH-05 Misinterpreted as "Remove JWT"
**What goes wrong:** Developer removes `VITE_USER_JWT` and `VITE_USER_ID` env vars, breaking the entire Supabase client. All data queries fail.
**Why it happens:** AUTH-05 says "Static JWT authentication removed in favor of PIN-gated access." This sounds like removing the JWT.
**How to avoid:** AUTH-05 means the PIN replaces the *user-facing auth mechanism* (previously: open access with env vars). The JWT is still needed for Supabase RLS -- it's an implementation detail, not user-facing auth. The env vars stay. What changes: access is now gated behind PIN entry rather than being immediately available.
**Warning signs:** Supabase queries return 401 errors after "removing" JWT.

## Code Examples

### SHA-256 PIN Hashing Utility
```typescript
// src/lib/utils/pin.ts
// Source: MDN SubtleCrypto.digest()
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### usePinAuth Hook Skeleton
```typescript
// src/hooks/usePinAuth.ts
import { supabase } from '@/lib/supabase';
import { USER_ID } from '@/lib/env';
import { hashPin } from '@/lib/utils/pin';

interface PinAuthState {
  hasPin: boolean | null;  // null = loading
  pinHash: string | null;
}

export function usePinAuth() {
  // Fetch pin_hash from user_settings on mount
  // Returns: { hasPin, verify, setup, loading }

  async function verify(pin: string): Promise<boolean> {
    const hash = await hashPin(pin);
    return hash === storedHash;
  }

  async function setup(pin: string): Promise<void> {
    const hash = await hashPin(pin);
    await supabase
      .from('user_settings')
      .upsert({ user_id: USER_ID, pin_hash: hash });
  }
}
```

### PinGate Layout Route Skeleton
```tsx
// src/components/auth/PinGate.tsx
import { Outlet } from 'react-router';

export default function PinGate() {
  // States: 'loading' | 'setup' | 'locked' | 'unlocked'

  // On mount:
  // 1. Check sessionStorage('wintrack-session') -- if set, state = 'unlocked'
  // 2. Fetch pin_hash from Supabase user_settings
  // 3. If no pin_hash: state = 'setup'
  // 4. If pin_hash exists: state = 'locked'

  // Render:
  // loading -> blank screen (bg-background only)
  // setup -> <PinSetup onComplete={...} />
  // locked -> <PinScreen onUnlock={...} />
  // unlocked -> <Outlet />

  // Blur overlay: shown when document.hidden && state === 'unlocked'
}
```

### Database Migration for pin_hash Column
```sql
-- supabase/migrations/007_pin_hash.sql
ALTER TABLE user_settings ADD COLUMN pin_hash text;
-- No default, no NOT NULL -- existing rows get null (no PIN set)
-- No index needed -- single user, primary key lookup
```

### Session Management Pattern
```typescript
// Session flag in sessionStorage (auto-clears on tab close)
const SESSION_KEY = 'wintrack-session';

function markUnlocked() {
  sessionStorage.setItem(SESSION_KEY, '1');
}

function isSessionUnlocked(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Open access (env vars only) | PIN-gated access | This phase | Privacy screen for sensitive data |
| No idle detection | 15-min idle timeout | This phase | Auto-lock on inactivity |
| No content blur | Page Visibility blur | This phase | Hides data in app switcher |

**Deprecated/outdated:**
- `window.crypto.subtle` is now `crypto.subtle` (globalThis) -- no window prefix needed in modern browsers.

## Open Questions

1. **AUTH-05 scope: What exactly gets "removed"?**
   - What we know: The PIN gate replaces open access as the auth mechanism. JWT is still needed for Supabase.
   - What's unclear: Does the user want `VITE_USER_JWT` and `VITE_USER_ID` env vars renamed/reorganized, or literally kept as-is?
   - Recommendation: Keep env vars as-is. The "removal" is conceptual -- access is gated. Document this interpretation in the plan.

2. **First-time user flow: When is PIN setup required?**
   - What we know: CONTEXT says "Setup appears on first app load -- must set PIN before accessing anything."
   - What's unclear: Does this apply to existing installations (user already has data but no PIN)?
   - Recommendation: Yes. If no `pin_hash` in user_settings, show setup flow regardless of existing data. This is the safest approach for when finance data arrives in later phases.

3. **Supabase type regeneration after migration**
   - What we know: Phase 1 generated types via `supabase gen types`. Adding `pin_hash` column requires regeneration.
   - Recommendation: Regenerate types after migration. The `pin_hash` field will appear on the `user_settings` Row type automatically.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + @testing-library/react 16.3.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `bun run vitest run --reporter=verbose` |
| Full suite command | `bun run vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | PIN setup: hash + store in Supabase | unit | `bun run vitest run src/hooks/usePinAuth.test.ts -t "setup"` | Wave 0 |
| AUTH-01 | PIN setup: enter-twice confirmation, mismatch restart | unit | `bun run vitest run src/components/auth/PinSetup.test.tsx` | Wave 0 |
| AUTH-02 | PIN entry: verify hash match, reject wrong PIN | unit | `bun run vitest run src/hooks/usePinAuth.test.ts -t "verify"` | Wave 0 |
| AUTH-02 | Idle timeout: lock after 15 min inactivity | unit | `bun run vitest run src/hooks/useIdleTimer.test.ts` | Wave 0 |
| AUTH-03 | SHA-256 hash: deterministic, correct output | unit | `bun run vitest run src/lib/utils/pin.test.ts` | Wave 0 |
| AUTH-04 | Session: persists in sessionStorage, clears on tab close | unit | `bun run vitest run src/hooks/usePinAuth.test.ts -t "session"` | Wave 0 |
| AUTH-05 | PinGate: blocks rendering when locked, allows when unlocked | unit | `bun run vitest run src/components/auth/PinGate.test.tsx` | Wave 0 |

### Sampling Rate
- **Per task commit:** `bun run vitest run --reporter=verbose`
- **Per wave merge:** `bun run vitest run && bun run typecheck`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/utils/pin.test.ts` -- covers AUTH-03 (hashPin utility)
- [ ] `src/hooks/usePinAuth.test.ts` -- covers AUTH-01, AUTH-02, AUTH-04 (hook logic)
- [ ] `src/hooks/useIdleTimer.test.ts` -- covers AUTH-02 (idle timeout)
- [ ] `src/components/auth/PinGate.test.tsx` -- covers AUTH-05 (gate rendering)
- [ ] `src/components/auth/PinSetup.test.tsx` -- covers AUTH-01 (setup flow)
- [ ] `src/components/auth/PinScreen.test.tsx` -- covers AUTH-02 (entry flow)
- [ ] Verify `crypto.subtle` availability in test env (Node 22 should have it; may need test-setup.ts polyfill)

## Sources

### Primary (HIGH confidence)
- [MDN SubtleCrypto.digest()](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest) -- SHA-256 hashing API, TextEncoder pattern, hex conversion
- [MDN Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) -- `document.visibilitychange` event, `document.hidden` property
- [MDN sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage) -- auto-clears on tab close behavior
- Codebase: `src/App.tsx` -- existing router structure (layout route pattern)
- Codebase: `src/stores/uiStore.ts` -- Zustand v5 pattern for UI state
- Codebase: `src/hooks/useSettings.ts` -- Supabase query pattern for `user_settings` table
- Codebase: `supabase/migrations/005_user_settings.sql` -- existing table schema + RLS policies
- Codebase: `src/index.css` -- existing @keyframes animation pattern (overlay-slide-in, pin-shake)

### Secondary (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md` -- PinGate architecture recommendation, router integration pattern
- `.planning/research/PITFALLS.md` -- PIN false security, session timeout, content flash pitfalls

### Tertiary (LOW confidence)
- jsdom `crypto.subtle` availability -- Node 22 should provide it via `globalThis.crypto`, but jsdom may not expose it. Needs validation during Wave 0.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all browser built-ins, zero new dependencies, well-documented APIs
- Architecture: HIGH -- extends existing router/store/hook patterns exactly; ARCHITECTURE.md already validated this approach
- Pitfalls: HIGH -- based on codebase analysis + verified pitfalls research; content flash and AUTH-05 misinterpretation are the highest-risk items

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable -- no moving targets; all browser built-ins)
