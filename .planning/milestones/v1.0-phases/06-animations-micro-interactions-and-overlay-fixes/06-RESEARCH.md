# Phase 6: Animations, Micro-interactions, and Overlay Fixes — Research (EXPANDED)

**Researched:** 2026-03-10 (expanded full-app audit)
**Domain:** CSS keyframe animations, React state-machine unmount pattern, motion/react, micro-interactions — FULL APP
**Confidence:** HIGH

## Summary

This is an expanded audit of every interactive element across the entire wintrack app. The original Phase 6 research identified five named bugs (FIX-01 through FIX-05) focused on the journal editor and timer overlay. The full audit reveals ten additional missing polish items across TodayPage, CheckInOverlay, WinCard, DayStrip, DayDetail, RollForwardPrompt, JournalEntryCard, SideNav, and StreakCelebration.

Every interactive element has been read and audited against three criteria: (1) hover feedback, (2) active/press state, (3) enter/exit animation. Most buttons already have `hover:` color transitions — the gap is uniformly in `active:` press feedback and in a few list transitions that snap without easing.

The animation system is already established and correct. No new packages are needed. The five original bugs remain unchanged. The ten new items are all one-liner Tailwind additions or minor motion additions.

**Primary recommendation:** Apply `active:scale-[0.96] transition-transform duration-75` to every primary action button and `active:opacity-70 transition-opacity duration-75` to every icon-only button. Add `AnimatePresence` enter/exit to DayDetail wins list and the HistoryPage selected-date content change. Fix StreakCelebration's broken animation class reference. Fix RollForwardPrompt's bare buttons with no hover feedback.

---

## Full App Interactive Audit

### TodayPage.jsx — action buttons

| Element | Hover | Active/Press | Notes |
|---------|-------|--------------|-------|
| "Log a win" button | `hover:text-foreground hover:border-foreground transition-colors` | **MISSING** | No `active:` class |
| "Check in" button | same as above | **MISSING** | No `active:` class |

**Fix (FIX-05 / NEW-01):** Add `active:scale-[0.96] transition-transform duration-75` to both buttons.

The existing `transition-colors` and new `transition-transform` can coexist — Tailwind generates `transition-property: color, border-color, transform` when both are present, which is correct.

---

### WinCard.jsx — edit/delete icons, timer controls

| Element | Hover | Active/Press | Notes |
|---------|-------|--------------|-------|
| Edit (Pencil) icon | `hover:text-muted-foreground transition-colors` | **MISSING** | Group-hover reveal — no press feedback |
| Delete (Trash2) icon | same | **MISSING** | Group-hover reveal — no press feedback |
| Play/Start button | `hover:text-foreground transition-colors` | **MISSING** | No press feedback |
| Pause button | same | **MISSING** | No press feedback |
| Stop (Square) button | same | **MISSING** | No press feedback |

**Fix (NEW-02):** Icon-only buttons should not scale (too small, looks broken). Use `active:opacity-70 transition-opacity duration-75` instead — subtle but tactile. Apply to all five icon buttons.

---

### WinInputOverlay.jsx — submit button

| Element | Hover | Active/Press | Notes |
|---------|-------|--------------|-------|
| Submit button | Hidden (sr-only) | **N/A** | Keyboard-only, hidden from view |

**No fix needed.** The form submits on Enter key. The visually-hidden button exists only for form submission semantics.

---

### TimerFocusOverlay.jsx — all buttons

| Element | Hover | Active/Press | Notes |
|---------|-------|--------------|-------|
| Play/Pause (TimerStation) | `hover:text-foreground transition-colors` | **MISSING** | No press feedback |
| Stop (TimerStation) | same | **MISSING** | No press feedback |
| "Stop all" button (header) | `hover:text-foreground transition-colors` | **MISSING** | No press feedback |
| Close (X) button (header) | same | **MISSING** | No press feedback |
| "Log a win" button (empty state) | `hover:text-muted-foreground transition-colors` | **MISSING** | No press feedback |
| AddSlot button | `hover:opacity-70 transition-opacity` | **MISSING** | Has opacity hover; no active press |

**Fix (NEW-03):** All timer control icon buttons: `active:opacity-70 transition-opacity duration-75`. The "Stop all" text button: `active:scale-[0.96] transition-transform duration-75`. AddSlot: `active:opacity-50` (already uses opacity model).

