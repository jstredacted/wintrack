# Phase 2: Win Logging & Focus Tracking - Research

**Researched:** 2026-03-09
**Domain:** Typeform-style input flow, CRUD wins, wall-clock stopwatch, Zustand state, framer-motion/motion animations
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Win Input Flow**
- Single step only: one full-screen prompt — just the win title. No secondary prompts (no "why", no time estimate).
- Maximum friction reduction — type, Enter/submit, done.

### Claude's Discretion

- Win Card Design — all card layout, typography, action buttons
- Stopwatch UX — button placement, states, display format
- Roll-Forward Flow — confirmation UI, how "incomplete wins from yesterday" are presented
- All other implementation details not explicitly decided above

### Deferred Ideas (OUT OF SCOPE)

None captured yet.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WIN-01 | User can create a win using a full-screen Typeform-style input flow (one prompt at a time, animated transitions between steps) | Single-step flow: full-screen input + AnimatePresence mode="wait" slide transition; Supabase insert to wins table |
| WIN-02 | User can edit the text of an existing win | Inline edit on win card; Supabase `.update()` filtered by id; optimistic state update |
| WIN-03 | User can delete a win from today's list | Delete action on win card with confirm affordance; Supabase `.delete()` filtered by id |
| WIN-04 | User can roll incomplete wins from yesterday into today's list | Query wins by yesterday's win_date; confirmation step; bulk Supabase inserts with today's win_date |
| TIMER-01 | User can start, stop, and pause a stopwatch for any win | useStopwatch hook using wall-clock timestamps; start sets timer_started_at; stop saves elapsed, clears timer_started_at; pause accumulates elapsed |
| TIMER-02 | Cumulative time logged for a win is displayed on its win card | Display timer_elapsed_seconds + (running ? Date.now() - timer_started_at : 0); recovers on refresh |
| TIMER-03 | Today view shows total focused time across all wins for the day | Sum timer_elapsed_seconds across wins for today's win_date; add live running timer contribution |
</phase_requirements>

---

## Summary

Phase 2 builds the core user-facing loop: log a win, track time on it, and manage wins for the day. It has three independent sub-domains that can be planned as separate waves: (1) the full-screen win input flow with Typeform-style animation, (2) win list CRUD (edit, delete, roll-forward), and (3) the per-win stopwatch with wall-clock recovery.

The animation layer uses the `motion` package (the rebranded successor to `framer-motion` — same API, new package name). The import is `from "motion/react"`. The `AnimatePresence mode="wait"` pattern gates the next step's entrance until the current step has fully exited — exactly the Typeform feel. Since the user locked the input flow to a single step (win title only), the "multi-step" AnimatePresence logic simplifies: it's really a full-screen form that mounts on a "add win" trigger and unmounts on submit, with enter/exit animations on the overlay.

The stopwatch is the most nuanced piece. The schema already has `timer_elapsed_seconds` (integer) and `timer_started_at` (timestamptz nullable) in the wins table from Phase 1. The pattern: `elapsed = timer_elapsed_seconds + (timer_started_at ? (Date.now() - new Date(timer_started_at).getTime()) / 1000 : 0)`. This recovers correctly after page refresh and background tab because it's pure math on wall-clock time — no interval drift. The `setInterval` is used only to trigger re-renders every second for the live display, not to accumulate elapsed time.

Zustand manages local UI state (which win is being edited, active modal/overlay state, optimistic adds/removes before Supabase confirms) and is not persisted — Supabase is the source of truth. The `useWins` hook is the recommended pattern: fetches today's wins on mount, exposes actions (addWin, editWin, deleteWin, rollForward, startTimer, pauseTimer, stopTimer) that each call Supabase and update local state.

