# Phase 01: UX Revisions — Research

**Researched:** 2026-03-13
**Domain:** React component modification, Supabase schema migration, animation polish, dev tooling
**Confidence:** HIGH (codebase fully readable; all findings are from direct source inspection)

## Summary

This phase is a refactoring and feature-enhancement pass on the existing v1.0 codebase. All work is in-repo changes — no new major libraries are needed. The key areas are: removing the stopwatch feature without deleting code, adding journal categories with a Supabase migration, reworking win input wording and multi-entry UX, replacing the fire emoji streak icon with a monochrome SVG, improving the streak celebration animation to require an explicit dismiss, and adding a developer tools panel for test data seeding.

The codebase uses a well-established state machine pattern (visible/exiting useState + onAnimationEnd) for overlay animations with plain CSS @keyframes defined in `src/index.css`. This pattern must be followed for all animation changes. The streak display already has `combinedStreak` computed in `useStreak.js` and shown in `SideNav.jsx` — the bidirectional requirement is already satisfied at the data layer.

Stopwatch removal is the widest-touching change: `timer_elapsed_seconds` and `timer_started_at` columns exist on the `wins` table in Supabase (defined in `supabase/migrations/001_initial_schema.sql`); removing them requires a new migration plus commenting out code in `useWins.js`, `WinCard.jsx`, `TotalFocusTime.jsx`, `TimerFocusOverlay.jsx`, and `TodayPage.jsx`.

**Primary recommendation:** Execute the 9 sub-tasks in this order — (1) stopwatch comment-out + DB migration, (2) win wording, (3) multi-win entry, (4) journal categories DB + UI, (5) streak icon, (6) animation polish, (7) dev tools. Order matters because stopwatch columns must be removed before multi-win insert payload is simplified.

---

## Standard Stack

### Core (already installed — no new installs required)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| React | 19 | UI components | Already in use |
| motion/react | v12 | Animation (AnimatePresence, motion) | Import from `"motion/react"` NOT `"framer-motion"` |
| Zustand | v5 | UI state | `create((set) => ...)` single-call pattern |
| Supabase JS | ^2.98.0 | DB queries and schema migration | |
| Tailwind v4 | latest | Styling | `@custom-variant dark` pattern; no config darkMode key |
| Lucide React | installed | Icons | Replace fire emoji with a Lucide icon or inline SVG |

### Potentially Needed — Low Certainty

| Problem | Option | Notes |
|---------|--------|-------|
| Monochrome streak icon | Lucide `Flame` (already available) or a custom inline SVG | Lucide `Flame` is white/black with `currentColor`; renders monochrome with no emoji |
| Multi-win entry (batch input) | Extend WinInputOverlay or build MultiWinInputOverlay | No new library needed — pure React state |
| Journal category | New `category` text column + enum check constraint in Supabase | No library needed |
| Dev tools seeding | React component + direct Supabase calls | Could also be a script in `scripts/` |

**Installation:** None required. All needed libraries already installed.

---

## Architecture Patterns

### Recommended Project Structure (additions only)

```
src/
├── components/
│   ├── wins/
│   │   ├── WinInputOverlay.jsx          # modify: multi-win support
│   │   ├── WinCard.jsx                  # modify: comment out timer UI
│   │   ├── WinList.jsx                  # no change expected
│   │   ├── TimerFocusOverlay.jsx        # modify: comment out entire file usage
│   │   └── TotalFocusTime.jsx           # modify: comment out (timer-only component)
│   ├── layout/
│   │   ├── SideNav.jsx                  # modify: swap fire emoji for icon
│   │   └── StreakCelebration.jsx        # modify: animation timing + dismiss-required
│   ├── journal/
│   │   ├── JournalEditorOverlay.jsx     # modify: add category selector
│   │   └── JournalEntryCard.jsx         # modify: show category badge
│   └── dev/
│       └── DevToolsPanel.jsx            # new: seeding, mode toggle
├── hooks/
│   └── useWins.js                       # modify: remove timer fields from insert/update
├── pages/
│   └── TodayPage.jsx                    # modify: remove timer overlay wiring
└── stores/
    └── uiStore.js                       # possibly: add devModeActive flag
supabase/
└── migrations/
    ├── 001_initial_schema.sql           # existing — do not modify
    └── 002_phase01_changes.sql          # new: drop timer cols, add journal category col
```

