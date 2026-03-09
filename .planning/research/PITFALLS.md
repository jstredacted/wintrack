# Pitfalls Research

**Domain:** Personal accountability and focus tracker SPA (single-user, no auth)
**Researched:** 2026-03-09
**Confidence:** HIGH (most pitfalls verified via official docs or multiple sources)

---

## Critical Pitfalls

### Pitfall 1: Timer Drift — Using setInterval as the Source of Truth

**What goes wrong:**
A stopwatch that increments elapsed time by adding a fixed delta on each `setInterval` tick will drift. Browsers don't guarantee interval precision — a 100ms interval may actually fire every 102–115ms, especially under CPU load. After 10 minutes of continuous tracking, the drift can be 5–15 seconds. The problem compounds when the user switches tabs.

**Why it happens:**
Developers naturally write: `setElapsed(prev => prev + 100)` inside a `setInterval(fn, 100)` callback. This seems correct but treats the timer as a clock, which it is not. `setInterval` is a scheduling hint, not a metronome.

**How to avoid:**
Store a `startedAt` timestamp (via `Date.now()` or `performance.now()`) in state or a `useRef`. On each tick, compute elapsed as `Date.now() - startedAt - totalPausedDuration` rather than accumulating increments. The interval's only job is to trigger a re-render; the time value comes from wall-clock subtraction.

```
// Wrong
setElapsed(e => e + 100)

// Right
const now = Date.now()
setElapsed(now - startedAtRef.current - accumulatedPauseMs)
```

For the pause/resume cycle: when pausing, record `pausedAt = Date.now()`. When resuming, add `Date.now() - pausedAt` to `accumulatedPauseMs`, then clear `pausedAt`.

**Warning signs:**
- Stopwatch drifts noticeably after 5+ minutes of running
- Timer skips seconds when returning to the tab after navigating away
- Unit: testing the hook shows different elapsed values per run for the same wall-clock window

**Phase to address:**
Win card / stopwatch feature phase. Design the data model (startedAt, pausedAt, accumulatedMs) before building UI. Do not retrofit this later.

---

### Pitfall 2: Background Tab Throttling Breaks Running Timers

**What goes wrong:**
Browsers (Chrome, Firefox, Safari) throttle `setInterval` and `setTimeout` for background tabs. The minimum interval becomes 1000ms regardless of what was requested, and in some energy-saving modes (especially mobile Safari) timers may stop entirely. A stopwatch running in the background will appear to freeze, then jump forward, then freeze again — making the elapsed display unreliable.

**Why it happens:**
Browser energy optimization. Any interval-based approach — no matter how well-written — is subject to this throttling at the browser level. It is not a bug in the code.

**How to avoid:**
Two complementary strategies:

1. **Timestamp persistence (required):** Because the elapsed time is always computed as `Date.now() - startedAt`, the displayed value will snap to the correct time the moment the user returns to the tab — even if the interval was throttled for 10 minutes. The timer "catches up" automatically. This is the most important defense.

2. **Page Visibility API (recommended):** Listen for `document.visibilitychange`. When the tab becomes hidden, pause the UI update interval to save resources (the elapsed computation stays accurate). When the tab becomes visible, resume the interval and force an immediate re-render. This eliminates the "jump" experience.

```js
useEffect(() => {
  const handleVisibility = () => {
    if (document.hidden) clearInterval(intervalRef.current)
    else restartInterval()
  }
  document.addEventListener('visibilitychange', handleVisibility)
  return () => document.removeEventListener('visibilitychange', handleVisibility)
}, [])
```

**Warning signs:**
- Running the stopwatch, switching to another tab for 2 minutes, then returning shows a sudden large jump rather than a smooth continuation
- Timer appears frozen while tab is in background

**Phase to address:**
Win card / stopwatch feature phase, alongside Pitfall 1. Both are solved together by the timestamp-based model.

---

### Pitfall 3: Timer State Lost on Page Refresh

**What goes wrong:**
React component state is in-memory only. If a user has a stopwatch running and refreshes the page (accidentally or intentionally), all timer state is gone. The win card shows 0:00 elapsed and no indication it was ever running. Any time already accrued is silently discarded.

