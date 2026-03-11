# Phase 3: Daily Loop Closure - Research

**Researched:** 2026-03-09
**Domain:** React multi-step overlay, time-based in-app prompts, streak computation, push notification stubs
**Confidence:** HIGH

## Summary

Phase 3 closes the daily accountability loop with four interlocking pieces: a step-through evening check-in overlay, time-gated in-app prompts (morning and evening), a streak counter in the header, and push notification stubs. All infrastructure already exists — the overlay pattern, Zustand store, Supabase hooks, and date utility were established in Phases 1 and 2.

The primary design challenge is state coordination: multiple overlays can be triggered by time conditions on mount, and they must not stomp on each other or re-trigger on the same day. This is solved by storing dismissal state in `uiStore` (in-memory, per session) keyed to today's date. Prompt state is "shown once per day" — it does not need to persist across refreshes; a dismissed prompt for the current day is simply cleared on midnight rollover (next app open).

The streak computation is the only truly novel algorithm. It requires a multi-day backward scan of wins that have `completed = true`, grouped by `win_date`, counted for consecutive days up to and including today. This must use `getLocalDateString()` throughout to avoid timezone boundary corruption. The `check_ins` table (win-level rows keyed by `win_id`) is the persistence layer for check-in completion status — a win is "completed" when it has a check_in row with `completed = true`.

**Primary recommendation:** Reuse the existing overlay pattern (createPortal, plain CSS keyframes, visible/exiting state machine) for both the check-in overlay and the prompt overlays. Compute streak in a dedicated `useStreak` hook that queries the wins table for `completed` wins. Store per-day prompt dismissal in `uiStore` extended with a `promptDismissedDate` field.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Check-in Flow Structure**
- Step-through overlay: One win at a time, full-screen, same WinInputOverlay pattern — reuses existing animation infrastructure (plain CSS keyframes, createPortal)
- Entry point: "Start check-in" button (surfaced via evening in-app prompt and available on TodayPage)
- Each win screen shows: win title prominently + two buttons (Yes / No)
- On No: A reflection note text field appears on the same screen — "What happened?" Optional, can be skipped by pressing Enter or tapping Next
- On Yes: Advance immediately to next win — no note field
- Completion screen: After last win, show a brief final screen with tally (e.g., "3 of 4 — 24 min tracked") + current streak number. Auto-closes or tap to close. Not a celebration — informational and Stoic.

**In-App Prompts**
- Morning prompt (9am, no wins logged today): Full-screen overlay, appears on first app open after 9am if no wins exist for today. Only dismissible via buttons — no tap-anywhere dismiss. Buttons: "Log a win" (opens WinInputOverlay, closes morning overlay) and a secondary "Dismiss" or "Later" option. Copy direction: direct and ritual — e.g., "What are you committing to today?"
- Evening prompt (9pm, no check-in completed): Same full-screen overlay pattern as morning. Only dismissible via buttons. Buttons: "Start check-in" (opens check-in overlay) and secondary dismiss. Copy direction: reflective — e.g., "Time to close the loop."
- Both prompts: shown only once per day (state stored in uiStore or localStorage) — dismissing once per day is enough

**Streak Display**
- Location: Header area, right side — next to the wintrack wordmark (replacing or alongside the ThemeToggle)
- Format: Number only, mono font — stark and minimal. "7" not "7 days". Very Nothing Phone.
- At zero: Show "0" — consistent with number-only design; honest
- Calculation: Count of consecutive days (up to and including today) where at least one win has completed = true. Uses getLocalDateString() for timezone-safe date comparison.

**Push Notification Stubs (CHECKIN-04)**
- No visible UI — v1 is code comments only
- Implement a notifications.js utility with well-commented stub functions: scheduleMorningReminder() and scheduleEveningReminder()
- Each function logs to console in dev: `// TODO v2: register service worker, call Notification.requestPermission(), push at 9am/9pm`
- Document the v2 path clearly in comments — this is the deliverable for CHECKIN-04 in v1