**Primary recommendation:** Use `motion` (not `framer-motion`) for animations, Zustand v5 for local UI state (no persist needed), a single `useWins` hook as the data layer, and wall-clock arithmetic for all stopwatch elapsed computation.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `motion` | ^12.x (latest ~12.35) | AnimatePresence, motion.div for Typeform-style transitions | Official rebranding of framer-motion; same API, new import path `motion/react`; no breaking changes from framer-motion |
| `zustand` | ^5.0.x (latest 5.0.8) | Local UI state — active overlays, optimistic list state | Minimal boilerplate; works with React 19 via useSyncExternalStore; no Provider needed |
| `@supabase/supabase-js` | 2.98.0 (already installed) | CRUD on wins table (insert, update, delete, select by win_date) | Already configured with accessToken pattern from Phase 1 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react` (built-in hooks) | 19.x (already installed) | `useOptimistic`, `useActionState` for instant-feeling CRUD | React 19 ships both — no extra install; useOptimistic for add/delete list operations |
| `lucide-react` | ^0.577.0 (already installed) | Timer icons (Play, Pause, Square), edit/delete icons (Pencil, Trash2) | Already in project |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `motion` | `framer-motion` | framer-motion is the legacy package name; both work — use `motion` for new installs per official guidance |
| `zustand` | React Context + useReducer | Context causes re-renders across the tree; Zustand re-renders only subscribed components — better for stopwatch tick updates |
| `useOptimistic` | Manual pending state | useOptimistic is built into React 19 and handles rollback; worth using for add/delete |

**Installation:**
```bash
npm install motion zustand
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── wins/
│   │   ├── WinInputOverlay.jsx    # Full-screen input with AnimatePresence
│   │   ├── WinCard.jsx            # Win card: title, edit, delete, stopwatch
│   │   ├── WinList.jsx            # List of today's wins + empty state
│   │   ├── RollForwardPrompt.jsx  # Confirmation dialog for yesterday's wins
│   │   └── TotalFocusTime.jsx     # Today's summed focus time display
│   └── layout/                    # (already exists from Phase 1)
├── hooks/
│   ├── useWins.js                 # Primary data hook: fetch, CRUD, timer actions
│   └── useStopwatch.js            # Pure elapsed-time computation + display tick
├── stores/
│   └── uiStore.js                 # Zustand: inputOverlayOpen, editingWinId, etc.
├── pages/
│   └── TodayPage.jsx              # Composed from WinList + WinInputOverlay
└── lib/
    └── utils/
        └── date.js                # (already exists — getLocalDateString)
```

### Pattern 1: Full-Screen Win Input Overlay (Typeform Style)

**What:** A full-screen overlay mounts/unmounts with AnimatePresence. Since there is exactly one prompt (win title), this is an enter/exit animation on the overlay container — not a multi-step flow.

**When to use:** Triggered by a "+" or "Log a win" button. Dismissed on submit or Escape.

```jsx
// src/components/wins/WinInputOverlay.jsx
// Source: motion.dev/docs/react-animate-presence
import { AnimatePresence, motion } from "motion/react";
import { useRef } from "react";

export default function WinInputOverlay({ open, onSubmit, onClose }) {
  const inputRef = useRef(null);

  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.div
          key="win-input"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -32 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-8"
          onAnimationComplete={() => inputRef.current?.focus()}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const title = new FormData(e.target).get("title");
              if (title?.trim()) onSubmit(title.trim());
            }}
          >
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-4">
              What's your win today?
            </p>
            <input
              ref={inputRef}
              name="title"
              autoComplete="off"
              className="w-full bg-transparent text-2xl font-mono outline-none border-b border-border pb-2 text-foreground"
              placeholder="I shipped..."
            />
            <button type="submit" className="sr-only">Submit</button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Critical:** `AnimatePresence` must wrap the conditional, not be inside it. The `key` prop on the motion element is required.

### Pattern 2: Wall-Clock Stopwatch

**What:** Elapsed time is computed from `timer_elapsed_seconds` (persisted base) plus live delta from `timer_started_at`. A `setInterval` fires every second only to trigger re-renders — it does NOT accumulate time.

**When to use:** Every win card that needs a live timer display.

```js
// src/hooks/useStopwatch.js
import { useState, useEffect } from "react";

/**
 * Compute live elapsed seconds from DB columns.
 * - elapsedBase: timer_elapsed_seconds from DB (what was saved when last paused/stopped)
 * - startedAt: timer_started_at from DB (timestamptz string or null)
 *
 * Returns { displaySeconds, isRunning }
 */
export function useStopwatch(elapsedBase, startedAt) {
  const [tick, setTick] = useState(0);

  const isRunning = startedAt != null;

  const liveElapsed = isRunning
    ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
    : 0;

  const displaySeconds = elapsedBase + liveElapsed;

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  return { displaySeconds, isRunning };
}

/** Format seconds as HH:MM:SS or MM:SS */
export function formatElapsed(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
```

