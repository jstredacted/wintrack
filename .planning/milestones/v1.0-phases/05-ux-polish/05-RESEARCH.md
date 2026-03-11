# Phase 5: UX Polish - Research

**Researched:** 2026-03-10
**Domain:** React component polish, CSS animation, layout composition, streak data extension
**Confidence:** HIGH

## Summary

Phase 5 is a purely presentational polish pass across four surfaces. No new Supabase schema is involved — all data access patterns already exist. The work is component-level: animation state machines, CSS keyframes, responsive layout tokens, and one hook extension (journal streak). Every technique needed is already demonstrated in the codebase; Phase 5 extends and applies those patterns more broadly.

The most consequential decisions are: (1) the Timer focus overlay reuses the WinInputOverlay state-machine pattern verbatim with `createPortal`, (2) the Journal editor is a new full-screen overlay component using the same CSS keyframe slide-up approach already in `index.css`, and (3) the day-strip is a pure component swap — Heatmap.jsx → DayStrip.jsx in HistoryPage.jsx. The journal streak requires extending `useStreak` to query `journal_entries` and return a second counter alongside the existing `streak` value.

The biggest pitfall in this phase is the known animation conflict: motion v12 `translate` property vs `@keyframes` `transform: translate3d()`. The project has already solved this by using plain CSS `@keyframes` directly in `index.css` for all overlay animations. Any new overlay animation MUST follow the same pattern — NOT motion's built-in `y` prop for full-screen overlays.

**Primary recommendation:** Copy the WinInputOverlay/CheckInOverlay visible/exiting/onAnimationEnd state-machine pattern for all new overlays. Use `@keyframes` in `index.css` for slide animations. Extend `useStreak` in-place to also return `journalStreak`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Global Layout
- `max-w-[600px]` centered layout container (locked)
- `clamp()`-based fluid monospace sizing across all text elements (locked)
- All Lucide icons sized to `size={18}` for visual consistency (locked)
- WinCard list items: borderless — remove card borders (locked)

#### Timer — Full-Screen Focus Overlay
- Full-screen overlay via `createPortal` to `document.body`, same pattern as WinInputOverlay (locked)
- Bento grid layout for parallel timers, max 3 visible simultaneously (locked)
- Count-up animation on TotalFocusTime stat when timer overlay closes (locked)

#### Journal — Full-Screen Slide-Up Editor
- Full-screen slide-up editor replaces inline JournalEntryForm (locked)
- Live word count shown while writing, updates in real time (locked)
- Completion summary screen after saving: word count + time written as chips before returning to list (locked)
- Slide-up enter / slide-down dismiss animation (locked)

#### History — Day-Strip Navigation
- Remove 80-cell GitHub-style heatmap (locked)
- Replace with horizontally scrollable day strip (locked)
- Each day cell: day abbreviation (Mon/Tue/etc.) + date number + checkmark if completed (locked)
- Time-of-day greeting header ("Good morning" / "Good afternoon" / "Good evening") above history content (locked)

#### Streak — Dual Stats in Header
- Replace single streak number with two stats side by side (locked)
- Wins streak: consecutive days with ≥1 completed check-in (locked)
- Journal streak: consecutive days with ≥1 journal entry (locked)

### Claude's Discretion
- Exact CSS for clamp() fluid typography values
- Bento grid column/row structure details
- Count-up animation implementation (CSS or requestAnimationFrame)
- Day-strip scrollbar styling and scroll snap behavior
- Exact chip component styling for completion summary screen
- Greeting time cutoffs (e.g., morning < 12pm, afternoon < 6pm, evening ≥ 6pm)
- How journal streak is exposed from useJournal hook (new return value vs. new hook)
- Test strategy for animation and overlay components

### Deferred Ideas (OUT OF SCOPE)
- Actual Web Push / service worker delivery (already deferred to v2)
- Any new data model changes — all polish is purely presentational
- More than 3 parallel timers in bento grid
</user_constraints>

---

## Standard Stack

All required libraries are already installed. No new dependencies needed.

### Core (already in project)
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| React 19 | ^19.2.0 | Component rendering | `createPortal` from `react-dom` |
| motion | ^12.35.2 | AnimatePresence for list transitions | Import from `"motion/react"` NOT `"framer-motion"` |
| Tailwind v4 | ^4.2.1 | Layout, spacing, typography | CSS-first config; `@theme inline` for custom tokens |
| Lucide React | ^0.577.0 | Icons | `size={18}` everywhere (locked) |
| Zustand v5 | ^5.0.11 | UI state (overlay open/close) | `create((set) => ...)` pattern — no double-parens without middleware |