### Pattern 1: Commenting Out (Not Deleting) the Stopwatch Feature

**What:** Wrap all timer-related JSX, hooks, and imports in `/* STOPWATCH REMOVED */` comment blocks. Do not delete files.
**When to use:** Any time the phase requirement says "comment out".
**Implementation approach:**
- In `WinCard.jsx`: comment out the `useStopwatch` import, `displaySeconds/isRunning` usage, the timer display span, and the Play/Pause/Stop button group.
- In `TodayPage.jsx`: comment out `TimerFocusOverlay` import and the `<TimerFocusOverlay ...>` JSX block. Comment out `startTimer`, `pauseTimer`, `stopTimer` destructuring from `useWins`. Comment out `timerOverlayOpen`, `openTimerOverlay`, `closeTimerOverlay` from `useUIStore`.
- In `useWins.js`: comment out `startTimer`, `pauseTimer`, `stopTimer` functions and their return values. Simplify `addWin` to not include `timer_elapsed_seconds`/`timer_started_at` in the insert payload (once migration removes those columns).
- In `TotalFocusTime.jsx`: entire component can be commented out since it only shows focus time.
- In `TimerFocusOverlay.jsx`: mark entire file as `// STOPWATCH REMOVED — kept for potential re-enable`.
- `useStopwatch.js`: keep file, just stop importing it.

### Pattern 2: Supabase Migration File

**What:** New SQL file in `supabase/migrations/` that is run manually in Supabase SQL Editor.
**Convention:** Files named `NNN_description.sql`. Existing: `001_initial_schema.sql`. New: `002_phase01_changes.sql`.
**What to include in 002:**
```sql
-- Remove stopwatch columns from wins
ALTER TABLE wins DROP COLUMN IF EXISTS timer_elapsed_seconds;
ALTER TABLE wins DROP COLUMN IF EXISTS timer_started_at;

-- Add category column to journal_entries
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'daily';
-- Optional: check constraint to enforce known values
ALTER TABLE journal_entries ADD CONSTRAINT journal_category_check
  CHECK (category IN ('daily', 'milestone', 'financial'));
```

### Pattern 3: Journal Categories — Enum via Check Constraint

**What:** A `category` text column on `journal_entries` with a CHECK constraint.
**Why not a separate table:** Tiny enum set, single-user app, overkill to normalize.
**Values:** `'daily'` (default), `'milestone'`, `'financial'`.
**UI:** Add a category selector to `JournalEditorOverlay.jsx` above the title or in the header area. Show category as a small badge on `JournalEntryCard.jsx`. Filter option on `JournalPage.jsx` is nice-to-have (Phase 3 owns per-category reporting).

### Pattern 4: Multi-Win Entry

**What:** Allow user to submit multiple wins in one overlay session without closing.
**Current:** WinInputOverlay submits one title, calls `onSubmit(title)`, overlay is closed by `TodayPage` after submit.
**New behavior options:**
- **Option A (recommended):** After submit, clear the input and keep the overlay open. Show a list of wins entered so far in the overlay. Add "Done" button or Escape to close. This matches the "What's the grind for today?" flow naturally.
- **Option B:** Add a "+" button to add another row (multi-input form). Less aligned with the existing overlay aesthetic.

Option A is preferred because it reuses the existing `onSubmit` callback contract — `TodayPage` stays the same except it no longer closes the overlay after each submit. The overlay gains internal state: `submittedTitles: string[]` to show a running list.