**Recovery proof:** On page refresh, `timer_elapsed_seconds` is loaded from DB, `timer_started_at` is loaded from DB. The `liveElapsed` math uses `Date.now()` at render time — the correct elapsed appears immediately, even if the tab was backgrounded for hours.

### Pattern 3: Stopwatch DB Actions

**What:** The three timer state transitions in terms of Supabase column values.

| Action | timer_elapsed_seconds | timer_started_at |
|--------|-----------------------|-----------------|
| Start (from 0 or paused) | unchanged | `new Date().toISOString()` |
| Pause | `current displaySeconds` | `null` |
| Stop | `current displaySeconds` | `null` |

```js
// Inside useWins.js — timer actions
async function startTimer(winId, currentElapsed) {
  const timer_started_at = new Date().toISOString();
  // Optimistic update local state
  setWins((prev) =>
    prev.map((w) => w.id === winId ? { ...w, timer_started_at } : w)
  );
  await supabase
    .from("wins")
    .update({ timer_started_at })
    .eq("id", winId)
    .eq("user_id", import.meta.env.VITE_USER_ID);
}

async function pauseTimer(winId, displaySeconds) {
  // Snapshot the current displayed elapsed before clearing timer_started_at
  setWins((prev) =>
    prev.map((w) =>
      w.id === winId
        ? { ...w, timer_elapsed_seconds: displaySeconds, timer_started_at: null }
        : w
    )
  );
  await supabase
    .from("wins")
    .update({ timer_elapsed_seconds: displaySeconds, timer_started_at: null })
    .eq("id", winId)
    .eq("user_id", import.meta.env.VITE_USER_ID);
}
// stopTimer is identical to pauseTimer for this app's purposes
```

### Pattern 4: Zustand UI Store

**What:** Minimal store for UI-only state. Does NOT hold wins data — that stays in useWins hook.

```js
// src/stores/uiStore.js
import { create } from "zustand";

export const useUIStore = create((set) => ({
  inputOverlayOpen: false,
  editingWinId: null,

  openInputOverlay: () => set({ inputOverlayOpen: true }),
  closeInputOverlay: () => set({ inputOverlayOpen: false }),
  setEditingWin: (id) => set({ editingWinId: id }),
  clearEditingWin: () => set({ editingWinId: null }),
}));
```

**Note:** Zustand v5 uses `create` (named export only — no default export). TypeScript users write `create<State>()(fn)` — the double parentheses are required in v5.

### Pattern 5: Roll-Forward Flow

**What:** Query yesterday's wins where no check-in completed flag exists. Show a confirmation prompt. On confirm, bulk insert copies of those wins with today's `win_date`.

```js
// Inside useWins.js — roll-forward
async function rollForwardYesterdayWins() {
  const yesterday = getLocalDateString(new Date(Date.now() - 86400000));
  const today = getLocalDateString();

  const { data: staleWins } = await supabase
    .from("wins")
    .select("title")
    .eq("win_date", yesterday)
    .eq("user_id", import.meta.env.VITE_USER_ID);

  if (!staleWins?.length) return;

  const newWins = staleWins.map((w) => ({
    user_id: import.meta.env.VITE_USER_ID,
    title: w.title,
    win_date: today,
    timer_elapsed_seconds: 0,
    timer_started_at: null,
  }));

  const { data } = await supabase.from("wins").insert(newWins).select();
  setWins((prev) => [...prev, ...data]);
}
```

**Design note:** Roll-forward creates fresh wins with today's date and zero timer state. Original yesterday wins remain in the DB (visible in History phase 4). Phase 2 only needs to know IF yesterday has any wins to show the prompt — the count is surfaced on mount.

### Pattern 6: Supabase CRUD for Wins

```js
// READ — today's wins
const { data } = await supabase
  .from("wins")
  .select("*")
  .eq("win_date", getLocalDateString())
  .eq("user_id", import.meta.env.VITE_USER_ID)
  .order("created_at", { ascending: true });

// INSERT
const { data: newWin } = await supabase
  .from("wins")
  .insert({
    user_id: import.meta.env.VITE_USER_ID,
    title,
    win_date: getLocalDateString(),
  })
  .select()
  .single();

// UPDATE (title edit)
await supabase
  .from("wins")
  .update({ title: newTitle })
  .eq("id", winId)
  .eq("user_id", import.meta.env.VITE_USER_ID);

// DELETE
await supabase
  .from("wins")
  .delete()
  .eq("id", winId)
  .eq("user_id", import.meta.env.VITE_USER_ID);
```