### No New Installs Required

All animation, layout, and data needs are met by the existing stack. The only new code is:
- New CSS `@keyframes` in `index.css` (journal slide-up)
- New CSS custom properties for `clamp()` typography in `index.css`
- New/modified components and hooks

---

## Architecture Patterns

### Existing Pattern to Replicate: createPortal Overlay State Machine

Used in both `WinInputOverlay.jsx` and `CheckInOverlay.jsx`. MUST be used for all new overlays.

```jsx
// Source: src/components/wins/WinInputOverlay.jsx (verified in codebase)
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

if (!visible) return null;

return createPortal(
  <div
    role="dialog"
    aria-modal="true"
    className={`fixed inset-0 z-50 ... ${exiting ? 'overlay-exit' : 'overlay-enter'}`}
    onAnimationEnd={() => { if (exiting) setVisible(false); }}
  >
    {/* content */}
  </div>,
  document.body
);
```

The Timer focus overlay and Journal editor overlay BOTH follow this pattern exactly.

### Existing CSS Animation Pattern

```css
/* Source: src/index.css (verified in codebase) */
@keyframes overlay-slide-in {
  from { transform: translateY(100vh); }
  to   { transform: translateY(0); }
}
@keyframes overlay-slide-out {
  from { transform: translateY(0); }
  to   { transform: translateY(100vh); }
}
.overlay-enter {
  animation: overlay-slide-in 0.3s cubic-bezier(0.32, 0.72, 0, 1) both;
}
.overlay-exit {
  animation: overlay-slide-out 0.3s cubic-bezier(0.32, 0.72, 0, 1) both;
}
```

The Journal editor slide-up uses either these same classes, or adds journal-specific variants (e.g., `journal-overlay-enter` / `journal-overlay-exit`) to index.css if different easing is desired.

### Pattern: Fluid Typography with clamp()

Tailwind v4 uses CSS custom properties in `@theme inline`. To apply fluid sizing globally, add custom properties to the `@theme inline` block and use them on text elements. The `font-mono` class already resolves to Geist Mono Variable via `--font-mono` in `@theme inline`.

Recommended approach — add a CSS custom property for the clamp value and use it inline or via a Tailwind utility:

```css
/* In @theme inline block in index.css */
--font-size-fluid-base: clamp(0.8125rem, 0.75rem + 0.25vw, 0.9375rem);
--font-size-fluid-sm: clamp(0.6875rem, 0.625rem + 0.25vw, 0.8125rem);
```

Or, apply `clamp()` directly as a Tailwind arbitrary value: `text-[clamp(0.8rem,_0.75rem_+_0.25vw,_0.95rem)]`. The underscore-for-space convention in Tailwind v4 arbitrary values still applies.

### Pattern: requestAnimationFrame Count-Up

For the TotalFocusTime count-up animation when the timer overlay closes:

```jsx
// Recommended pattern (Claude's discretion — requestAnimationFrame)
// Source: common browser API, no library needed
function useCountUp(target, duration = 600) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);

  useEffect(() => {
    if (prev.current === target) return;
    const start = prev.current;
    const delta = target - start;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(Math.round(start + delta * progress));
      if (progress < 1) requestAnimationFrame(tick);
      else prev.current = target;
    }
    requestAnimationFrame(tick);
  }, [target, duration]);

  return display;
}
```

This avoids any new library dependency and runs on native browser APIs.

### Pattern: Bento Grid for Parallel Timers

CSS Grid bento layout for max 3 items:

```css
/* 1 timer: full width. 2 timers: two columns. 3 timers: 2+1 or 1+2 asymmetric. */
/* Recommended: let auto-placement handle it */
.bento-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}
```