### Claude's Discretion
- Exact animation/transition of check-in overlay steps (slide, fade, or both)
- Exact wording of prompt copy (beyond direction given above)
- Whether streak lives in a new useStreak hook or is computed in TodayPage/Header
- ThemeToggle placement adjustment when streak counter shares the header right side
- How check-in completion state is stored (check_ins table row vs wins column update)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CHECKIN-01 | User can complete an evening check-in — binary yes/no per win with optional short reflection note | Step-through overlay reusing WinInputOverlay pattern; check_ins table already exists; submitCheckin writes per-win rows |
| CHECKIN-02 | App shows an in-app morning prompt at 9am if no wins have been logged yet for today | Time-gated prompt: check current hour >= 9 and wins.length === 0; full-screen overlay with per-day dismissal in uiStore |
| CHECKIN-03 | App shows an in-app evening prompt at 9pm if the evening check-in has not been completed | Time-gated prompt: check current hour >= 21 and no check_in rows for today; full-screen overlay with per-day dismissal |
| CHECKIN-04 | App sends browser push notifications at 9am and 9pm as reminders | Stub-only: notifications.js utility with scheduleMorningReminder() and scheduleEveningReminder() — console.log + TODO comments only |
| STREAK-01 | App displays a streak counter for consecutive days where at least one win was marked complete | useStreak hook queries wins table for completed=true wins, groups by win_date, counts backward consecutive days using getLocalDateString() |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 (already installed) | 19.x | Component state, effects, portals | Project baseline |
| Zustand v5 (already installed) | 5.x | Overlay open/close state, prompt dismissed state | Established in Phase 2 for uiStore |
| Supabase JS (already installed) | 2.x | Persist check_in rows and query wins for streak | Project persistence layer |
| motion/react (already installed) | 12.x | Step transitions inside check-in overlay (fade between win steps) | Project animation library |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| createPortal (React DOM) | built-in | Mount overlays on document.body, escape overflow containers | All full-screen overlays — established pattern from WinInputOverlay |
| Intl.DateTimeFormat en-CA | browser built-in | YYYY-MM-DD date strings in local timezone | getLocalDateString() — already established, MUST use for all date comparisons |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| uiStore for prompt dismissed state | localStorage | localStorage persists across reloads (may be desired); uiStore resets on reload (simpler, prompts re-check conditions on each app open — acceptable since conditions are rechecked anyway). Claude's discretion. |
| check_ins table rows per win | completed boolean column on wins | check_ins table already exists and is designed for this purpose — use it |
| Plain CSS keyframes for step transitions | motion/react AnimatePresence | motion is already installed and works for in-component transitions. The CSS keyframe approach is for the outer overlay mount/unmount only. |

**Installation:** No new packages needed. All dependencies are present from Phases 1 and 2.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── checkin/
│   │   ├── CheckInOverlay.jsx         # Step-through check-in overlay
│   │   ├── CheckInOverlay.test.jsx    # Tests for check-in flow
│   │   ├── MorningPrompt.jsx          # Morning in-app prompt overlay
│   │   ├── MorningPrompt.test.jsx
│   │   ├── EveningPrompt.jsx          # Evening in-app prompt overlay
│   │   └── EveningPrompt.test.jsx
│   └── layout/
│       └── Header.jsx                 # Extended: add StreakCounter
├── hooks/
│   ├── useCheckin.js                  # submitCheckin() + hasCheckedInToday()
│   ├── useCheckin.test.js
│   ├── useStreak.js                   # streak count from wins table
│   └── useStreak.test.js
└── lib/
    └── notifications.js               # Stub: scheduleMorningReminder(), scheduleEveningReminder()
```

### Pattern 1: Step-Through Overlay State Machine
**What:** CheckInOverlay maintains a `step` index (0 to wins.length) and a per-step answer accumulator. Step advances on Yes (immediately) or on No+note submission. Step === wins.length shows the completion screen.
**When to use:** Any multi-step full-screen flow where each screen is sequential and terminal.
**Example:**
```jsx
// Source: established from WinInputOverlay.jsx pattern
function CheckInOverlay({ open, wins, onComplete, onClose }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]); // { winId, completed, note }

  // same visible/exiting state machine as WinInputOverlay
  useEffect(() => {
    if (open) { setVisible(true); setExiting(false); setStep(0); setAnswers([]); }
    else if (visible) { setExiting(true); }
  }, [open]);

  const handleYes = () => {
    setAnswers(prev => [...prev, { winId: wins[step].id, completed: true, note: null }]);
    setStep(s => s + 1);
  };

  const handleNo = (note) => {
    setAnswers(prev => [...prev, { winId: wins[step].id, completed: false, note }]);
    setStep(s => s + 1);
  };

  const isComplete = step === wins.length;
  // render step screen or completion screen accordingly
}
```

### Pattern 2: Time-Gated Prompt Logic
**What:** On `TodayPage` mount, compute current hour. If hour >= 9 and no wins: show morning prompt. If hour >= 21 and no check-in today: show evening prompt. Per-day dismissal stored in uiStore as a date string.
**When to use:** Any "show once per day if condition met" UI.
**Example:**
```jsx
// In TodayPage or a usePromptGating hook
const currentHour = new Date().getHours(); // local time — correct for single-user
const today = getLocalDateString();