**Note:** Always include `.eq("user_id", import.meta.env.VITE_USER_ID)` on every mutation as a defense-in-depth layer alongside RLS.

### Anti-Patterns to Avoid

- **`setInterval` accumulation for elapsed time:** `setInterval` drifts, misses ticks when tab is backgrounded, and produces wrong values after page refresh. Use wall-clock math only.
- **Importing from `framer-motion` in new code:** Both packages work but use `motion` for all new imports in Phase 2 (`import { motion, AnimatePresence } from "motion/react"`).
- **AnimatePresence inside conditional:** `<AnimatePresence>` must be the outer wrapper; the conditional must be inside it, not the other way around.
- **Storing elapsed in React state and writing to DB on every tick:** Only write to DB on pause/stop, not on every second tick. Use local computation for the live display.
- **Calling `supabase.auth.*`:** Still disabled via the `accessToken` pattern. Use `import.meta.env.VITE_USER_ID` for user identity.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animation orchestration | Custom CSS transition manager | `AnimatePresence` from `motion/react` | AnimatePresence handles DOM retention during exit, mode="wait" sequencing, key-based unmount detection — all edge cases |
| Elapsed time display | `setInterval` counter stored in state | Wall-clock arithmetic: `elapsedBase + (Date.now() - startedAt) / 1000` | Interval accumulation drifts; wall-clock is correct after refresh, background tab, system sleep |
| UI state (overlay open, edit mode) | React Context + manual prop drilling | Zustand `useUIStore` | Fine-grained subscription — timer tick re-renders don't ripple to unrelated components |
| Form submit with optimistic add | Manual pending boolean | React 19 `useOptimistic` | Handles rollback on failure automatically; built into React 19 (already installed) |

**Key insight:** The stopwatch is the only technically subtle piece. Everything else is standard Supabase CRUD wired to React state. The wall-clock pattern makes the timer implementation simpler than a `setInterval` approach, not more complex.

---

## Common Pitfalls

### Pitfall 1: setInterval Timer Drift and Background Tab Errors
**What goes wrong:** Timer shows wrong elapsed after browser tab goes to background, system sleeps, or page refreshes.
**Why it happens:** `setInterval` is throttled or paused in background tabs (browsers throttle timers to 1/minute in inactive tabs). Accumulated state is lost on refresh.
**How to avoid:** Never accumulate elapsed in `setInterval`. Store `timer_started_at` as an absolute timestamp in DB. Compute `elapsed = elapsedBase + (Date.now() - startedAt) / 1000` on every render. The `setInterval` triggers re-renders only.
**Warning signs:** Timer shows lower-than-actual time after switching away from tab; shows 0 after page refresh while timer is supposedly running.

### Pitfall 2: AnimatePresence Not Animating Exit
**What goes wrong:** Component disappears instantly with no exit animation when removed from DOM.
**Why it happens:** Either (a) `AnimatePresence` is inside the conditional rather than wrapping it, (b) the animated child is missing a `key` prop, or (c) the child is not a direct `motion.*` component.
**How to avoid:** Structure: `<AnimatePresence>{condition && <motion.div key="stable-key" exit={{...}}>...</motion.div>}</AnimatePresence>`.
**Warning signs:** Remove win from list — it vanishes without animating out.

### Pitfall 3: Stale Elapsed on Pause
**What goes wrong:** After pause, `timer_elapsed_seconds` in DB is lower than what was displayed (e.g., shows 0 after pause if base was never updated).
**Why it happens:** Only `timer_started_at` was cleared but `timer_elapsed_seconds` was not updated with the current live value before clearing.
**How to avoid:** On pause/stop: compute `displaySeconds = elapsedBase + liveElapsed`, write BOTH `{ timer_elapsed_seconds: displaySeconds, timer_started_at: null }` in one `.update()` call.
**Warning signs:** After pause, elapsed resets to what it was when the win was last saved, losing the current session's time.