**Changes to `WinInputOverlay.jsx`:**
- Accept an optional `onDone` prop (called when user is finished entering all wins).
- On submit: call `onSubmit(title)`, clear input, keep overlay open, append to local `submittedTitles` list.
- Show submitted titles as a small list within the overlay (confirmation feedback).
- Close on: "Done" button click OR Escape (with a confirming dismiss).

**Changes to `TodayPage.jsx`:**
- Stop calling `closeInputOverlay()` inside the `onSubmit` handler.
- Wire `onDone` to `closeInputOverlay`.

### Pattern 5: Streak Icon — Replace Fire Emoji with Lucide Icon

**Current:** `SideNav.jsx` line 89: `{combinedStreak}🔥`
**Problem:** Fire emoji violates Nothing Phone monochrome aesthetic.
**Solution:** Use `Flame` from `lucide-react` (already a project dependency).

```jsx
// Before:
{combinedStreak}🔥

// After:
<span className="flex items-center gap-1 font-mono text-xs tabular-nums text-muted-foreground">
  <Flame size={12} strokeWidth={1.5} />
  {combinedStreak}
</span>
```

The `Flame` icon renders with `currentColor` and is naturally monochrome. Alternatively, a simple `|` bar or dot separator could be used. The Lucide `Flame` preserves the intent while fitting the aesthetic.

### Pattern 6: Streak Celebration — Require Explicit Dismiss

**Current behavior in `StreakCelebration.jsx`:**
- Auto-closes after 4 seconds via `setTimeout(onClose, 4000)`.
- Clicking anywhere calls `onClose`.
- "tap to continue" hint text already shown.

**New behavior requested:**
- Remove or significantly extend the auto-close timeout.
- Add "you're on a roll" messaging.
- Require explicit click/tap to dismiss (keep the `onClick={onClose}` on the container, which already exists).
- Possibly slow down the number ramp animation (currently 1.5s — could extend to 2.5s).

**Implementation:** Remove the `setTimeout(onClose, 4000)` effect OR increase to 30+ seconds. The overlay already supports click-to-dismiss. Add a tagline below the streak count.

### Pattern 7: Dev Tools Panel

**What:** A developer-only UI panel accessible via a keyboard shortcut or a hidden tap target.
**Capabilities requested:** Test data seeding, dev mode toggle.
**Constraints:** Should not appear in production for regular users. Single-user app so no auth check is needed — can use a localStorage flag or `import.meta.env.DEV`.

**Recommended approach:**
- Create `src/components/dev/DevToolsPanel.jsx` — a portal overlay, only rendered when `import.meta.env.DEV === true` OR a `devModeActive` flag is set in `uiStore`.
- Trigger: keyboard shortcut (e.g. `Ctrl+Shift+D`) or add a hidden tap zone in SideNav.
- Seed actions: Insert N wins for today, Insert win + check-in for yesterday (to test roll-forward), Insert journal entry for today/yesterday (to test streak), Clear today's data.
- Dev mode toggle: a Zustand boolean in `uiStore` that gates experimental UI. Not needed for this phase if no experimental features — keep as stub toggle.

**Test data seeding via Supabase direct calls:**
```jsx
// Example seed function
async function seedTodayWins(count = 3) {
  const today = getLocalDateString();
  const toInsert = Array.from({ length: count }, (_, i) => ({
    user_id: USER_ID,
    title: `Test win ${i + 1}`,
    win_date: today,
  }));
  await supabase.from('wins').insert(toInsert);
}
```

### Anti-Patterns to Avoid