For exactly 3 items with a 2+1 asymmetric layout (Claude's discretion):
- Item 1 spans 2 columns when count=3
- Items 2+3 each span 1 column

### Pattern: Horizontal Day Strip with Scroll Snap

```jsx
// Day strip: overflow-x-auto, snap scrolling, flex row
<div className="flex overflow-x-auto gap-2 pb-2 snap-x snap-mandatory scroll-smooth">
  {days.map(({ date, label, dayAbbr, completed }) => (
    <button
      key={date}
      className="snap-start shrink-0 flex flex-col items-center gap-1 p-2 min-w-[3rem] ..."
      onClick={() => onSelectDate?.(date)}
    >
      <span className="text-xs font-mono text-muted-foreground">{dayAbbr}</span>
      <span className="text-sm font-mono">{label}</span>
      {completed && <Check size={12} />}
    </button>
  ))}
</div>
```

Day abbreviation via: `new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(dateObj)` → "Mon", "Tue", etc. Date number via: `dateObj.getDate()`.

Scrollbar hiding in Tailwind v4: `[&::-webkit-scrollbar]:hidden` or CSS `scrollbar-width: none; -ms-overflow-style: none;` via `@layer base`.

### Pattern: Journal Streak in useStreak Hook

The context notes the dual-streak requirement: wins streak already exists; journal streak needs to be added. The cleanest approach (Claude's discretion: "new return value vs. new hook") is to **extend `useStreak` in-place**:

```js
// Extend useStreak to also query journal_entries
// Returns { streak, journalStreak, loading }
// Wins streak: consecutive days with ≥1 completed check_in
// Journal streak: consecutive days with ≥1 journal_entry (by created_at date)
```

This avoids an extra hook import in Header.jsx and keeps streak logic co-located.

The journal_entries table has a `created_at` timestamp. To get the local date from it: `getLocalDateString(new Date(entry.created_at))`.

```js
// Additional query in useStreak
const { data: journalData } = await supabase
  .from('journal_entries')
  .select('created_at')
  .eq('user_id', USER_ID);

const journalDates = new Set(
  (journalData ?? []).map(row => getLocalDateString(new Date(row.created_at)))
);

// Count consecutive days backward from today
let jCount = 0;
let jCursor = new Date();
while (journalDates.has(getLocalDateString(jCursor))) {
  jCount++;
  jCursor = new Date(jCursor.getTime() - 86400000);
}
setJournalStreak(jCount);
```

### Pattern: Time-of-Day Greeting

```js
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
```

Cutoffs (Claude's discretion): morning < 12, afternoon < 18, evening >= 18.

### Pattern: Word Count

```js
function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}
```

Live update in textarea `onChange` handler. For the completion summary chip, capture word count at save time and pass it as a prop to the summary screen state.

### Recommended Project Structure (additions only)

```
src/
├── components/
│   ├── wins/
│   │   ├── TimerFocusOverlay.jsx    # NEW — createPortal full-screen timer overlay
│   │   └── WinCard.jsx              # MODIFY — remove border, icon size 18
│   ├── journal/
│   │   ├── JournalEditorOverlay.jsx # NEW — full-screen slide-up editor
│   │   └── JournalEntryForm.jsx     # REMOVE or keep as internal fallback
│   ├── history/
│   │   ├── DayStrip.jsx             # NEW — replaces Heatmap.jsx
│   │   └── Heatmap.jsx              # REMOVE or keep for reference
│   └── layout/
│       └── Header.jsx               # MODIFY — dual streak display
├── hooks/
│   └── useStreak.js                 # MODIFY — add journalStreak return value
└── index.css                        # MODIFY — clamp() tokens, journal keyframes
```

### Anti-Patterns to Avoid

- **Using motion `y` prop for full-screen overlay slides:** motion v12 uses CSS `translate` property which conflicts with `@keyframes transform: translateY()`. All overlay slides MUST use the CSS class state-machine pattern.
- **Importing from `framer-motion`:** Package was renamed to `motion` at v12. Always `import { ... } from 'motion/react'`.
- **`setInterval` for the count-up animation:** Project convention is wall-clock timestamps; use `requestAnimationFrame` instead.
- **`darkMode: 'class'` in tailwind config:** Tailwind v4 uses `@custom-variant dark` in CSS. No config file change needed.
- **Double-parens Zustand `create()(fn)`:** Only needed with middleware. The `uiStore.js` uses `create((set) => ...)` pattern — extend it consistently.
- **Using `AnimatePresence` without checking test behavior:** `AnimatePresence` with `mode="wait"` blocks exit animations in jsdom. Existing tests omit `mode` — follow that precedent.
- **`toISOString().slice(0,10)` for date strings:** Always use `getLocalDateString()` from `@/lib/utils/date`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Portal rendering | Custom full-screen div injection | `createPortal(jsx, document.body)` from `react-dom` | Already established in WinInputOverlay and CheckInOverlay |
| List enter/exit animations | CSS transitions per element | `AnimatePresence` + `motion.div` from `motion/react` | Already established in WinList, JournalPage |
| Scroll snap | Custom JS scroll event handling | CSS `scroll-snap-type: x mandatory` + `snap-start` on items | Native browser feature, zero JS needed |
| Icon library | Custom SVG icons | Lucide React | Already installed, consistent design language |
| Streak date math | Custom date arithmetic | `getLocalDateString()` + `Date` arithmetic pattern from `useStreak.js` | Established pattern, timezone-safe |
| Word splitting | Custom tokenizer | `str.trim().split(/\s+/)` | Sufficient for display-only word count |

---

## Common Pitfalls

### Pitfall 1: Animation Conflict (motion translate vs CSS transform)
**What goes wrong:** Adding `initial={{ y: '100%' }} animate={{ y: 0 }}` to a full-screen overlay div causes only opacity to animate; the translate is ignored or conflicts with `@keyframes`.
**Why it happens:** motion v12 writes to the CSS `translate` property individually; the existing `@keyframes overlay-slide-in` uses `transform: translateY()`. They address different CSS properties and don't compose.
**How to avoid:** Use the CSS class state-machine: `className={exiting ? 'overlay-exit' : 'overlay-enter'}` with `onAnimationEnd` unmount, exactly as WinInputOverlay does. Do NOT use motion's `y` prop for overlay slides.
**Warning signs:** Overlay appears at final position immediately with no slide-in visible.

### Pitfall 2: AnimatePresence in jsdom Blocking on Exit
**What goes wrong:** Tests that trigger a transition hang or timeout.
**Why it happens:** jsdom doesn't fire `animationend` events, so exit animations never resolve.
**How to avoid:** Do NOT pass `mode="wait"` to `AnimatePresence` in any component. Omitting `mode` allows step transitions in tests without behavior change in browser. This precedent is set in CheckInOverlay.jsx.
**Warning signs:** Test times out waiting for a component to unmount.

### Pitfall 3: Journal Streak Counting Errors — Multiple Entries Per Day
**What goes wrong:** Journal streak counts days incorrectly if a user has multiple journal entries on one day.
**Why it happens:** Naive `data.length` check or date array without deduplication.
**How to avoid:** Build a `Set<string>` of distinct dates from `created_at` — same pattern as wins streak's `completedDates` Set.
**Warning signs:** Streak counter higher than days elapsed.

### Pitfall 4: Greeting Updates Stale After Midnight
**What goes wrong:** `new Date().getHours()` is called once at component mount and doesn't update if the user leaves the tab open across midnight.
**Why it happens:** No reactive re-render trigger.
**How to avoid:** For a pure polish phase, calling `getHours()` at render time (not in a `useEffect`) is acceptable — each page navigation or refresh will re-compute. A `setTimeout` to refresh at midnight is out of scope; the risk is low.

### Pitfall 5: clamp() Values Breaking Tailwind Arbitrary Syntax
**What goes wrong:** `text-[clamp(0.8rem,_0.75rem_+_0.25vw,_0.95rem)]` doesn't generate the expected CSS.
**Why it happens:** Tailwind v4 arbitrary value syntax requires underscores for spaces — `+` and `,` are valid, but spaces break the bracket parsing.
**How to avoid:** Either (a) use underscores for all spaces in the arbitrary value, or (b) define the clamp value as a CSS custom property in `@theme inline` and use `text-[var(--font-size-fluid-base)]`. Option (b) is cleaner and easier to adjust globally.

### Pitfall 6: Scrollbar in Day Strip Visible on Desktop
**What goes wrong:** The horizontal scrollbar appears on desktop browsers, breaking the minimal aesthetic.
**How to avoid:** Hide scrollbar via CSS:
```css
.day-strip::-webkit-scrollbar { display: none; }
.day-strip { -ms-overflow-style: none; scrollbar-width: none; }
```
Or as a Tailwind v4 utility class in `@layer utilities`.

---

## Code Examples

### State-Machine Overlay (Timer Focus Overlay)
```jsx
// Pattern source: src/components/wins/WinInputOverlay.jsx
// Apply identically for TimerFocusOverlay
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';

export default function TimerFocusOverlay({ open, wins, onClose }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (open) { setVisible(true); setExiting(false); }
    else if (visible) { setExiting(true); }
  }, [open]);

  if (!visible) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Focus timer"
      className={`fixed inset-0 z-50 bg-background ${exiting ? 'overlay-exit' : 'overlay-enter'}`}
      onAnimationEnd={() => { if (exiting) setVisible(false); }}
    >
      {/* bento grid content */}
    </div>,
    document.body
  );
}
```

### Journal Slide-Up Keyframes (add to index.css)
```css
/* Journal editor — slide up from bottom */
@keyframes journal-slide-in {
  from { transform: translateY(100vh); }
  to   { transform: translateY(0); }
}
@keyframes journal-slide-out {
  from { transform: translateY(0); }
  to   { transform: translateY(100vh); }
}
.journal-overlay-enter {
  animation: journal-slide-in 0.35s cubic-bezier(0.32, 0.72, 0, 1) both;
}
.journal-overlay-exit {
  animation: journal-slide-out 0.3s cubic-bezier(0.32, 0.72, 0, 1) both;
}
```

Note: Functionally identical to `.overlay-enter/.overlay-exit` — could reuse those classes. Separate names allow future easing differentiation without side effects.

### Dual Streak Header
```jsx
// Pattern source: src/components/layout/Header.jsx
// Modified to show wins streak + journal streak
const { streak, journalStreak } = useStreak();

<div className="flex items-center gap-4 font-mono text-xs text-muted-foreground tabular-nums">
  <span title="Wins streak">{streak}W</span>
  <span title="Journal streak">{journalStreak}J</span>
</div>
```

The exact labeling (W/J vs icons vs words) is Claude's discretion — keep it compact for the sticky header.

### DayStrip Cell
```jsx
// Day abbreviation via Intl
const dayAbbr = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(dateObj);
// → "Mon", "Tue", "Wed" etc.

const dateNum = dateObj.getDate(); // → 1..31
```

### Global max-w Container (AppShell or page-level)
```jsx
// Option A: add to AppShell main element
<main className="flex-1 overflow-y-auto pb-16">
  <div className="max-w-[600px] mx-auto">
    <Outlet />
  </div>
</main>

// Option B: add to each page's root div (matches current per-page `max-w-xl mx-auto` pattern)
// Current HistoryPage has `max-w-xl mx-auto` — standardize to `max-w-[600px] mx-auto`
```

Option A (AppShell wrapper) is recommended for guaranteed consistency — one change applies to all pages.

---

## State of the Art

| Old Approach | Current Approach | Impact for Phase 5 |
|--------------|------------------|--------------------|
| `framer-motion` package | `motion` package (v12+), import from `"motion/react"` | Already applied; don't regress |
| `transform: translate` in motion | CSS `translate` property (separate from `transform`) | Must use CSS keyframes for overlay slides |
| GitHub heatmap grid | Horizontal day-strip with scroll snap | This phase's History replacement |
| Single streak number | Dual wins + journal streak | This phase's Header change |
| Inline JournalEntryForm | Full-screen slide-up editor overlay | This phase's Journal change |

---

## Open Questions

1. **Max-w container: AppShell vs per-page**
   - What we know: Current pages use ad-hoc `max-w-xl mx-auto` at page level
   - What's unclear: Whether to centralize in AppShell or standardize per-page
   - Recommendation: AppShell wrapper is more robust; planner should default to AppShell but can go per-page if visual acceptance requires it

2. **Journal streak: extend useStreak vs expose from useJournal**
   - What we know: Context marks this as Claude's discretion
   - What's unclear: Adding a second Supabase query to useStreak vs co-locating journal streak near journal data
   - Recommendation: Extend `useStreak` in-place — Header already imports it, minimizing wiring changes. Return `{ streak, journalStreak, loading }`.

3. **TotalFocusTime count-up: trigger point**
   - What we know: Count-up should animate when the timer overlay closes
   - What's unclear: Whether to animate from 0 or from previous value
   - Recommendation: Animate from the last rendered value (not 0) — a jump from 0 looks wrong when multiple timers have been running. Store a `prevTotal` ref and animate from prev to next.

4. **Journal completion summary: separate screen vs inline**
   - What we know: "completion summary screen" with word count + time written chips before returning to list
   - Locked: chips show word count + time written
   - What's unclear: Whether this is a separate component or an internal state within JournalEditorOverlay
   - Recommendation: Internal state within JournalEditorOverlay (`'editing' | 'summary'`) — simpler wiring, consistent with CheckInOverlay's completion screen pattern.

---

## Validation Architecture

`nyquist_validation` is enabled in `.planning/config.json`. Validation is mandatory.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + @testing-library/react 16.x |
| Config file | `vitest.config.js` |
| Quick run command | `mise exec -- npm run test -- --run` |
| Full suite command | `mise exec -- npm run test -- --run` |

Note: No `test` script is in `package.json`. The planner should add `"test": "vitest"` to package.json scripts in Wave 0, or use `mise exec -- npx vitest run` directly. Current all-test invocation confirmed via codebase: `mise exec -- npx vitest run`.

### Phase Requirements → Test Map

Phase 5 has no new v1 requirement IDs (all v1 reqs are complete). The phase delivers polish against existing requirements. Test coverage targets behavioral correctness of each new/modified component.

| Area | Behavior | Test Type | Automated Command | File Exists? |
|------|----------|-----------|-------------------|-------------|
| TimerFocusOverlay | renders when open=true | unit | `mise exec -- npx vitest run src/components/wins/TimerFocusOverlay.test.jsx` | Wave 0 |
| TimerFocusOverlay | does not render when open=false | unit | same | Wave 0 |
| TimerFocusOverlay | renders up to 3 timer bento cells | unit | same | Wave 0 |
| JournalEditorOverlay | renders when open=true with role=dialog | unit | `mise exec -- npx vitest run src/components/journal/JournalEditorOverlay.test.jsx` | Wave 0 |
| JournalEditorOverlay | live word count updates as user types | unit | same | Wave 0 |
| JournalEditorOverlay | shows summary screen after save | unit | same | Wave 0 |
| JournalEditorOverlay | Escape calls onClose | unit | same | Wave 0 |
| DayStrip | renders N day cells | unit | `mise exec -- npx vitest run src/components/history/DayStrip.test.jsx` | Wave 0 |
| DayStrip | shows checkmark for completed days | unit | same | Wave 0 |
| DayStrip | calls onSelectDate when cell clicked | unit | same | Wave 0 |
| useStreak | journalStreak counts consecutive days | unit | `mise exec -- npx vitest run src/hooks/useStreak.test.js` | Exists — extend |
| WinCard | renders without border | unit | `mise exec -- npx vitest run src/components/wins/WinCard.test.jsx` | Exists — extend |
| Header | renders two streak numbers | unit | `mise exec -- npx vitest run src/components/layout/Header.test.jsx` | Wave 0 |
| Greeting | returns correct greeting by hour | unit | inline in HistoryPage or DayStrip test | Wave 0 |

### Sampling Rate
- **Per task commit:** `mise exec -- npx vitest run [specific test file]`
- **Per wave merge:** `mise exec -- npx vitest run` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/wins/TimerFocusOverlay.test.jsx` — covers timer overlay open/close/bento
- [ ] `src/components/journal/JournalEditorOverlay.test.jsx` — covers slide-up editor, word count, summary screen
- [ ] `src/components/history/DayStrip.test.jsx` — covers day cells, checkmarks, click handler
- [ ] `src/components/layout/Header.test.jsx` — covers dual streak display

Existing test files that need extended cases (not new files):
- [ ] `src/hooks/useStreak.test.js` — add `journalStreak` assertion
- [ ] `src/components/wins/WinCard.test.jsx` — add assertion that no border class is present

---

## Sources

### Primary (HIGH confidence)
- Codebase inspection — `src/components/wins/WinInputOverlay.jsx` — state-machine pattern
- Codebase inspection — `src/components/checkin/CheckInOverlay.jsx` — portal + AnimatePresence pattern
- Codebase inspection — `src/index.css` — `@keyframes overlay-slide-in/out` and `.overlay-enter/.overlay-exit`
- Codebase inspection — `src/hooks/useStreak.js` — streak query pattern with Set-based date deduplication
- Codebase inspection — `src/hooks/useJournal.js` — journal_entries schema (`created_at`, `title`, `body`)
- Codebase inspection — `package.json` — confirmed installed library versions
- Project MEMORY.md — animation conflict known pitfall (tw-animate-css + motion v12)

### Secondary (MEDIUM confidence)
- MDN CSS `scroll-snap-type` — native browser scroll snap API, no library needed
- `Intl.DateTimeFormat` weekday 'short' — produces 3-letter day abbreviations in en-US locale

### Tertiary (LOW confidence — not needed, all knowledge from codebase)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed in package.json, versions verified
- Architecture patterns: HIGH — all patterns verified from live codebase
- Pitfalls: HIGH — primary pitfall (animation conflict) documented in MEMORY.md and visible in index.css workaround
- Test strategy: HIGH — test framework and patterns confirmed from existing test files

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable dependencies, no fast-moving ecosystem changes anticipated)