### Pitfall 4: Roll-Forward Creates Duplicate Wins
**What goes wrong:** User triggers roll-forward multiple times; yesterday's wins get duplicated each time.
**Why it happens:** No deduplication guard.
**How to avoid:** After rolling forward, the prompt should not appear again. Guard: only show roll-forward prompt if there are wins for yesterday AND none of them have already been rolled (checking by title match is fragile — better: only show prompt once per session after fetching). Simplest implementation: track `rollForwardOffered` in session state (Zustand `uiStore`), set it to `true` after the prompt is shown or dismissed regardless of user choice.
**Warning signs:** Today's win list has duplicate entries.

### Pitfall 5: Total Focus Time Not Accounting for Running Timer
**What goes wrong:** The TIMER-03 sum shows accumulated time but doesn't include the currently-running timer's live contribution.
**Why it happens:** Summing `timer_elapsed_seconds` from DB only; live delta not added.
**How to avoid:** `totalSeconds = wins.reduce((sum, w) => sum + w.timer_elapsed_seconds + (w.timer_started_at ? Math.floor((Date.now() - new Date(w.timer_started_at).getTime()) / 1000) : 0), 0)`. Recompute on each render tick (driven by the running timer's interval).
**Warning signs:** Total focus time on Today view is lower than the sum shown on individual cards.

### Pitfall 6: Motion Import from Wrong Package
**What goes wrong:** Runtime error or import not found.
**Why it happens:** Using `import { motion } from "framer-motion"` when only `motion` is installed, or importing from `"motion"` instead of `"motion/react"`.
**How to avoid:** Always use `import { motion, AnimatePresence } from "motion/react"`. The subpath `/react` is required.
**Warning signs:** `Module not found: 'framer-motion'` or `The requested module 'motion' does not provide an export named 'motion'`.

---

## Code Examples

### Win Input Keyboard Handling (Enter submits, Escape closes)

```jsx
// Inside WinInputOverlay — add to the input element
<input
  name="title"
  onKeyDown={(e) => {
    if (e.key === "Escape") onClose();
    // Enter naturally submits the <form> — no special handling needed
  }}
/>
```

### Roll-Forward Prompt Component

```jsx
// src/components/wins/RollForwardPrompt.jsx
export default function RollForwardPrompt({ count, onConfirm, onDismiss }) {
  return (
    <div className="border border-border rounded p-4 flex items-center justify-between gap-4 text-sm font-mono">
      <span className="text-muted-foreground">
        {count} unfinished win{count !== 1 ? "s" : ""} from yesterday — carry forward?
      </span>
      <div className="flex gap-2">
        <button onClick={onConfirm} className="text-foreground underline">Yes</button>
        <button onClick={onDismiss} className="text-muted-foreground">Dismiss</button>
      </div>
    </div>
  );
}
```

### Today Total Focus Time

```jsx
// src/components/wins/TotalFocusTime.jsx
import { useStopwatch, formatElapsed } from "@/hooks/useStopwatch";

export default function TotalFocusTime({ wins }) {
  // Re-render once/second if any timer is running
  const anyRunning = wins.some((w) => w.timer_started_at != null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!anyRunning) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [anyRunning]);

  const totalSeconds = wins.reduce((sum, w) => {
    const live = w.timer_started_at
      ? Math.floor((Date.now() - new Date(w.timer_started_at).getTime()) / 1000)
      : 0;
    return sum + w.timer_elapsed_seconds + live;
  }, 0);

  if (totalSeconds === 0) return null;

  return (
    <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
      Focus today: {formatElapsed(totalSeconds)}
    </p>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `import from "framer-motion"` | `import from "motion/react"` | Rebranded late 2024 | Same API, new package name; `framer-motion` still works but is legacy |
| `create(fn)` in Zustand v4 | `create<T>()(fn)` in Zustand v5 | Zustand v5 (2024) | Double parentheses required for correct TypeScript inference |
| `setInterval` elapsed accumulation | Wall-clock `Date.now() - startedAt` math | Best practice (not library) | Correct after refresh, background tabs, system sleep |
| React Context for UI state | Zustand store | ~2022 onward | Fine-grained re-renders; no Provider tree pollution |
| `useOptimistic` not available | `useOptimistic` built into React 19 | React 19 (2024) | Instant UI with automatic rollback; no extra library |

**Deprecated/outdated:**
- `framer-motion` package: still works (maintained as legacy re-export of `motion`) but use `motion` for Phase 2
- `AnimatePresence` `popLayout` mode: exists but not appropriate here — use `mode="wait"` for sequential step transitions

---

## Open Questions

1. **Win card edit UX: inline or modal?**
   - What we know: User didn't specify. Both are common patterns.
   - What's unclear: Inline edit (expand input in place) vs. a small modal/popover.
   - Recommendation (Claude's discretion): Inline edit is lower friction and fits the monospaced design language. Clicking the title text transforms it into an editable input, confirmed with Enter, cancelled with Escape.

2. **Stopwatch button placement on win card**
   - What we know: User didn't specify. At least three states: idle (start), running (pause + stop), paused (resume + stop).
   - What's unclear: Whether to show Play/Pause/Stop as icon buttons or a single toggle.
   - Recommendation (Claude's discretion): Two-button approach when running (Pause | Stop), single Play button when idle/paused. Fits the card-level action row naturally.

3. **Roll-forward trigger: auto-show on mount or button?**
   - What we know: "A confirmation step is shown before rolls occur" — confirmed from requirements.
   - What's unclear: Whether the prompt appears automatically if yesterday has wins, or if it's opt-in via a button.
   - Recommendation (Claude's discretion): Auto-surface as an inline banner at the top of Today view if yesterday has unrolled wins. This is the Typeform "helpful nudge" feel. Dismissed once per session via Zustand `uiStore`.

4. **Schema `win_date` for "yesterday's incomplete wins" definition**
   - What we know: There's no "completed" column on wins — that's in `check_ins` (Phase 3). In Phase 2, "incomplete" means "logged for yesterday but not yet rolled forward."
   - What's unclear: Without `check_ins` data, "incomplete" is approximated as "exists for yesterday."
   - Recommendation: For Phase 2, "yesterday's wins" = wins with `win_date = yesterday`. The `check_ins` table exists but is populated in Phase 3. Phase 2 roll-forward copies all of yesterday's wins regardless of completion status. This is acceptable — Phase 3 can refine this logic.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x (already installed) |
| Config file | `vitest.config.js` (exists — jsdom environment, setupFiles: test-setup.js) |
| Quick run command | `npx vitest run src/hooks/ src/components/wins/ --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WIN-01 | WinInputOverlay renders full-screen when open=true | unit (RTL) | `npx vitest run src/components/wins/WinInputOverlay.test.jsx -x` | Wave 0 gap |
| WIN-01 | Submitting form with title calls onSubmit callback | unit (RTL) | `npx vitest run src/components/wins/WinInputOverlay.test.jsx -x` | Wave 0 gap |
| WIN-01 | Pressing Escape calls onClose callback | unit (RTL) | `npx vitest run src/components/wins/WinInputOverlay.test.jsx -x` | Wave 0 gap |
| WIN-02 | Editing win title updates displayed title | unit (RTL) | `npx vitest run src/components/wins/WinCard.test.jsx -x` | Wave 0 gap |
| WIN-03 | Delete action removes win from list | unit (RTL) | `npx vitest run src/components/wins/WinCard.test.jsx -x` | Wave 0 gap |
| WIN-04 | Roll-forward prompt shows count of yesterday wins | unit (RTL) | `npx vitest run src/components/wins/RollForwardPrompt.test.jsx -x` | Wave 0 gap |
| TIMER-01 | useStopwatch returns isRunning=false when startedAt=null | unit | `npx vitest run src/hooks/useStopwatch.test.js -x` | Wave 0 gap |
| TIMER-01 | useStopwatch returns isRunning=true when startedAt is set | unit | `npx vitest run src/hooks/useStopwatch.test.js -x` | Wave 0 gap |
| TIMER-02 | displaySeconds = elapsedBase + live delta when running | unit | `npx vitest run src/hooks/useStopwatch.test.js -x` | Wave 0 gap |
| TIMER-02 | displaySeconds = elapsedBase when stopped (startedAt=null) | unit | `npx vitest run src/hooks/useStopwatch.test.js -x` | Wave 0 gap |
| TIMER-02 | displaySeconds correct after simulated page refresh (new Date(startedAt) math) | unit | `npx vitest run src/hooks/useStopwatch.test.js -x` | Wave 0 gap |
| TIMER-03 | TotalFocusTime sums elapsed across all wins including live running timer | unit (RTL) | `npx vitest run src/components/wins/TotalFocusTime.test.jsx -x` | Wave 0 gap |
| TIMER-03 | TotalFocusTime shows null/nothing when total is 0 | unit (RTL) | `npx vitest run src/components/wins/TotalFocusTime.test.jsx -x` | Wave 0 gap |
| TIMER-01 | Visual: start/pause/stop buttons render correct state — manual | manual-only | Visual inspection in browser | n/a |
| WIN-01 | Visual: full-screen overlay animates in/out (AnimatePresence) — manual | manual-only | Visual inspection in browser | n/a |

**Notes:**
- Supabase calls will be mocked via `vi.mock("@/lib/supabase")` in component tests.
- `useStopwatch` is pure logic (no DOM) — easy to unit test with fake timestamps via `vi.setSystemTime`.
- AnimatePresence exit animations require a real browser or JSDOM with fake timers; test only the open/close callbacks, not the animation itself.

### Sampling Rate

- **Per task commit:** `npx vitest run src/hooks/ --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/hooks/useStopwatch.test.js` — covers TIMER-01, TIMER-02 (wall-clock arithmetic, refresh recovery)
- [ ] `src/components/wins/WinInputOverlay.test.jsx` — covers WIN-01 (render, submit, Escape)
- [ ] `src/components/wins/WinCard.test.jsx` — covers WIN-02 (edit), WIN-03 (delete)
- [ ] `src/components/wins/RollForwardPrompt.test.jsx` — covers WIN-04 (prompt rendering, confirm/dismiss callbacks)
- [ ] `src/components/wins/TotalFocusTime.test.jsx` — covers TIMER-03 (sum with live timer)
- [ ] Install: `npm install motion zustand` (no new test dependencies needed)

---

## Sources

### Primary (HIGH confidence)

- `https://motion.dev/docs/react-animate-presence` — AnimatePresence API, mode="wait", key prop requirements
- `https://motion.dev/docs/react` — motion package install (`npm install motion`), import from `motion/react`
- `https://github.com/pmndrs/zustand` — Zustand v5 create API, TypeScript double-parentheses pattern
- `https://supabase.com/docs/reference/javascript/update` — Supabase JS update/insert/delete API
- Existing project files: `supabase/migrations/001_initial_schema.sql` (confirmed wins schema with timer columns), `src/lib/supabase.js`, `package.json`

### Secondary (MEDIUM confidence)

- `https://blog.logrocket.com/creating-react-animations-with-motion/` — confirmed `import from "motion/react"` subpath; package name `motion` not `framer-motion`
- `https://dev.to/vishwark/mastering-zustand-the-modern-react-state-manager-v4-v5-guide-8mm` — Zustand v5 TypeScript API, persist middleware pattern, v4→v5 breaking changes (double parens, named exports only)
- `https://react.dev/reference/react/useOptimistic` — React 19 useOptimistic pattern for list add/delete
- `https://framermotionexamples.com/example/framer-motion-animatepresence-wait-mode` — AnimatePresence mode="wait" example (slide-out before slide-in)

### Tertiary (LOW confidence)

- General wall-clock stopwatch pattern from multiple DEV Community / ReactNativeSchool sources — cross-verified against the schema design decisions in Phase 1 (STATE.md confirms wall-clock was the chosen approach)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — motion version confirmed via npm search (12.35.x); Zustand v5 confirmed (5.0.8); both are new installs with no existing version in package.json
- Architecture: HIGH — patterns derived from confirmed library APIs and the already-existing Phase 1 schema; wall-clock timer pattern is fundamental math, not library-dependent
- Pitfalls: HIGH — AnimatePresence exit pitfalls are well-documented; timer drift is a known browser behavior; roll-forward deduplication is project-specific logic derived from schema analysis
- Validation: HIGH — Vitest already installed and configured; test patterns follow the same approach as Phase 1 tests

**Research date:** 2026-03-09
**Valid until:** 2026-06-09 (90 days — motion v12 and Zustand v5 APIs are stable; Supabase JS API is stable)