- **Deleting stopwatch files:** User explicitly said to comment out, not delete — keep files for potential re-enable.
- **Using a separate enum table for journal categories:** Overkill for a 3-value enum in a single-user app.
- **Replacing the overlay animation system with motion/react for StreakCelebration:** The existing CSS @keyframes pattern (`overlay-enter`/`overlay-exit` classes) is the established pattern for full-screen overlays. StreakCelebration already uses it. Stick with it.
- **Auto-seeding in production:** Gate dev tools behind `import.meta.env.DEV` or a runtime flag.
- **Changing `onSubmit` signature in WinInputOverlay:** TodayPage and tests depend on `onSubmit(title: string)`. Only add `onDone` as a new prop.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Monochrome icon | Custom SVG flame | Lucide `Flame` (already installed) | Already tree-shaken, consistent stroke style |
| Overlay animation | motion/react AnimatePresence for full-screen overlays | Plain CSS @keyframes in index.css | Established project pattern; tw-animate-css conflicts documented in MEMORY.md |
| Category data | Separate table + joins | Text column + CHECK constraint | Single-user, 3 values, no reporting needed until Phase 3 |
| Multi-win list in overlay | Complex state machine | Simple `useState([])` array of submitted titles | No persistence needed in-overlay |

**Key insight:** This is a refactoring phase. Most of the "don't build" discipline here is about not over-engineering simple changes — a 3-value enum doesn't need a table, a dismiss-required modal doesn't need a new animation library.

---

## Common Pitfalls

### Pitfall 1: Stopwatch Column Still Referenced After Migration

**What goes wrong:** After running the DB migration to drop `timer_elapsed_seconds` and `timer_started_at`, Supabase `.select('*')` will no longer return those columns. Any code that still references `win.timer_elapsed_seconds` or `win.timer_started_at` will get `undefined` (not an error), which can cause subtle bugs in `useStopwatch` calls if they're not fully commented out.
**Why it happens:** The SELECT `*` silently drops columns; no error is thrown.
**How to avoid:** Comment out ALL timer references in JS before running the migration. Verify with a local grep.
**Warning signs:** `undefined` timers in WinCard not throwing but rendering "00:00" or NaN.

### Pitfall 2: Multi-Win Overlay — `onSubmit` Still Wired to Close

**What goes wrong:** TodayPage currently calls `closeInputOverlay()` inside the `onSubmit` handler. If `WinInputOverlay` is modified for multi-win but TodayPage still closes the overlay on each submit, the UX breaks.
**How to avoid:** Move close responsibility to `onDone` prop. Keep `onSubmit` as a pure "add this win" callback.

### Pitfall 3: Journal Category Migration — Existing Rows

**What goes wrong:** Adding `NOT NULL DEFAULT 'daily'` to an existing column should work fine in Postgres via `ALTER TABLE ... ADD COLUMN`. If you forget `DEFAULT`, the migration fails because existing rows have no value.
**How to avoid:** Always include `DEFAULT 'daily'` in the ADD COLUMN statement. Verified approach: `ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'daily'`.

### Pitfall 4: `useJournal` Insert Payload

**What goes wrong:** After adding `category` to the DB, `addEntry` in `useJournal.js` needs to accept and pass `category` in the insert payload. If forgotten, new entries will get `DEFAULT 'daily'` but the UI won't show the user-selected value immediately (stale optimistic state).
**How to avoid:** Update `addEntry({ title, body, category })` signature and pass `category` to Supabase insert. Update `JournalEditorOverlay` to pass `category` in the `onSave` payload.

### Pitfall 5: StreakCelebration Auto-Close Removal

**What goes wrong:** Removing the 4-second auto-close requires removing the `useEffect` with `setTimeout(onClose, 4000)`. If the effect cleanup isn't removed too, stale closures can still fire `onClose` after re-renders.
**How to avoid:** Remove the entire `useEffect` block (lines 36–40 in current `StreakCelebration.jsx`), not just the timeout value.

### Pitfall 6: Streak Icon in SideNav — `Flame` Import

**What goes wrong:** Importing `Flame` from `lucide-react` when `lucide-react` version in use might not have it.
**How to avoid:** Lucide React has included `Flame` since early versions; confirmed present. Import: `import { Flame } from 'lucide-react'` in SideNav.jsx.

### Pitfall 7: `rollForward` Payload After Timer Column Removal