**Why it happens:**
Developers build the UI first and wire up persistence last. Stopwatch state (is it running? what was startedAt?) is left in `useState` rather than persisted.

**How to avoid:**
Persist timer state to Supabase (the wins table already goes there). The win record should store: `timer_started_at` (nullable timestamp), `timer_accumulated_ms` (integer, default 0), `timer_is_running` (boolean). On mount, read these values from Supabase and reconstruct the running state. No separate localStorage layer needed — Supabase is already the source of truth.

Do not use `localStorage` as the primary persistence layer for timer state because it creates a split-brain problem: Supabase has the win data and localStorage has the timer state, which diverge when a second device is used or the browser storage is cleared.

**Warning signs:**
- Timer state stored only in React `useState` with no `useEffect` write-through to Supabase
- No `timer_started_at` column on the wins table

**Phase to address:**
Data model design phase (before building any UI). The schema must include timer fields from day one.

---

### Pitfall 4: Streak Calculation Wrong Due to Timezone and DST

**What goes wrong:**
A streak counter that computes "did the user complete a win today?" using server-side UTC midnight boundaries will break for any user not in UTC. A user completing a win at 11:30 PM Eastern (3:30 AM UTC) gets credited to tomorrow UTC — their streak either double-counts or breaks depending on implementation. During DST transitions, a "day" is 23 or 25 hours long, causing further corruption.

**Why it happens:**
Developers store timestamps in UTC (correct) but then compare them using UTC day boundaries (wrong for local-day semantics). Since wintrack is a personal single-user app, the timezone is implicitly the user's local timezone — but the app needs to be explicit about this.

**How to avoid:**
Store all timestamps in UTC in Supabase (correct). For streak evaluation, always resolve to the user's local date using `Intl.DateTimeFormat` or a library like `date-fns-tz`:

```js
// Wrong
const today = new Date().toISOString().split('T')[0] // UTC date

// Right
const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
}).format(new Date()) // local calendar date: 'YYYY-MM-DD'
```

Store the user's IANA timezone string (e.g. `"America/New_York"`) in a settings table or localStorage. Use this timezone consistently in all date comparisons. Streak logic: "did any win get marked complete on local date X?" — never on UTC date X.

For wintrack specifically (single user, no travel edge cases to worry about), the simplest safe approach is: always derive the local date from `new Date()` using the browser's local timezone at read time. Do not store or compare raw UTC date strings.

**Warning signs:**
- Streak tests pass in UTC CI environment but fail for testers in UTC-5 or UTC+9
- Streak uses `.toISOString().slice(0, 10)` for date comparison anywhere in the codebase
- The wins table has no timezone awareness

**Phase to address:**
Streak feature phase. Write a single `getLocalDateString()` utility on day one and use it everywhere. Never inline date-string logic.

---

### Pitfall 5: Supabase with No Auth and RLS Disabled Exposes All Data

**What goes wrong:**
When a Supabase project has no auth layer (which is intentional for wintrack) and Row Level Security is not configured, the `anon` API key bundled in the frontend JS grants full CRUD access to every table. Anyone who opens DevTools, copies the `SUPABASE_URL` and `SUPABASE_ANON_KEY`, and sends a `GET /rest/v1/wins` request can read — and delete — all your wins data.

**Why it happens:**
The "no auth" decision is reasonable for a personal tool, but developers interpret it as "skip all security." Supabase's default is RLS disabled, which means publicly accessible. The anon key is always exposed in client-side code and cannot be hidden.

**How to avoid:**
Enable RLS on all tables. For a single-user no-auth app, the correct RLS posture is restrictive-by-default:

- Option A (simplest): Disable the Data API entirely for public tables and access Supabase only server-side (not viable here since there's no server).
- Option B (correct for this project): Enable RLS on all tables. Create a single hardcoded row in a `settings` table with a known `user_id` (a UUID you control). All RLS policies reference `auth.uid() = 'your-uuid'`. Deploy the app with a Service Role key only accessible to you via Vercel environment variables. The client-side anon key has zero permissions.
- Option C (pragmatic minimum): Enable RLS on all tables with `USING (false)` for all operations via anon role, effectively making the database unreachable without the service key. Accept that this means the SPA must call a Vercel serverless function to proxy writes — or accept the risk since it's personal data with no PII.

For a truly personal tool deployed to a non-public URL, the risk is low but not zero (URL can be discovered). Enable RLS as a baseline regardless.

**Warning signs:**
- Supabase dashboard shows "RLS disabled" warning on any table
- `SUPABASE_SERVICE_ROLE_KEY` is referenced in client-side (non-serverless) code
- No RLS policies defined on wins, journal_entries, or settings tables

**Phase to address:**
Data model / Supabase setup phase. Configure RLS before writing any application code.

---

### Pitfall 6: Typeform-Style Animation Breaks Focus Management

**What goes wrong:**
A full-screen single-question flow that animates between steps leaves keyboard focus stranded on the now-hidden previous step. Screen reader users and keyboard-only users cannot advance through the form because focus is on an element that has animated off-screen or is `visibility: hidden`. Additionally, when the new step slides in, focus has not moved to the new input field — the user must Tab blindly to find it.

**Why it happens:**
Framer Motion's `AnimatePresence` and enter/exit variants handle visual transitions, but they do not manage focus. The developer sees a beautiful slide animation and ships it. Focus management is invisible in visual testing.

**How to avoid:**
After each step transition, explicitly move focus to the primary interactive element of the incoming step using a `useEffect` with a `ref.current.focus()` call. Time this after the enter animation completes (use `onAnimationComplete` callback from Framer Motion, or a short `requestAnimationFrame` delay).

```jsx
// After AnimatePresence mounts the new step
useEffect(() => {
  if (isCurrentStep) {
    requestAnimationFrame(() => inputRef.current?.focus())
  }
}, [isCurrentStep])
```

Additionally: ensure exiting elements are removed from the tab order immediately (use `aria-hidden="true"` or `tabIndex={-1}` on the exiting element) rather than waiting for the exit animation to complete.

**Warning signs:**
- No `focus()` calls in any step-transition code
- Testing the flow with Tab key only — focus does not land on the new field automatically
- No `aria-live` region announcing step changes to screen readers

**Phase to address:**
Win input flow / Typeform UX phase. Write an accessibility smoke test (Tab navigation through all steps) as part of the definition of done.

---

### Pitfall 7: AnimatePresence Layout Shift Causes CLS and Visual Glitches

**What goes wrong:**
When Framer Motion's `AnimatePresence` keeps the exiting element in the DOM during its exit animation, both the entering and exiting elements exist simultaneously. If the container does not have a fixed height or `position: absolute` layout, both elements stack vertically — causing the page to jump and the animation to look broken.

**Why it happens:**
Full-screen step wizards need the entering and exiting elements to occupy the same visual space. Without explicit layout containment, they stack in document flow. This is the single most common Framer Motion multi-step form mistake.

**How to avoid:**
Use `position: relative` on the container and `position: absolute` on the step elements, or use CSS Grid with all steps overlapping (`grid-area: 1 / 1`). This ensures both elements occupy the same space during the transition.

```jsx
// Container
<div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
  <AnimatePresence mode="wait">
    <motion.div
      key={stepIndex}
      style={{ position: 'absolute', inset: 0 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {currentStep}
    </motion.div>
  </AnimatePresence>
</div>
```

Use `mode="wait"` on `AnimatePresence` so the exit animation completes before the enter animation starts — this halves layout complexity.

**Warning signs:**
- Steps visually stack or flicker during transition
- Cumulative Layout Shift (CLS) score is non-zero in Lighthouse
- The container div has no explicit height or `overflow: hidden`

**Phase to address:**
Win input flow / Typeform UX phase. Establish the layout scaffolding (container + absolute positioning strategy) before building individual steps.

---

### Pitfall 8: Respecting prefers-reduced-motion — Required, Not Optional

**What goes wrong:**
The entire UX of wintrack's win input flow is animation-driven. If `prefers-reduced-motion: reduce` is set in the OS (common for users with vestibular disorders, migraines, or epilepsy), the full-screen slide transitions create a potential accessibility/legal issue. WCAG 2.3.3 (Level AAA) and the intent of 2.2.2 (Level A) both address this.

**Why it happens:**
Developers build the animated version first and never test with reduced-motion enabled. The setting is a 30-second OS toggle but is almost never tested.

**How to avoid:**
Use Framer Motion's built-in `useReducedMotion()` hook to conditionally disable transitions:

```jsx
const shouldReduceMotion = useReducedMotion()

const variants = {
  enter: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: shouldReduceMotion ? 0 : -20 },
}
```

The form still steps through questions; it just cross-fades instead of sliding. The UX intent is preserved; the motion trigger is removed.

**Warning signs:**
- No reference to `prefers-reduced-motion` or `useReducedMotion` anywhere in animation code
- Framer Motion variants hardcode transform values without a reduced-motion branch

**Phase to address:**
Win input flow / Typeform UX phase. Add `useReducedMotion()` at the same time as the base animation — do not add it as a later accessibility cleanup task.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Streak logic using `new Date().toISOString().slice(0,10)` | Fast to write | Breaks for non-UTC users; silent corruption | Never |
| Timer state in React `useState` only (no Supabase persistence) | Simple implementation | State lost on refresh; cumulative time unreliable | Only in a UI prototype — must be fixed before calling feature done |
| Supabase RLS disabled for all tables | Zero setup friction | All data publicly readable/writable | Never in production, even for personal tools |
| `setInterval` as elapsed time accumulator | Intuitive implementation | Drift, background tab desync, inaccurate tracking | Never for a stopwatch; use timestamp subtraction |
| Hardcoded dark/light mode colors in Tailwind `bg-black text-white` classes scattered across components | Moves fast | Cannot implement dark/light toggle without touching every file | Only if dark/light toggle is explicitly deferred forever |
| Rolling wins without confirming intent | Simpler state machine | Users accumulate zombie wins they never intended to roll | Never — the roll action must be explicit |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase JS (no auth) | Using `anon` key with RLS disabled — assumes "no one will find the URL" | Enable RLS; treat `anon` key as publicly compromised by design |
| Supabase JS (no auth) | Calling `supabase.auth.getUser()` in data-fetching code, getting null, and crashing | Never reference auth APIs; fetch data unconditionally with RLS policies keyed to a known service identity |
| Supabase real-time | Subscribing to `postgres_changes` for every win card — triggers a WebSocket per card | Use a single subscription per table, dispatch to local state in the handler |
| Supabase real-time | Using real-time for a single-user SPA where there is only ever one writer | Polling on focus or manual refetch on mutation is simpler and has zero persistent connection overhead; use real-time only if multi-tab sync is needed |
| Vercel deployment | Committing `SUPABASE_SERVICE_ROLE_KEY` in `.env` and relying on `.gitignore` | Use Vercel environment variables only; never commit service role keys |
| Tailwind v4 | Using v3 `@apply` syntax or v3 config file structure — Tailwind v4 has a new CSS-first config | Verify all shadcn/ui documentation matches v4 config format; v3 tutorials will produce broken builds |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-rendering all win cards on every stopwatch tick | 60fps re-renders for every mounted card when any one timer is running | Isolate timer display into a standalone component with its own interval; use `React.memo` on card body | With 5+ wins on the same day all showing live timers |
| Supabase real-time subscription opened and not cleaned up on unmount | Memory leaks, duplicate event handlers, stale closures delivering updates to unmounted components | Always return `channel.unsubscribe()` from `useEffect` cleanup | Immediately — detectable in React DevTools strict mode |
| Fetching all wins ever from Supabase without date filter | Slow initial load as weeks of data accumulate | Always filter by `date >= today - 7 days` with a Supabase `.gte()` filter; paginate or date-window history views | After ~90 days of daily use |
| Recalculating streak by fetching all wins on every page load | N+1 pattern as data grows | Cache the streak count in a `settings` or `streaks` table; update it incrementally on check-in completion | After ~6 months of daily use |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| RLS disabled on any public schema table | Anyone with the Supabase project URL can read/write/delete all data | Enable RLS on all tables before writing application code |
| Service role key in client-side code | Complete database admin access from the browser | Service role key is Vercel server-only; client-side code uses anon key only, with RLS enforcing access |
| No input length validation on win text | Wins table accumulates arbitrarily long strings; potential for storage abuse | Enforce `maxlength` on the input and a database-level `CHECK (char_length(title) <= 280)` constraint |
| Journal entries stored without any access control | Personal reflections readable by anyone who finds the URL | Same RLS treatment as wins table |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Evening check-in requires completing all wins before showing journal | Interrupts flow for users who want to write first | Make check-in and journal independent; do not gate journal on check-in completion |
| Roll-to-tomorrow silently rolls incomplete wins without confirmation | Users discover stale wins from 3 days ago with no memory of them | Explicit roll UI: show a list of incomplete wins with per-item "roll" or "abandon" buttons |
| Streak resets for missing a day create anxiety rather than motivation | User stops using the app after first miss rather than continuing | For a personal tool, consider a "lenient streak" that counts days with any activity, not just "at least one win complete" |
| Pure `#000000` on `#FFFFFF` text (or vice versa) causes visual vibration | Eye strain during long sessions, especially for users with astigmatism | Use near-black (`#0A0A0A`) and near-white (`#F5F5F5`) instead of absolute values; maintains the aesthetic without the physiological fatigue |
| Dark mode implemented as a single CSS class toggle with no system preference detection | Users in a bright room are blinded if their OS is set to dark mode and the app defaults to light | Check `prefers-color-scheme` on first load; default to system preference, then let the user override |
| Full-screen Typeform flow has no "back" mechanism | User fat-fingers the wrong win title, cannot correct it without abandoning and restarting | Show a subtle back arrow or Escape-to-edit affordance even if it is visually minimal |

---

## "Looks Done But Isn't" Checklist

- [ ] **Stopwatch:** Timer appears to work — verify it stays accurate across a 10-minute background tab stint; verify it survives a page refresh (persisted state restored correctly)
- [ ] **Streak counter:** Shows correct number — verify it computes from local date, not UTC; test at 11:50 PM local and verify the "today" boundary is correct
- [ ] **Win roll-forward:** Button exists — verify rolled wins appear at the top of tomorrow's list, not buried; verify rolling does not create a duplicate entry
- [ ] **Evening check-in:** Yes/no buttons respond — verify submitting partial check-in (some wins checked, some not) is handled without data corruption; verify the reflection note saves independently
- [ ] **Dark/light toggle:** Colors flip — verify no hardcoded `text-white` or `text-black` classes remain in component code; verify the Tailwind `dark:` variant applies everywhere
- [ ] **Supabase persistence:** Data appears to save — verify data survives a full browser close and reopen (not just a refresh); verify no data is written to `localStorage` that would conflict with Supabase state
- [ ] **Typeform animation:** Steps animate in — verify with keyboard-only navigation that focus lands on each new input automatically; verify with OS reduced-motion enabled that the flow still works (just without slide animation)
- [ ] **RLS:** App appears to work — open a private/incognito window, copy the network request from DevTools, replay it directly against Supabase REST API — it should return 403, not data

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Timer drift discovered after launch | LOW | Switch to timestamp-based model; no schema changes needed |
| Timer state not persisted (lost on refresh) | MEDIUM | Add timer columns to wins table migration; backfill existing rows with 0; update hook to read/write through Supabase |
| Streak corrupted by UTC vs local date bug | MEDIUM | Audit all affected date comparisons; write migration to recalculate historical streaks from win `completed_at` timestamps using correct local timezone |
| RLS disabled and data is public | LOW (personal tool, no PII) | Enable RLS immediately; add policies; rotate Supabase anon key if any unauthorized access is suspected |
| Typeform flow has broken focus management | LOW | Add `useEffect` + `requestAnimationFrame` + `focus()` to each step; no architectural changes needed |
| AnimatePresence layout stacking discovered | LOW | Add `position: absolute; inset: 0` to animated step divs; add `overflow: hidden` to container |
| Dark/light mode breaks because colors are hardcoded | HIGH | Requires touching every component to replace hardcoded values with CSS variables or Tailwind semantic tokens — avoid by using semantic tokens from the start |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Timer drift (setInterval as source of truth) | Win card / stopwatch feature | Manual: run timer for 10 min; computed elapsed must match wall clock within 1s |
| Background tab throttling breaks timer | Win card / stopwatch feature | Manual: start timer, switch tabs for 2 min, return — value must be consistent |
| Timer state lost on page refresh | Data model / schema design | Manual: start timer, hard-refresh, confirm elapsed time restored |
| Streak timezone / DST bugs | Streak feature | Unit test: simulate `completed_at` at 11:58 PM UTC-5 (= early next day UTC) — streak must credit correct local day |
| Supabase RLS disabled | Database setup (first phase) | Security check: unauthenticated REST call to Supabase must return 403 |
| Typeform focus management broken | Win input flow / Typeform UX | Tab-key-only walkthrough: focus must land on each new input without manual Tab |
| AnimatePresence layout shift | Win input flow / Typeform UX | Lighthouse CLS score must be 0; visual smoke test during step transitions |
| prefers-reduced-motion ignored | Win input flow / Typeform UX | Enable reduced-motion in OS; verify form steps cross-fade rather than slide |
| Hardcoded dark/light colors | Design system / theming phase | Toggle dark/light mode — no `text-white`/`text-black` classes should be visible in markup |
| Pure #000/#FFF eye strain | Design system / theming phase | Audit: no exact `#000000` or `#ffffff` values in CSS; use near-black/near-white tokens |

---

## Sources

- [Page Visibility API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
- [Harnessing the Page Visibility API with React — Seth Corker](https://blog.sethcorker.com/harnessing-the-page-visibility-api-with-react/)
- [Prevent Timers Stopping in Background Tabs — Iskander Samatov](https://isamatov.com/prevent-timers-stopping-javascript/)
- [Creating Accurate Timers in JavaScript — SitePoint](https://www.sitepoint.com/creating-accurate-timers-in-javascript/)
- [How to Build a Streaks Feature — Trophy](https://trophy.so/blog/how-to-build-a-streaks-feature)
- [Streak Timezone Bug — freeCodeCamp Forum](https://forum.freecodecamp.org/t/changing-my-computers-timezone-messes-with-the-streak-counts/701634)
- [No streak checkmarks between 11pm and midnight — Clozemaster Forum](https://forum.clozemaster.com/t/no-streak-checkmarks-between-11-p-m-and-midnight/8609)
- [Row Level Security — Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Securing your API — Supabase Docs](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase Security: Hidden Dangers of RLS — DEV Community](https://dev.to/fabio_a26a4e58d4163919a53/supabase-security-the-hidden-dangers-of-rls-and-how-to-audit-your-api-29e9)
- [Multistep wizard — Framer Motion Recipes (buildui.com)](https://buildui.com/courses/framer-motion-recipes/multistep-wizard)
- [Layout Animation — Motion docs](https://motion.dev/docs/react-layout-animations)
- [WCAG Success Criterion 2.3.3: Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)
- [prefers-reduced-motion — CSS-Tricks](https://css-tricks.com/almanac/rules/m/media/prefers-reduced-motion/)
- [Pure Black and Pure White in UI Design — Supercharge Design](https://supercharge.design/articles/pure-black-and-pure-white-in-ui-design)
- [Inclusive Dark Mode — Smashing Magazine](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/)
- [Focus Management in React Components — DEV Community](https://dev.to/micaavigliano/focus-management-how-to-improve-the-accessibility-and-usability-of-our-components-1865)
- [Realtime Limits — Supabase Docs](https://supabase.com/docs/guides/realtime/limits)

---
*Pitfalls research for: personal accountability and focus tracker SPA (wintrack)*
*Researched: 2026-03-09*