---

### CheckInOverlay.jsx — Yes / No / Next / Close buttons

| Element | Hover | Active/Press | Notes |
|---------|-------|--------------|-------|
| "Yes" button | `hover:opacity-90 transition-opacity` | **MISSING** | Filled button, no press feedback |
| "No" button | `hover:text-foreground hover:border-foreground transition-colors` | **MISSING** | No press feedback |
| "Next" button (note form) | same as No | **MISSING** | No press feedback |
| "Close" button (completion screen) | same | **MISSING** | No press feedback |

**Fix (NEW-04):** All four buttons: `active:scale-[0.96] transition-transform duration-75`. These are full-width/large buttons where scale press feels intentional and tactile.

**Existing animations:** The step transitions between wins already use `AnimatePresence` with `motion.div key={step-${step}}` — this is correct and well-implemented. The completion screen fade-in (`key="complete"`) is also in place. No changes needed for step transitions.

---

### MorningPrompt.jsx — Log a win / Later buttons

| Element | Hover | Active/Press | Notes |
|---------|-------|--------------|-------|
| "Log a win" button | `hover:opacity-90 transition-opacity` | **MISSING** | Filled button |
| "Later" button | `hover:text-foreground hover:border-foreground transition-colors` | **MISSING** | Border button |

**Fix (NEW-05):** Same pattern as CheckInOverlay — `active:scale-[0.96] transition-transform duration-75` on both.

---

### EveningPrompt.jsx — Start check-in / Later buttons

| Element | Hover | Active/Press | Notes |
|---------|-------|--------------|-------|
| "Start check-in" button | `hover:opacity-90 transition-opacity` | **MISSING** | Filled button |
| "Later" button | `hover:text-foreground hover:border-foreground transition-colors` | **MISSING** | Border button |

**Fix (NEW-06):** Same — `active:scale-[0.96] transition-transform duration-75` on both.

---

### DayStrip.jsx — day cell buttons, arrow nav

| Element | Hover | Active/Press | Notes |
|---------|-------|--------------|-------|
| Day cell button | `hover:text-muted-foreground/70 transition-all` | **MISSING** | No press feedback |
| Left arrow (ChevronLeft) | `hover:text-foreground transition-colors` | **MISSING** | Nav button |
| Right arrow (ChevronRight) | same | **MISSING** | Nav button |

**Fix (NEW-07):** Day cells: `active:scale-[0.94]` (slightly more since the cells are compact tiles). Arrow buttons: `active:opacity-70 transition-opacity duration-75`.

---

### DayDetail.jsx — expand/collapse note button

| Element | Hover | Active/Press | Notes |
|---------|-------|--------------|-------|
| ChevronUp/Down expand button | `hover:text-foreground transition-colors` | **MISSING** | No press feedback |
| Note expand/collapse content | Snap toggle | **MISSING** | No animation on expand/collapse |

**Fix (NEW-08):** Button: `active:opacity-70 transition-opacity duration-75`. The note expand/collapse is a boolean toggle — it snaps in/out with no animation. This can be improved: wrap the note `<p>` in a `motion.div` with `initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}` inside an `AnimatePresence`. This requires the `height: 'auto'` animation pattern from motion/react (confirmed working in motion v12 via layout animation).

---

### HistoryPage.jsx — selected-date content change

| Element | Hover | Active/Press | Notes |
|---------|-------|--------------|-------|
| Date selection (via DayStrip) → DayDetail update | **SNAPS** | N/A | `selectedDate` state changes, DayDetail re-renders with no transition |

**Fix (NEW-09):** Wrap `<DayDetail>` in an `AnimatePresence` keyed by `selectedDate`. When the user taps a new day, the old detail fades out and new fades in.

```jsx
<AnimatePresence mode="wait">
  <motion.div
    key={selectedDate}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
  >
    <DayDetail date={selectedDate} wins={selectedWins} loading={detailLoading} />
  </motion.div>
</AnimatePresence>
```

---

### JournalPage.jsx — "New Entry" button

| Element | Hover | Active/Press | Notes |
|---------|-------|--------------|-------|
| "New Entry" button | `hover:text-foreground transition-colors hover:border-foreground` | **MISSING** | No press feedback |
| Entry list items | AnimatePresence opacity 0→1 / out | OK | Already animated |