**What goes wrong:** `rollForward()` in `useWins.js` currently inserts `timer_elapsed_seconds: 0, timer_started_at: null` in the `toInsert` array. After the migration removes those columns, passing them to Supabase will either throw or be silently ignored.
**How to avoid:** Comment out those fields from the `toInsert` mapping at the same time as the timer removal.

---

## Code Examples

### Commenting Out Timer in WinCard (pattern for all timer comment-outs)

```jsx
// STOPWATCH REMOVED — keep file, comment out timer UI
// import { useStopwatch, formatElapsed } from '@/hooks/useStopwatch';
// const { displaySeconds, isRunning } = useStopwatch({ ... });

export default function WinCard({ win, onEdit, onDelete /*, onStartTimer, onPauseTimer, onStopTimer */ }) {
  // timer state removed
  return (
    <div className="py-6 border-b font-mono group">
      <div className="flex items-start justify-between gap-4">
        {/* title + edit inline — unchanged */}
      </div>
      {/* STOPWATCH REMOVED: timer display and controls were here */}
    </div>
  );
}
```

### Multi-Win Overlay State Pattern

```jsx
// In WinInputOverlay.jsx
const [submittedTitles, setSubmittedTitles] = useState([]);

// On form submit (keep overlay open):
function handleSubmit(e) {
  e.preventDefault();
  const title = new FormData(e.target).get('title');
  if (title?.trim()) {
    onSubmit(title.trim());                        // add win to DB
    setSubmittedTitles(prev => [...prev, title.trim()]); // show in-overlay
    e.target.reset();
    inputRef.current?.focus();                    // stay focused for next entry
  }
}

// Done button:
<button type="button" onClick={onDone}>Done</button>

// Submitted list:
{submittedTitles.length > 0 && (
  <ul className="mt-6 flex flex-col gap-1">
    {submittedTitles.map((t, i) => (
      <li key={i} className="font-mono text-sm text-muted-foreground/60">+ {t}</li>
    ))}
  </ul>
)}
```

### Journal Category Selector (in JournalEditorOverlay)

```jsx
const CATEGORIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'financial', label: 'Financial' },
];

const [category, setCategory] = useState(initialCategory ?? 'daily');

// In form header or below title:
<div className="flex gap-3 mb-4">
  {CATEGORIES.map(c => (
    <button
      key={c.value}
      type="button"
      onClick={() => setCategory(c.value)}
      className={`font-mono text-xs uppercase tracking-[0.2em] px-2 py-1 border
        ${category === c.value ? 'border-foreground text-foreground' : 'border-border text-muted-foreground'}`}
    >
      {c.label}
    </button>
  ))}
</div>

// Pass to onSave:
await onSave({ title, body, category });
```

### Streak Celebration — Remove Auto-Close, Add Tagline

```jsx
// Remove this entire block:
// useEffect(() => {
//   if (!open) return;
//   const t = setTimeout(onClose, 4000);
//   return () => clearTimeout(t);
// }, [open, onClose]);

// Add tagline below streak count:
<span className="font-mono text-sm uppercase tracking-[0.2em] text-muted-foreground mt-2">
  You're on a roll
</span>
```

### Dev Tools Panel Skeleton

```jsx
// src/components/dev/DevToolsPanel.jsx
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { USER_ID } from '@/lib/env';
import { getLocalDateString } from '@/lib/utils/date';

export default function DevToolsPanel({ open, onClose }) {
  if (!open) return null;

  async function seedWins(count = 3) {
    const today = getLocalDateString();
    await supabase.from('wins').insert(
      Array.from({ length: count }, (_, i) => ({
        user_id: USER_ID,
        title: `Dev win ${i + 1}`,
        win_date: today,
      }))
    );
    onClose();
    window.location.reload();
  }

  async function clearToday() {
    const today = getLocalDateString();
    await supabase.from('wins').delete().eq('win_date', today).eq('user_id', USER_ID);
    onClose();
    window.location.reload();
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-background/90 flex items-center justify-center">
      <div className="border border-border p-8 flex flex-col gap-4 font-mono text-sm min-w-[300px]">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Dev Tools</p>
        <button onClick={() => seedWins(3)}>Seed 3 wins today</button>
        <button onClick={clearToday}>Clear today's wins</button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>,
    document.body
  );
}
```