// Morning: after 9am, no wins yet, not dismissed today
const showMorning = currentHour >= 9
  && wins.length === 0
  && !loading
  && morningDismissedDate !== today;

// Evening: after 9pm, no check-in completed today, not dismissed today
const showEvening = currentHour >= 21
  && !hasCheckedInToday
  && !loading
  && eveningDismissedDate !== today;
```

### Pattern 3: Streak Computation
**What:** Query wins table for rows where `completed = true`, group by `win_date`, sort descending, count consecutive days from today backward.
**When to use:** Any backward-scan streak calculation.
**Example:**
```js
// Source: established from date.js getLocalDateString pattern
async function computeStreak(userId) {
  const { data } = await supabase
    .from('wins')
    .select('win_date')
    .eq('user_id', userId)
    .eq('completed', true); // see pitfall note below

  const completedDates = new Set(data.map(r => r.win_date));
  let streak = 0;
  let cursor = new Date();

  while (completedDates.has(getLocalDateString(cursor))) {
    streak++;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return streak;
}
```

### Pattern 4: Prompt Dismissal in uiStore
**What:** Add `morningDismissedDate` and `eveningDismissedDate` (string | null) to uiStore. Actions set these to today's date string. Prompts compare against `getLocalDateString()`.
**When to use:** Per-day dismissal that resets naturally when the date changes (on next app open).
**Example:**
```js
// uiStore.js extension
morningDismissedDate: null,
eveningDismissedDate: null,
dismissMorningPrompt: () => set({ morningDismissedDate: getLocalDateString() }),
dismissEveningPrompt: () => set({ eveningDismissedDate: getLocalDateString() }),
```

### Anti-Patterns to Avoid
- **Using `new Date().toISOString().slice(0,10)` for date comparisons:** Always use `getLocalDateString()` — toISOString returns UTC and will corrupt streak at midnight for users in negative UTC offsets.
- **Querying `check_ins` for "has checked in today" by date field:** The `check_ins` table has no `win_date` column — it has `win_id` (foreign key to wins). Join through wins: get today's win IDs, then check if all/any have check_in rows.
- **Triggering prompts before loading completes:** Always gate prompts on `!loading` to avoid false positives when wins array is empty due to pending fetch.
- **Storing dismissed state only in component state:** Component unmounts on navigation — use uiStore (persists for the session) so dismissal survives tab switching.
- **Re-running onAnimationEnd unmount logic on enter animation:** The `onAnimationEnd` handler must check `exiting` before calling setVisible(false), otherwise the enter animation also triggers unmount.
- **Using `completed` column on wins table:** The schema does not have a `completed` column on wins — completion status lives in `check_ins` (rows with `completed = true`). "Completed win" means the win has a check_in row where `completed = true`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Full-screen overlay mount/unmount | Custom CSS transition manager | Existing `visible/exiting` useState + `onAnimationEnd` pattern from WinInputOverlay | Already solved and tested; duplicating creates divergence |
| Date arithmetic for "yesterday" | Manual ms math inline | `new Date(Date.now() - 86400000)` wrapped in getLocalDateString() | Already used in useWins — consistent |
| Step animation between wins in check-in | Custom CSS keyframes per step | `motion/react AnimatePresence` with `key={step}` | Per-step crossfade/slide is exactly what AnimatePresence is for; outer overlay mount uses CSS keyframes |
| Timezone-safe date strings | Manual timezone offset math | `getLocalDateString()` | Established utility, tested, handles DST |

**Key insight:** Phase 3 adds behavior on top of established infrastructure. The value is in correctly wiring existing pieces — not building new primitives.

---

## Common Pitfalls

### Pitfall 1: Schema Mismatch — wins table has no `completed` column
**What goes wrong:** Developer writes `wins.update({ completed: true })` — query succeeds silently but data goes nowhere useful (or fails if column doesn't exist).
**Why it happens:** The schema places completion status in `check_ins` (one row per win per check-in session), not on wins directly. The wins table has `status: 'pending'` but no boolean `completed`.
**How to avoid:** Check-in submission inserts rows into `check_ins` (win_id, user_id, completed, note). The wins table is NOT updated by check-in.
**Warning signs:** Check-in "succeeds" but streak stays 0; completed wins show no visual change.

### Pitfall 2: Streak Query Must Look Across Multiple Days
**What goes wrong:** Only querying today's wins for streak — streak always shows 0 or 1.
**Why it happens:** Streak requires a backward scan of past days — needs to fetch all wins with `completed = true` (across all dates), not just today.
**How to avoid:** `useStreak` queries `check_ins` joined with wins to get distinct `win_date` values where completed = true. Or: query wins, join client-side with check_in data. Simplest: Supabase query on check_ins joining wins for win_date.
**Warning signs:** Streak resets to 1 every day even with consecutive completions.

### Pitfall 3: "Has Checked In Today" Requires Joining check_ins Through wins
**What goes wrong:** Querying `check_ins` filtered by date directly — check_ins has no date column (only `checked_at` timestamptz and `win_id`).
**Why it happens:** The schema ties check_ins to wins via win_id, not to a date directly.
**How to avoid:** Two-step check: (1) get today's win IDs from the wins array already in memory, (2) check if any of those IDs appear in check_ins. Or: single Supabase query using `in` filter on win IDs. Since useWins already has today's wins, pass them as context.
**Warning signs:** "Has checked in" always returns false; evening prompt shows even after check-in.

### Pitfall 4: Multiple Overlays Fighting for Focus
**What goes wrong:** Morning prompt opens, user taps "Log a win", WinInputOverlay opens — but both overlays are visible simultaneously.
**Why it happens:** Both overlays are mounted and both have `open=true` in uiStore.
**How to avoid:** Dismissing morning/evening prompt MUST set its dismissed state before opening the downstream overlay (WinInputOverlay or CheckInOverlay). The dismiss action and open action can be called in sequence — uiStore is synchronous.
**Warning signs:** Two overlays visible at once; Escape closes the wrong one.

### Pitfall 5: Prompt Triggering Before Data Loads
**What goes wrong:** Morning prompt fires immediately on load when wins are empty (loading === true) — then disappears when real data arrives, but dismissedDate is already set.
**Why it happens:** Condition check runs before useWins fetch completes.
**How to avoid:** Gate all prompt visibility on `!loading` in useWins. Don't evaluate prompt conditions until loading is false.
**Warning signs:** Morning prompt flickers on every app load even when wins exist.

### Pitfall 6: Check-In Step Index Out of Bounds
**What goes wrong:** User has 0 wins — check-in overlay opens and immediately shows completion screen or crashes.
**Why it happens:** step=0 and wins.length=0 means `wins[step]` is undefined.
**How to avoid:** Guard: if `wins.length === 0`, show completion screen immediately (0 of 0 tally). Or: disable the "Start check-in" button when wins.length === 0.
**Warning signs:** TypeError: Cannot read properties of undefined on win title access.

---

## Code Examples

Verified patterns from existing codebase:

### Overlay Mount/Unmount State Machine (from WinInputOverlay.jsx)
```jsx
// Source: src/components/wins/WinInputOverlay.jsx
const [visible, setVisible] = useState(false);
const [exiting, setExiting] = useState(false);

useEffect(() => {
  if (open) {
    setVisible(true);
    setExiting(false);
  } else if (visible) {
    setExiting(true);
  }
}, [open]);

// In JSX:
if (!visible) return null;
return createPortal(
  <div
    className={exiting ? 'overlay-exit' : 'overlay-enter'}
    onAnimationEnd={() => { if (exiting) setVisible(false); }}
  />,
  document.body
);
```

### Zustand v5 Store Extension (from uiStore.js)
```js
// Source: src/stores/uiStore.js — extension pattern
// Zustand v5: create()(fn) double-parens, named exports
export const useUIStore = create((set) => ({
  // existing...
  inputOverlayOpen: false,
  editingWinId: null,
  rollForwardOffered: false,
  // Phase 3 additions:
  checkinOverlayOpen: false,
  morningDismissedDate: null,
  eveningDismissedDate: null,
  // actions...
  openCheckinOverlay: () => set({ checkinOverlayOpen: true }),
  closeCheckinOverlay: () => set({ checkinOverlayOpen: false }),
  dismissMorningPrompt: () => set({ morningDismissedDate: getLocalDateString() }),
  dismissEveningPrompt: () => set({ eveningDismissedDate: getLocalDateString() }),
}));
```

### Supabase check_ins Insert Pattern
```js
// Source: supabase/migrations/001_initial_schema.sql — check_ins table
// win_id (FK to wins), user_id, completed (bool), note (text|null)
const { error } = await supabase
  .from('check_ins')
  .insert(
    answers.map(({ winId, completed, note }) => ({
      user_id: USER_ID,
      win_id: winId,
      completed,
      note: note || null,
    }))
  )
  .eq('user_id', USER_ID);
```

### getLocalDateString Usage (from date.js)
```js
// Source: src/lib/utils/date.js
// Always use this — NEVER .toISOString().slice(0,10)
import { getLocalDateString } from '@/lib/utils/date';
const today = getLocalDateString();              // current date
const yesterday = getLocalDateString(new Date(Date.now() - 86400000));
```

### Notification Stub Pattern (CHECKIN-04)
```js
// src/lib/notifications.js
// v1: stubs only — no actual push delivery

export function scheduleMorningReminder() {
  if (import.meta.env.DEV) {
    console.log('[notifications] scheduleMorningReminder() called — stub only');
  }
  // TODO v2: Check Notification.permission, call requestPermission() if needed,
  // register service worker, use self.registration.showNotification() at 9am.
  // Requires: service worker file, push subscription, server-side scheduling or
  // client-side setTimeout (not reliable for background delivery).
}

export function scheduleEveningReminder() {
  if (import.meta.env.DEV) {
    console.log('[notifications] scheduleEveningReminder() called — stub only');
  }
  // TODO v2: same path as scheduleMorningReminder — target 9pm local time.
}
```

---

## Schema Deep-Dive

### check_ins Table (already exists)
```sql
-- From: supabase/migrations/001_initial_schema.sql
CREATE TABLE IF NOT EXISTS check_ins (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  win_id     uuid NOT NULL REFERENCES wins(id) ON DELETE CASCADE,
  completed  boolean NOT NULL DEFAULT false,
  note       text,
  checked_at timestamptz NOT NULL DEFAULT now()
);
```

Key observations:
- Keyed by `win_id`, NOT by date — "has checked in today" requires knowing today's win IDs
- `ON DELETE CASCADE` — deleting a win removes its check_in rows automatically
- No `win_date` column — streak query must join through wins to get dates
- `completed` is per-win-per-checkin — one check_in row per win per evening session

### wins Table — What Phase 3 Does NOT Modify
The wins table has no `completed` column and no `status` update for check-in. The `status: 'pending'` column was inserted during win creation (Phase 2) but is not used as the check-in completion signal. Check-in completion lives entirely in `check_ins`.

---

## Streak Computation Strategy

The locked decision: streak counts consecutive days (back from today) where at least one win has `completed = true` (i.e., has a check_in row with completed=true).

**Query approach:**
1. Fetch all check_in rows for this user where `completed = true`
2. For each check_in row, fetch the associated win's `win_date` — or join in a single query
3. Build a Set of distinct dates with at least one completed win
4. Count backward from today until a date is missing from the set

**Supabase join option (single query):**
```js
const { data } = await supabase
  .from('check_ins')
  .select('win_id, wins(win_date)')
  .eq('user_id', USER_ID)
  .eq('completed', true);

const completedDates = new Set(data.map(r => r.wins.win_date));
```

**Alternative (simpler, two queries):**
```js
// Query wins that have at least one completed check_in
const { data: completedWins } = await supabase
  .from('wins')
  .select('win_date')
  .eq('user_id', USER_ID)
  .in('id', completedWinIds); // requires knowing completed win IDs first
```

The join approach (single query) is preferred. Verify Supabase JS v2 join syntax during implementation — foreign key relations enable `select('*, wins(win_date)')` syntax.

**Discretion note:** A `useStreak` hook is the right encapsulation. It should expose `{ streak, loading }` and be called from `Header.jsx`.

---

## Validation Architecture

`nyquist_validation` is enabled in `.planning/config.json`.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + React Testing Library (jsdom) |
| Config file | `vitest.config.js` (root) |
| Quick run command | `mise exec -- npx vitest run --reporter=verbose` |
| Full suite command | `mise exec -- npx vitest run` |

### Sampling Rate
- **Per task commit:** `mise exec -- npx vitest run src/hooks/useStreak.test.js src/components/checkin/CheckInOverlay.test.jsx src/components/checkin/MorningPrompt.test.jsx src/components/checkin/EveningPrompt.test.jsx src/hooks/useCheckin.test.js`
- **Per wave merge:** `mise exec -- npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CHECKIN-01 | CheckInOverlay renders step per win with Yes/No buttons | unit | `mise exec -- npx vitest run src/components/checkin/CheckInOverlay.test.jsx` | ❌ Wave 0 |
| CHECKIN-01 | On Yes: advance to next win, no note field shown | unit | same | ❌ Wave 0 |
| CHECKIN-01 | On No: reflection text field appears on same screen | unit | same | ❌ Wave 0 |
| CHECKIN-01 | Completion screen shows tally after last win | unit | same | ❌ Wave 0 |
| CHECKIN-01 | submitCheckin() inserts check_in rows for all wins | unit | `mise exec -- npx vitest run src/hooks/useCheckin.test.js` | ❌ Wave 0 |
| CHECKIN-02 | MorningPrompt renders when hour >= 9, wins.length=0, not dismissed | unit | `mise exec -- npx vitest run src/components/checkin/MorningPrompt.test.jsx` | ❌ Wave 0 |
| CHECKIN-02 | MorningPrompt does NOT render when wins.length > 0 | unit | same | ❌ Wave 0 |
| CHECKIN-02 | MorningPrompt does NOT render when already dismissed today | unit | same | ❌ Wave 0 |
| CHECKIN-02 | "Log a win" button calls onLogWin callback | unit | same | ❌ Wave 0 |
| CHECKIN-03 | EveningPrompt renders when hour >= 21, no check-in today, not dismissed | unit | `mise exec -- npx vitest run src/components/checkin/EveningPrompt.test.jsx` | ❌ Wave 0 |
| CHECKIN-03 | EveningPrompt does NOT render when check-in already completed today | unit | same | ❌ Wave 0 |
| CHECKIN-03 | "Start check-in" button calls onStartCheckin callback | unit | same | ❌ Wave 0 |
| CHECKIN-04 | notifications.js exports scheduleMorningReminder and scheduleEveningReminder | unit | `mise exec -- npx vitest run src/lib/notifications.test.js` | ❌ Wave 0 |
| CHECKIN-04 | Both functions are callable without throwing | unit | same | ❌ Wave 0 |
| STREAK-01 | useStreak returns 0 when no completed wins | unit | `mise exec -- npx vitest run src/hooks/useStreak.test.js` | ❌ Wave 0 |
| STREAK-01 | useStreak returns 1 when today has >=1 completed win | unit | same | ❌ Wave 0 |
| STREAK-01 | useStreak returns N for N consecutive completed days | unit | same | ❌ Wave 0 |
| STREAK-01 | useStreak breaks streak on gap (no completed wins on a day) | unit | same | ❌ Wave 0 |
| STREAK-01 | streak does not corrupt across timezone boundaries | unit (mocked Intl) | same | ❌ Wave 0 |
| STREAK-01 | Streak counter visible in Header with correct number | manual-only | visual acceptance | N/A |
| CHECKIN-01 | Full check-in flow feels correct — overlay animation, step transitions, completion screen | manual-only | visual acceptance | N/A |
| CHECKIN-02 | Morning prompt appears at correct time with correct copy | manual-only | visual acceptance (requires time mock or testing at 9am) | N/A |
| CHECKIN-03 | Evening prompt appears at correct time with correct copy | manual-only | visual acceptance (requires time mock or testing at 9pm) | N/A |

### What Requires Manual/Browser Verification
- Overlay slide animation (CSS keyframes — jsdom doesn't run animations)
- Step-to-step transitions inside check-in (motion/react — no animation in jsdom)
- Prompt timing at actual 9am/9pm (time-of-day cannot be reliably simulated in all test scenarios)
- Streak counter visual display in header (layout/spacing with ThemeToggle)
- Check-in completion screen tally correctness (end-to-end user flow)

### What Is Intentionally Not Tested
- Actual push notification delivery — v1 is stubs only; no Notification API in jsdom. Tests verify the functions are callable and don't throw.
- Supabase network calls — mocked at module level (vi.mock('@/lib/supabase')) as established in Phase 2 tests.

### Wave 0 Gaps
- [ ] `src/components/checkin/CheckInOverlay.test.jsx` — covers CHECKIN-01 (step flow, yes/no, reflection note, completion screen)
- [ ] `src/components/checkin/MorningPrompt.test.jsx` — covers CHECKIN-02 (condition gating, dismissal, callback buttons)
- [ ] `src/components/checkin/EveningPrompt.test.jsx` — covers CHECKIN-03 (condition gating, dismissal, callback buttons)
- [ ] `src/lib/notifications.test.js` — covers CHECKIN-04 (exports exist, callable without throw)
- [ ] `src/hooks/useCheckin.test.js` — covers CHECKIN-01 Supabase submission logic
- [ ] `src/hooks/useStreak.test.js` — covers STREAK-01 (all streak computation cases)

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` package | `motion` package, import from `motion/react` | motion v12 rebranding | Must use `motion/react` not `framer-motion` — project-wide decision from Phase 2 |
| tw-animate-css for overlay transitions | Plain `@keyframes` in `index.css` | Phase 2 (fix commit 65a3ef6) | tw-animate-css conflicts with motion v12's CSS `translate` property — use `.overlay-enter`/`.overlay-exit` classes defined in index.css |
| `darkMode: 'class'` in tailwind.config.js | `@custom-variant dark` in index.css | Tailwind v4 | Tailwind v4 has no tailwind.config.js darkMode option — use `@custom-variant dark (&:is(.dark *))` in CSS |

**Deprecated/outdated:**
- `framer-motion` imports: replaced by `motion/react` — do not use `framer-motion` package name
- `tw-animate-css` `animate-in`/`slide-in-from-bottom` classes: do not generate CSS in this setup — use plain keyframes
- `uiStore.create(fn)` single-paren pattern: Zustand v5 requires `create()(fn)` double-parens

---

## Open Questions

1. **Streak query: should it scan all time or cap at N days?**
   - What we know: Query fetches all completed check_in rows for the user — no upper bound
   - What's unclear: Performance impact for a user with 365+ days of data; Supabase query on small personal dataset is negligible
   - Recommendation: No cap needed for v1 single-user dataset; add `.limit()` in v2 if needed

2. **Check-in completion: upsert or insert?**
   - What we know: check_ins schema has no unique constraint on (user_id, win_id, win_date). Running check-in twice in one evening would create duplicate rows.
   - What's unclear: Should duplicate check-ins be prevented at the DB level or UI level?
   - Recommendation: The "Start check-in" button should be disabled/hidden once `hasCheckedInToday` is true. UI prevention is sufficient for single-user app. If needed, add a unique constraint on (user_id, win_id) in a migration.

3. **Step transition animation direction inside check-in overlay**
   - What we know: Claude has discretion over this. Outer overlay uses slide-from-bottom CSS keyframes. Inner steps can use motion/react AnimatePresence.
   - Recommendation: Crossfade (opacity only) between steps is the simplest motion/react pattern, avoids direction complexity, and matches the Stoic/meditative pacing. Use `AnimatePresence mode="wait"` with `key={step}` and `initial/animate/exit` opacity.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `src/stores/uiStore.js`, `src/hooks/useWins.js`, `src/components/wins/WinInputOverlay.jsx`, `src/components/layout/Header.jsx`, `src/index.css`, `src/lib/utils/date.js`, `supabase/migrations/001_initial_schema.sql`
- Established test patterns — `src/components/wins/WinInputOverlay.test.jsx`, `src/hooks/useStopwatch.test.js`
- `.planning/STATE.md` — accumulated project decisions
- `.planning/phases/03-daily-loop-closure/03-CONTEXT.md` — locked user decisions

### Secondary (MEDIUM confidence)
- Supabase JS v2 foreign-key join syntax (`select('*, relation(field)')`) — verified against Supabase documentation patterns; confirm exact syntax during implementation

### Tertiary (LOW confidence)
- None — all research grounded in existing codebase

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in active use
- Architecture: HIGH — patterns are extensions of Phase 2 established code
- Pitfalls: HIGH — identified from direct schema inspection and known gotchas in MEMORY.md
- Streak computation: MEDIUM — Supabase join syntax should be verified during Wave 0

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable stack; Supabase JS v2 API stable)