**Fix (NEW-10):** "New Entry" button: `active:opacity-70 transition-opacity duration-75` (it's small and text-style, scale would feel wrong).

---

### JournalEntryCard.jsx — edit/delete hover-reveal buttons

| Element | Hover | Active/Press | Notes |
|---------|-------|--------------|-------|
| Edit button (hover-reveal) | `hover:text-foreground transition-colors` | **MISSING** | Group-hover only, no press |
| Delete button (hover-reveal) | same | **MISSING** | No press feedback |

**Fix (same as WinCard icon treatment):** `active:opacity-70 transition-opacity duration-75` on both. Scale is too dramatic for small text buttons.

---

### SideNav.jsx — nav links, streak, theme toggle

| Element | Hover | Active/Press | Notes |
|---------|-------|--------------|-------|
| NavLink (Today/History/Journal) | `hover:text-foreground hover:bg-foreground/5` | **MISSING** | No press feedback on nav tap |
| ThemeToggle | Uses shadcn `Button variant="ghost"` | Has shadcn active styles | OK — shadcn ghost button has its own active state |
| Streak display span | Non-interactive | N/A | Not a button |

**Fix (NEW-11):** NavLink buttons: `active:bg-foreground/10` added to the `cn()` className. Subtle background flash on press rather than scale (nav items are squares — scale would misalign the indicator pip).

---

### RollForwardPrompt.jsx — Yes / Dismiss buttons

| Element | Hover | Active/Press | Notes |
|---------|-------|--------------|-------|
| "Yes" button | `underline` only — **no hover feedback** | **MISSING** | Completely bare button |
| "Dismiss" button | No hover, no active | **MISSING** | Completely bare button |

**Fix (NEW-12):** This component is the most bare in the app. Add:
- "Yes" button: `hover:opacity-70 active:opacity-50 transition-opacity duration-75`
- "Dismiss" button: `hover:text-foreground active:opacity-70 transition-colors duration-75`

---

### StreakCelebration.jsx — animation class bug

| Element | Issue | Severity |
|---------|-------|----------|
| Portal `div` animation | `style={{ animation: open ? 'overlay-enter 0.3s ease forwards' : undefined }}` uses `overlay-enter` as an animation name, but the CSS keyframe is named `overlay-slide-in` (the class `.overlay-enter` applies `overlay-slide-in`) | **BUG** |

The `style` prop references a keyframe name (`overlay-enter`) that does not exist as a `@keyframes` name — only as a class name. The CSS in `index.css` defines `@keyframes overlay-slide-in`, not `@keyframes overlay-enter`. This means the StreakCelebration fade-in animation is silently broken — it appears instantly with no animation.

**Fix (NEW-BUG-01):** Either:
(a) Add a named keyframe `@keyframes overlay-fade-in { from { opacity: 0; } to { opacity: 1; } }` to `index.css` and reference that, OR
(b) Add a CSS class `.celebration-enter { animation: overlay-slide-in 0.3s cubic-bezier(0.32, 0.72, 0, 1) both; }` and apply it in JSX, OR
(c) Use the existing state-machine pattern (`visible`/`exiting` + `onAnimationEnd`) consistent with all other overlays.

Option (c) is recommended for consistency. The StreakCelebration does not currently have a full exit animation either — when `open` goes false, `setVisible(false)` is never called (visible stays true forever after first show). The auto-close calls `onClose` after 4 seconds, which in `SideNav.jsx` calls `setShowCelebration(false)`, which sets `open=false` — but nothing unmounts `StreakCelebration` at that point because `visible` stays true. This is a secondary bug.

**Fix:** Refactor to full state-machine pattern:
```jsx
const [visible, setVisible] = useState(false);
const [exiting, setExiting] = useState(false);

useEffect(() => {
  if (open) { setVisible(true); setExiting(false); }
  else if (visible) { setExiting(true); }
}, [open]);
```

---

## Summary: All Fixes by Priority

### Original 5 bugs (from prior research — unchanged)

| ID | File | Issue | Fix |
|----|------|-------|-----|
| FIX-01 | TimerFocusOverlay.jsx | 4-win cap on AddSlot | Remove `< 4` guard |
| FIX-02 | TodayPage.jsx | Flash on timer overlay open | Investigate `loading` oscillation in `useWins` |
| FIX-03 | JournalEditorOverlay.jsx | Save snaps to summary | AnimatePresence screen crossfade |
| FIX-04 | index.css | Journal exit too slow | Tune easing to `0.22s cubic-bezier(0.4, 0, 1, 1)` |
| FIX-05 | JournalEditorOverlay.jsx | Save button has no saving state | `saving` boolean state + "Saving…" text + `active:scale-[0.96]` |

### New bugs found in full-app audit

| ID | File | Issue | Fix |
|----|------|-------|-----|
| NEW-BUG-01 | StreakCelebration.jsx | Animation class name broken, no exit animation | Refactor to state-machine pattern |

### New micro-interaction gaps (button press feedback)

| ID | File | Missing Feedback | Fix |
|----|------|-----------------|-----|
| NEW-01 | TodayPage.jsx | "Log a win" + "Check in" — no active state | `active:scale-[0.96] transition-transform duration-75` |
| NEW-02 | WinCard.jsx | All 5 icon buttons — no active state | `active:opacity-70 transition-opacity duration-75` |
| NEW-03 | TimerFocusOverlay.jsx | All timer controls + Stop all + AddSlot | `active:opacity-70` for icons; `active:scale-[0.96]` for Stop all; `active:opacity-50` for AddSlot |
| NEW-04 | CheckInOverlay.jsx | Yes / No / Next / Close — no active state | `active:scale-[0.96] transition-transform duration-75` |
| NEW-05 | MorningPrompt.jsx | Log a win / Later — no active state | Same |
| NEW-06 | EveningPrompt.jsx | Start check-in / Later — no active state | Same |
| NEW-07 | DayStrip.jsx | Day cells + arrow nav — no active state | `active:scale-[0.94]` for cells; `active:opacity-70` for arrows |
| NEW-08 | DayDetail.jsx | Expand note button — no active state | `active:opacity-70 transition-opacity duration-75` |
| NEW-09-btn | JournalPage.jsx | "New Entry" button — no active state | `active:opacity-70 transition-opacity duration-75` |
| NEW-10 | JournalEntryCard.jsx | Edit / Delete hover-reveal — no active state | `active:opacity-70 transition-opacity duration-75` |
| NEW-11 | SideNav.jsx | NavLink — no active press state | `active:bg-foreground/10` in `cn()` |
| NEW-12 | RollForwardPrompt.jsx | Yes / Dismiss — no hover or active | `hover:opacity-70 active:opacity-50` on Yes; `hover:text-foreground active:opacity-70` on Dismiss |

### New animation gaps (transitions/enter/exit)

| ID | File | Issue | Fix |
|----|------|-------|-----|
| NEW-09 | HistoryPage.jsx | DayDetail content snaps on date change | `AnimatePresence` keyed by `selectedDate` |
| NEW-08-anim | DayDetail.jsx | Note expand/collapse snaps | `AnimatePresence` + `motion.div` with `height: 'auto'` |

---

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| motion | ^12.35.2 | In-component animate/exit, whileTap | Installed, rebranded framer-motion |
| CSS @keyframes | native | Overlay mount/unmount transitions | Established project pattern |
| Tailwind v4 | ^4.2.1 | Utility classes including `active:scale-*`, `active:opacity-*` | Already in use |

### Do Not Add
No new packages needed for this phase.

---

## Architecture Patterns

### Pattern 1: Overlay mount/unmount (ESTABLISHED — do not change)
**What:** `visible` + `exiting` useState pair; CSS class toggling; `onAnimationEnd` to unmount
**Reference:** `src/components/wins/WinInputOverlay.jsx` (canonical example)

```jsx
// The established pattern
const [visible, setVisible] = useState(false);
const [exiting, setExiting] = useState(false);

useEffect(() => {
  if (open) { setVisible(true); setExiting(false); }
  else if (visible) { setExiting(true); }
}, [open]);

// JSX:
className={`fixed inset-0 z-50 ... ${exiting ? 'overlay-exit' : 'overlay-enter'}`}
onAnimationEnd={() => { if (exiting) setVisible(false); }}
```

### Pattern 2: In-overlay screen transitions (for JournalEditorOverlay)
**What:** `AnimatePresence` from `motion/react` wrapping screen branches inside an already-mounted overlay
**Safe:** The outer overlay div uses CSS `transform` via `@keyframes`; inner `motion.div` uses CSS `translate` — separate DOM nodes, no conflict

```jsx
import { AnimatePresence, motion } from 'motion/react';

<AnimatePresence mode="wait">
  {screen === 'editing' ? (
    <motion.div key="editing"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}>
      ...
    </motion.div>
  ) : (
    <motion.div key="summary"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}>
      ...
    </motion.div>
  )}
</AnimatePresence>
```

### Pattern 3: Button press feedback — scale (primary/large buttons)
**When to use:** Full-width or visually heavy buttons (Yes, No, Log a win, Check in, Save)

```jsx
className="... active:scale-[0.96] transition-transform duration-75"
```

### Pattern 4: Button press feedback — opacity (icon-only and small text buttons)
**When to use:** Icon buttons, hover-reveal action buttons, text links acting as buttons. Scale looks broken at small sizes.

```jsx
className="... active:opacity-70 transition-opacity duration-75"
```

### Pattern 5: List item enter/exit with keyed AnimatePresence
**When to use:** Content that changes based on a key value (selected date → new content)

```jsx
<AnimatePresence mode="wait">
  <motion.div
    key={selectedDate}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
  >
    <DayDetail ... />
  </motion.div>
</AnimatePresence>
```

### Pattern 6: Height-auto collapse (DayDetail note expand)
**What:** motion/react `height: 'auto'` with `AnimatePresence`
**Caveat:** height: 'auto' animations require `layout` or explicit `overflow: hidden` on the parent in motion v12.

```jsx
<AnimatePresence>
  {expanded && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{ overflow: 'hidden' }}
    >
      <p className="...">{note}</p>
    </motion.div>
  )}
</AnimatePresence>
```

### Anti-Patterns to Avoid
- **Using `motion` for overlay-level mount/unmount:** Causes conflict with tw-animate-css `@keyframes enter` (documented critical gotcha)
- **Using `tw-animate-css` `animate-in slide-in-from-bottom` classes:** Generate zero CSS in this project
- **Applying both CSS keyframe animation AND motion animate to the same DOM node:** The `translate` vs `transform` conflict
- **Using `active:scale-[0.96]` on icon buttons smaller than ~32px:** Looks broken; use `active:opacity-70` instead
- **Referencing a CSS class name as a `@keyframes` animation name:** The StreakCelebration bug — `overlay-enter` is a class, `overlay-slide-in` is the keyframe name

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| In-overlay screen crossfade | Custom CSS keyframes per screen | `motion/react` AnimatePresence + motion.div | motion already installed, handles mode="wait" queue |
| Button press scale | requestAnimationFrame + manual transform | Tailwind `active:scale-[0.96]` | Single class, browser handles |
| Saving state indicator | setTimeout-based text swap | Simple boolean state + conditional render | Testable, idiomatic React |
| Height collapse animation | CSS max-height hack | motion/react `height: 'auto'` | Handles dynamic content correctly |
| Date change crossfade | CSS transition on opacity | motion/react AnimatePresence key | Handles the unmount/remount correctly |

---

## Common Pitfalls

### Pitfall 1: `onAnimationEnd` bubbling from child motion elements
**What goes wrong:** Adding `AnimatePresence` inside a portal div that has `onAnimationEnd` — child animation end events bubble up and prematurely call `setVisible(false)`.
**How to avoid:**
```jsx
onAnimationEnd={(e) => {
  if (e.target !== e.currentTarget) return; // guard against bubbling
  if (exiting) setVisible(false);
}}
```

### Pitfall 2: `transition-transform` and `transition-colors` conflict
**What goes wrong:** Applying both `transition-colors` and `transition-transform duration-75` to the same button generates a `transition-property` that only includes the last one when both short-form utilities are used.
**How to avoid:** Use `transition-all duration-75` (covers both) OR specify both properties: in Tailwind v4, `transition-[color,border-color,transform]` with explicit duration. The simplest safe pattern is keeping the existing `transition-colors` for hover and adding `active:scale-[0.96]` — Tailwind v4 merges these correctly since `active:` is a separate variant layer and the `transition` applies to both.
**Verified approach:** In practice, Tailwind's `transition-colors` generates `transition-property: color, background-color, border-color, ...` and `active:scale-[0.96]` adds a transform. The scale will not be animated by `transition-colors`. To animate the scale, add `transition-transform` alongside. Both can coexist: `class="hover:text-foreground transition-colors active:scale-[0.96] transition-transform duration-75"` — Tailwind generates both transition properties.

### Pitfall 3: TodayPage flash root cause misidentification
**What goes wrong:** Assuming the flash needs a new animation wrapper when the root cause is a loading state oscillation.
**How to avoid:** Confirm by logging `loading` in `useWins` when `startTimer` fires. If `loading` briefly returns to `true`, fix in `useWins`, not in animation layer.

### Pitfall 4: `height: 'auto'` animation without overflow:hidden
**What goes wrong:** Content flashes outside bounds during the animation.
**How to avoid:** Add `style={{ overflow: 'hidden' }}` to the `motion.div` wrapping the collapsible content.

### Pitfall 5: StreakCelebration broken animation reference
**What goes wrong:** `style={{ animation: 'overlay-enter 0.3s ...' }}` — `overlay-enter` is a CSS class name, not a `@keyframes` name. This silently does nothing.
**How to avoid:** Always use `@keyframes` names (e.g., `overlay-slide-in`) in `style.animation`, not class names.

### Pitfall 6: motion v12 `translate` vs CSS `transform` conflict
**Critical documented gotcha:**
- motion v12 animates using CSS `translate` property
- tw-animate-css `@keyframes enter` uses `transform: translate3d()`
- Conflict is silent on the same element
- Safe: outer overlay div uses CSS `@keyframes transform`, inner `motion.div` uses `translate` on different DOM node

---

## Code Examples

### Journal editor screen transition
```jsx
// Inside JournalEditorOverlay portal div
import { AnimatePresence, motion } from 'motion/react';

<AnimatePresence mode="wait">
  {screen === 'editing' ? (
    <motion.div
      key="editing"
      className="flex-1 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {/* header + form */}
    </motion.div>
  ) : (
    <motion.div
      key="summary"
      className="flex-1 flex flex-col items-center justify-center gap-6 p-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
    >
      {/* summary content */}
    </motion.div>
  )}
</AnimatePresence>
```

### onAnimationEnd bubble guard (for any overlay with inner AnimatePresence)
```jsx
onAnimationEnd={(e) => {
  if (e.target !== e.currentTarget) return;
  if (exiting) { setVisible(false); setScreen('editing'); }
}}
```

### TimerFocusOverlay — remove win cap
```jsx
// Before:
const showAddSlot = displayWins.length < 4;
// After:
const showAddSlot = true;
```

### Journal save button with saving state + active press
```jsx
const [saving, setSaving] = useState(false);

async function handleSave(e) {
  e.preventDefault();
  const currentTitle = title.trim();
  if (!currentTitle || saving) return;
  setSaving(true);
  const wc = liveWordCountRef.current;
  const minutes = Math.round((Date.now() - startedAtRef.current) / 60000);
  await onSave({ title: currentTitle, body: body.trim() });
  setSaving(false);
  setSummaryWordCount(wc);
  setSummaryMinutes(minutes);
  setScreen('summary');
}

// Button:
<button
  type="submit"
  disabled={!title.trim() || saving}
  className="font-mono text-xs uppercase tracking-widest text-foreground
             disabled:opacity-30 border-b border-foreground pb-px
             active:scale-[0.96] transition-transform duration-75"
>
  {saving ? 'Saving\u2026' : 'Save'}
</button>
```

### Tuned journal exit easing
```css
/* index.css — faster ease-in for dismiss feel */
.journal-overlay-exit {
  animation: journal-slide-out 0.22s cubic-bezier(0.4, 0, 1, 1) both;
}
```

### StreakCelebration — state-machine refactor (fix animation + exit)
```jsx
const [visible, setVisible] = useState(false);
const [exiting, setExiting] = useState(false);

useEffect(() => {
  if (open) { setVisible(true); setExiting(false); }
  else if (visible) { setExiting(true); }
}, [open]);

// In JSX:
className={`fixed inset-0 z-[100] ... ${exiting ? 'overlay-exit' : 'overlay-enter'}`}
onAnimationEnd={(e) => {
  if (e.target !== e.currentTarget) return;
  if (exiting) setVisible(false);
}}
```

### HistoryPage — DayDetail transition on date change
```jsx
// In HistoryPage.jsx, wrap DayDetail:
import { AnimatePresence, motion } from 'motion/react';

<AnimatePresence mode="wait">
  <motion.div
    key={selectedDate}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.12 }}
  >
    <DayDetail date={selectedDate} wins={selectedWins} loading={detailLoading} />
  </motion.div>
</AnimatePresence>
```

### DayDetail — note expand/collapse animation
```jsx
// In DayDetail WinRow component:
import { AnimatePresence, motion } from 'motion/react';

{!completed && note && expanded && (
  // Replace bare conditional with:
)}

<AnimatePresence>
  {!completed && note && expanded && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{ overflow: 'hidden' }}
    >
      <p className="font-mono text-xs text-muted-foreground mt-2 leading-relaxed">
        {note}
      </p>
    </motion.div>
  )}
</AnimatePresence>
```

### RollForwardPrompt — add hover/active feedback
```jsx
// Yes button:
className="text-foreground underline hover:opacity-70 active:opacity-50 transition-opacity duration-75"
// Dismiss button:
className="text-muted-foreground hover:text-foreground active:opacity-70 transition-colors duration-75"
```

---

## Files to Modify — Complete List

| File | Change | IDs |
|------|--------|-----|
| `src/components/wins/TimerFocusOverlay.jsx` | Remove 4-win cap + active feedback on all timer buttons + Stop all | FIX-01, NEW-03 |
| `src/pages/TodayPage.jsx` | Fix AnimatePresence flash + active press on Log a win / Check in | FIX-02, NEW-01 |
| `src/components/journal/JournalEditorOverlay.jsx` | Screen crossfade AnimatePresence + saving state Save button + bubble guard | FIX-03, FIX-05 |
| `src/index.css` | Tune journal-overlay-exit easing + add celebration-enter keyframe if needed | FIX-04, NEW-BUG-01 |
| `src/components/wins/WinCard.jsx` | Active feedback on all 5 icon buttons | NEW-02 |
| `src/components/checkin/CheckInOverlay.jsx` | Active press on Yes / No / Next / Close | NEW-04 |
| `src/components/checkin/MorningPrompt.jsx` | Active press on Log a win / Later | NEW-05 |
| `src/components/checkin/EveningPrompt.jsx` | Active press on Start check-in / Later | NEW-06 |
| `src/components/history/DayStrip.jsx` | Active feedback on day cells + arrow nav | NEW-07 |
| `src/components/history/DayDetail.jsx` | Active feedback on expand button + animate note expand | NEW-08, NEW-08-anim |
| `src/pages/HistoryPage.jsx` | AnimatePresence keyed by selectedDate wrapping DayDetail | NEW-09 |
| `src/pages/JournalPage.jsx` | Active press on "New Entry" button | NEW-09-btn |
| `src/components/journal/JournalEntryCard.jsx` | Active press on Edit / Delete | NEW-10 |
| `src/components/layout/SideNav.jsx` | Active press state on NavLinks | NEW-11 |
| `src/components/wins/RollForwardPrompt.jsx` | Add hover + active to Yes / Dismiss buttons | NEW-12 |
| `src/components/layout/StreakCelebration.jsx` | Full state-machine refactor to fix animation + exit | NEW-BUG-01 |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 + @testing-library/react ^16.3.2 |
| Config file | `vitest.config.js` |
| Quick run command | `mise exec -- npm run test -- --reporter=verbose --run` |
| Full suite command | `mise exec -- npm run test -- --run` |

### Phase Requirements → Test Map

| ID | Behavior | Test Type | Automated Command | File Exists? |
|----|----------|-----------|-------------------|-------------|
| FIX-01 | TimerFocusOverlay renders AddSlot when 4 wins shown | unit | `mise exec -- npm run test -- --run src/components/wins/TimerFocusOverlay.test.jsx` | ✅ (needs new case) |
| FIX-02 | TodayPage does not flash on timer overlay open | integration | `mise exec -- npm run test -- --run src/pages/TodayPage.test.jsx` | ❌ Wave 0 |
| FIX-03 | JournalEditorOverlay renders summary screen after save | unit | `mise exec -- npm run test -- --run src/components/journal/JournalEditorOverlay.test.jsx` | ✅ (existing, needs screen transition assertion) |
| FIX-04 | Journal overlay CSS exit class applied on close | unit | part of existing JournalEditorOverlay test | ✅ (existing) |
| FIX-05 | Save button shows "Saving…" while async onSave is pending | unit | `mise exec -- npm run test -- --run src/components/journal/JournalEditorOverlay.test.jsx` | ❌ Wave 0 |
| NEW-BUG-01 | StreakCelebration applies overlay-enter class on open | unit | manual-only (RAF animation testing unreliable) | ❌ (manual verification) |
| NEW-04 | CheckInOverlay Yes/No buttons have active class | manual-only | browser inspection | ✅ (existing checkin tests cover flow) |
| NEW-09 | HistoryPage DayDetail transitions on date change | manual-only | browser visual | ✅ (existing history tests cover data) |

**Note on micro-interactions (NEW-01 through NEW-12):** Active press states (`active:` pseudo-class) and CSS transitions are not meaningfully testable with jsdom/Testing Library — `userEvent.click()` does not trigger `active:` pseudo-class. Testing these via unit tests would produce false confidence. The correct validation is visual acceptance testing in browser. Existing tests covering the functional behavior of each component remain valid.

### Sampling Rate
- **Per task commit:** `mise exec -- npm run test -- --run src/components/wins/TimerFocusOverlay.test.jsx src/components/journal/JournalEditorOverlay.test.jsx`
- **Per wave merge:** `mise exec -- npm run test -- --run`
- **Phase gate:** Full suite green before `/gsd:verify-work` + visual acceptance pass in browser

### Wave 0 Gaps
- [ ] `src/pages/TodayPage.test.jsx` — covers FIX-02 (flash regression test using userEvent to trigger timer overlay open)
- [ ] New test case in `TimerFocusOverlay.test.jsx` — asserts AddSlot renders when exactly 4 wins provided (FIX-01)
- [ ] New test case in `JournalEditorOverlay.test.jsx` — asserts Save button shows "Saving…" while onSave is pending (FIX-05)

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `framer-motion` package | `motion` package | motion v12 rebranding | Import from `"motion/react"` not `"framer-motion"` |
| `tw-animate-css` slide-in classes | Plain `@keyframes` in index.css | Phase 5 discovery | `animate-in slide-in-from-bottom` generates zero CSS in this project |
| CSS `transform` shorthand | CSS individual `translate` property | motion v12 internal | Conflict when both applied to same DOM node |

---

## Sources

### Primary (HIGH confidence)
- Direct source code audit of all 16 named files — patterns confirmed in-tree
- `src/index.css` — confirmed `@keyframes` names: `overlay-slide-in`, `overlay-slide-out`, `journal-slide-in`, `journal-slide-out`
- `src/components/wins/WinInputOverlay.jsx` — canonical state-machine animation pattern
- `src/components/wins/TimerFocusOverlay.jsx` — confirmed FIX-01 bug at line 116
- `src/components/journal/JournalEditorOverlay.jsx` — confirmed hard-cut at `setScreen('summary')`
- `src/components/layout/StreakCelebration.jsx` — confirmed broken animation reference at line 49
- Project MEMORY.md — critical animation gotcha documented and verified

### Secondary (MEDIUM confidence)
- motion/react v12 AnimatePresence + `height: 'auto'` behavior — based on installed version + known motion v12 behavior; `height: 'auto'` animations are a documented feature of motion/react

### Tertiary (LOW confidence)
- TodayPage flash root cause — `loading` oscillation hypothesis not confirmed; requires runtime investigation before implementation

---

## Metadata

**Confidence breakdown:**
- Original FIX-01 to FIX-05: HIGH — exact lines identified in source
- NEW-BUG-01 (StreakCelebration): HIGH — confirmed broken at line 49
- NEW-01 to NEW-12 (button feedback): HIGH — every button audited in source; missing `active:` classes confirmed
- NEW-09 (HistoryPage transition): HIGH — snap confirmed by reading code (no transition on selectedDate change)
- NEW-08-anim (DayDetail height): HIGH — confirmed bare boolean toggle with no animation
- FIX-02 (TodayPage flash): MEDIUM — root cause hypothesized, runtime confirmation needed

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable stack — motion v12 API, Tailwind v4 active: pseudo-class, all stable)