---

## State of the Art

| Old Pattern | Current Approach | Notes |
|-------------|-----------------|-------|
| `framer-motion` import | `import { motion } from 'motion/react'` | Rebranded at v12 |
| `create()(fn)` double-parens | `create((set) => ...)` | v5: double-parens only with middleware |
| `darkMode: 'class'` in tailwind.config | `@custom-variant dark` in CSS | Tailwind v4 approach |
| `react-router-dom` | `react-router` | v7 consolidated package |

**Deprecated in this phase:**
- `timer_elapsed_seconds` column: removed by migration 002
- `timer_started_at` column: removed by migration 002
- Fire emoji in streak display: replaced with Lucide `Flame` icon

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + @testing-library/react 16 |
| Config file | `vitest.config.js` (project root) |
| Quick run command | `bun run vitest run --reporter=verbose` |
| Full suite command | `bun run vitest run` |

Note: No `test` script in `package.json`. Run vitest directly via bun or mise.

### Phase Requirements to Test Map

| Area | Behavior | Test Type | Automated Command |
|------|----------|-----------|-------------------|
| WinInputOverlay multi-win | Submit keeps overlay open, shows submitted list, Done closes | unit | `bun run vitest run src/components/wins/WinInputOverlay.test.jsx` |
| WinInputOverlay multi-win | onDone called when Done button clicked | unit | same |
| Journal categories | JournalEditorOverlay renders category selector | unit | `bun run vitest run src/components/journal/JournalEditorOverlay.test.jsx` |
| Journal categories | onSave called with category field | unit | same |
| StreakCelebration | Auto-close removed — no timeout fires | unit | `bun run vitest run src/components/layout/StreakCelebration.test.jsx` |
| StreakCelebration | onClick calls onClose | unit | same |
| SideNav streak icon | Renders Flame icon not fire emoji | unit | `bun run vitest run src/components/layout/SideNav.test.jsx` |
| WinCard | No timer display rendered after removal | unit | `bun run vitest run src/components/wins/WinCard.test.jsx` |
| Dev tools | DevToolsPanel renders when open=true | unit | `bun run vitest run src/components/dev/DevToolsPanel.test.jsx` (Wave 0 gap) |

### Sampling Rate

- **Per task commit:** `bun run vitest run` (full suite — small test count, fast)
- **Per wave merge:** `bun run vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/components/dev/DevToolsPanel.test.jsx` — covers dev tools open/close/render
- [ ] Update `src/components/wins/WinInputOverlay.test.jsx` — new multi-win behavior tests
- [ ] Update `src/components/journal/JournalEditorOverlay.test.jsx` — category selector tests
- [ ] Update `src/components/layout/StreakCelebration.test.jsx` — no-auto-close, "you're on a roll" text
- [ ] Update `src/components/wins/WinCard.test.jsx` — assert timer controls no longer rendered

*(Existing test files need modification, not new files, for most of these — except DevToolsPanel)*

---

## Open Questions

1. **Win wording change — what exact wording?**
   - What we know: "Log a win" doesn't fit; user logs intentions/goals. Current prompt text is "What's the grind for today?" / "I will..." placeholder.
   - What's unclear: The new button label for the "Log a win" button in TodayPage (`aria-label="Log a win"`, visible button text "Log a win"). And the `WinInputOverlay` prompt text and placeholder.
   - Recommendation: Use "Add intention" or "Set intention" as button label; keep "What's the grind for today?" as prompt (already set in Phase 3). Or use "Plan your day" / "Add a focus". Planner should pick one and document it as a locked decision.

2. **Streak display "bidirectionally" — is the combined streak already sufficient?**
   - What we know: `combinedStreak` is already computed (requires BOTH journal + wins per day) and displayed in `SideNav.jsx`. The phase description says "show bidirectionally (both journal logged AND wins completed)."
   - What's unclear: Does the user want to see SEPARATE journal and win streak counts, or just the combined? Current display: one number with fire emoji.
   - Recommendation: Keep combined streak as-is (already bidirectional). If separate display is wanted, `useStreak` already returns `streak`, `journalStreak`, and `combinedStreak` — SideNav could show two numbers. Planner should clarify.

3. **Dev tools — scope of seeding**
   - What we know: User wants "test data seeding, dev mode toggle, anything that improves testing experience."
   - What's unclear: Should seeding create check-in records too (to test streak)? Should it create yesterday's data for roll-forward testing?
   - Recommendation: Implement a set of seed presets: (a) seed today's wins, (b) seed yesterday's wins + check-ins (streak test), (c) seed today's journal entry, (d) clear today. This covers the main test scenarios.

4. **Multi-win overlay — "done" trigger**
   - Recommendation: Escape key = Done (already wired for close). Could also add a visible "Done" button. Confirm with planner.

---

## Sources

### Primary (HIGH confidence — direct source inspection)

All findings are from direct reading of the codebase files listed below. No external library research was needed since the phase is pure in-repo modification.

- `/Users/justin/Repositories/Personal/wintrack/src/components/wins/TimerFocusOverlay.jsx` — stopwatch feature scope
- `/Users/justin/Repositories/Personal/wintrack/src/components/wins/WinCard.jsx` — timer display in card
- `/Users/justin/Repositories/Personal/wintrack/src/components/wins/WinInputOverlay.jsx` — current single-win overlay pattern
- `/Users/justin/Repositories/Personal/wintrack/src/components/wins/TotalFocusTime.jsx` — timer-only component
- `/Users/justin/Repositories/Personal/wintrack/src/components/layout/SideNav.jsx` — streak display with fire emoji
- `/Users/justin/Repositories/Personal/wintrack/src/components/layout/StreakCelebration.jsx` — current animation + auto-close
- `/Users/justin/Repositories/Personal/wintrack/src/components/journal/JournalEditorOverlay.jsx` — journal form pattern
- `/Users/justin/Repositories/Personal/wintrack/src/hooks/useWins.js` — addWin, rollForward, timer hooks
- `/Users/justin/Repositories/Personal/wintrack/src/hooks/useJournal.js` — addEntry pattern
- `/Users/justin/Repositories/Personal/wintrack/src/hooks/useStreak.js` — combinedStreak already computed
- `/Users/justin/Repositories/Personal/wintrack/src/stores/uiStore.js` — Zustand store pattern
- `/Users/justin/Repositories/Personal/wintrack/src/pages/TodayPage.jsx` — full page wiring
- `/Users/justin/Repositories/Personal/wintrack/src/index.css` — CSS @keyframes animation pattern
- `/Users/justin/Repositories/Personal/wintrack/supabase/migrations/001_initial_schema.sql` — current schema
- `/Users/justin/Repositories/Personal/wintrack/.planning/STATE.md` — project decisions and history

---

## Metadata

**Confidence breakdown:**
- Stopwatch removal scope: HIGH — all affected files identified by direct inspection
- Journal categories: HIGH — Supabase pattern matches existing migration style
- Multi-win entry: HIGH — React state pattern straightforward; no new libraries
- Streak icon: HIGH — Lucide Flame confirmed available; pattern clear
- Animation polish: HIGH — existing pattern fully understood from StreakCelebration source
- Dev tools: MEDIUM — scope is somewhat open-ended; seeding specifics TBD

**Research date:** 2026-03-13
**Valid until:** 2026-06-13 (stable codebase; no external dependency changes)
