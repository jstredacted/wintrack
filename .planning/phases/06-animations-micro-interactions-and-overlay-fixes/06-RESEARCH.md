# Phase 6: Animations, Micro-interactions, and Overlay Fixes — Research

**Researched:** 2026-03-10
**Domain:** CSS keyframe animations, React state-machine unmount pattern, motion/react, micro-interactions
**Confidence:** HIGH

## Summary

Phase 6 addresses five distinct issues that together erode the polish of the UX. Four are animation/transition problems (journal save snap, journal exit snap, TodayPage flash, missing button feedback) and one is a functional bug in TimerFocusOverlay (the 4-win cap imposed by `showAddSlot = displayWins.length < 4`). All work occurs inside files that already exist — no new architectural surfaces are needed.

The animation system is already established in `src/index.css` using plain `@keyframes` + class-toggling (the state-machine pattern from `WinInputOverlay.jsx`). This pattern MUST be followed for overlay transitions because `tw-animate-css` conflicts with `motion` v12 at the CSS property level. The `motion/react` library is already installed and is the correct tool for in-page enter/exit of list items and for screen-transition animations inside overlays where mounting/unmounting is controlled.

The flash on TodayPage is almost certainly caused by the `AnimatePresence` loading → content transition being triggered by a re-render when `timerOverlayOpen` changes in the Zustand store, causing the `motion.div` with `key="content"` to re-mount. The fix is to prevent the winning condition from oscillating.

**Primary recommendation:** Use the established `@keyframes` + `visible/exiting` state-machine for all overlay-level transitions; use `motion/react` `<motion.div>` with `animate` variants for in-overlay screen transitions (editing → summary); fix the timer overlay limit by removing the `< 4` cap; fix the TodayPage flash by stabilizing the `AnimatePresence` key.

---

## Bug Analysis

### Bug 1: TimerFocusOverlay — 4-win cap (FUNCTIONAL BUG)

**Root cause (confirmed in source):**
```jsx
// src/components/wins/TimerFocusOverlay.jsx line 116
const showAddSlot = displayWins.length < 4;
```
The `AddSlot` button is hidden when 4 or more wins are shown. The `timerFontSize()` function only handles counts 1/2/3 and falls back to `clamp(2rem, 4vw, 3.5rem)` for ≥4 — that fallback is correct and already handles arbitrarily large counts.

**Fix:** Remove the `< 4` cap. Make `showAddSlot` always `true` (or conditional on something meaningful like "has the user already logged 10+ wins today?" — but the simpler answer is just always show it). The grid layout already handles 5+ items since it uses `grid-cols-2` for `totalItems >= 3`.

**Test impact:** The existing test at line 30-38 of `TimerFocusOverlay.test.jsx` passes 5 wins and asserts they all render — it never asserts that `AddSlot` is absent at count 4, so removing the cap will not break the existing test. A new test should assert AddSlot renders when 4 wins are present.

---

### Bug 2: TodayPage flash when opening TimerFocusOverlay (0.2–0.5s flicker)

**Root cause analysis:**
In `TodayPage.jsx`, the content area is wrapped in:
```jsx
<AnimatePresence mode="wait">
  {loading ? (
    <motion.p key="loading" ... />
  ) : (
    <motion.div key="content" ... />
  )}
</AnimatePresence>
```
When `openTimerOverlay()` fires in `uiStore`, it calls `set({ timerOverlayOpen: true })`. Zustand's `set` triggers a synchronous re-render of `TodayPage`. The `loading` flag comes from `useWins()` — if the wins hook re-evaluates or if any state in the component changes, React may temporarily unmount/remount `motion.div key="content"`, causing the fade-in animation to replay.

The specific chain: `onStartTimer` in `WinList` calls `startTimer(id)` (mutations the wins array in `useWins`) AND `openTimerOverlay()`. Two state updates in sequence → two renders → `AnimatePresence` may see a key change if `loading` flickers.

**Fix options (HIGH confidence):**
1. Move the `AnimatePresence` wrapper outside/above the timer overlay interaction — i.e., only wrap the loading↔content transition, and make `key="content"` stable once `loading` is false. Since `loading` only transitions false→true on a full reload, this is already the case. The real issue may be that `startTimer` mutates the `wins` array reference, causing `useWins` to emit a new render that briefly shows `loading: true`.

   Inspect `useWins` to confirm — but the likely fix is: **do not re-trigger the `AnimatePresence` key change after initial load**. One approach: extract the `AnimatePresence` + motion wrappers into a stable component that takes `loading` as a prop and only mounts the animation once.

2. Simpler approach: remove `mode="wait"` from `AnimatePresence` and let the loading/content states cross-fade without waiting for exit. This prevents the blank-flash between exit and enter.

3. Most surgical: check if `startTimer` in `useWins` momentarily sets `loading: true`. If so, debounce the loading flag or only set loading on initial fetch.

**Requires reading `useWins` hook** to confirm root cause before implementing.

---

### Bug 3: Journal save — snaps to summary screen (needs easing)

**Current behavior:**
```jsx
// JournalEditorOverlay.jsx — handleSave
setScreen('summary');  // synchronous, no animation
```
The `screen` state flips immediately from `'editing'` to `'summary'`, causing a hard cut.

**Fix approach — motion/react in-overlay screen transition (HIGH confidence):**
Use `AnimatePresence` from `motion/react` around the two screen branches, with per-screen `motion.div` wrappers. This is safe inside an overlay whose mount/unmount is controlled by the `@keyframes` state-machine (the outer `onAnimationEnd` still handles unmounting; only the inner screens animate).

```jsx
import { AnimatePresence, motion } from 'motion/react';

// Inside the portal div:
<AnimatePresence mode="wait">
  {screen === 'editing' ? (
    <motion.div
      key="editing"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* editing content */}
    </motion.div>
  ) : (
    <motion.div
      key="summary"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      {/* summary content */}
    </motion.div>
  )}
</AnimatePresence>
```

**Key constraint:** The outer portal `div` already uses `journal-overlay-enter`/`journal-overlay-exit` CSS classes for its slide-up/down. The `motion/react` `AnimatePresence` inside it operates on the `translate` CSS property. Because the outer div uses CSS `transform: translateY()` via `@keyframes`, and `motion` v12 uses CSS individual `translate` property, **there is no conflict** as long as the inner `motion.div` and the outer portal `div` are separate DOM nodes. The gotcha only applies when both mechanisms try to animate the same element. Here they animate different elements — safe.

---

### Bug 4: Journal exit — snaps back (needs smooth transition)

**Current behavior:**
When `onClose` is called, `setExiting(true)` fires and the CSS `journal-overlay-exit` class plays. This IS an animation — 0.3s slide-down. However, the user may perceive a snap if:
1. The overlay is on the summary screen when closed — the `setVisible(false)` in `onAnimationEnd` also resets `setScreen('editing')`. This is correct.
2. The exit animation exists but the easing is wrong. Current: `cubic-bezier(0.32, 0.72, 0, 1)` at 0.3s — this is the same spring-like curve used for entry. For exits, a faster ease-in (e.g., `ease-in` or `cubic-bezier(0.4, 0, 1, 1)`) often feels more natural.

**Fix:** Tune the `journal-slide-out` keyframe easing in `index.css`. The entry `0.35s cubic-bezier(0.32, 0.72, 0, 1)` is good. The exit should be slightly faster at `0.25s` with `cubic-bezier(0.4, 0, 1, 1)` (iOS-style ease-in for dismiss). If the user still perceives a snap, it may be the inner screen transition not completing before `onClose` fires — in which case the screen transition `AnimatePresence` needs `onExitComplete` coordination, but this is likely over-engineering for this case.

---

### Bug 5: Buttons lack hover and click feedback

**Current state:** Most interactive elements have `transition-colors` for hover (e.g., `text-muted-foreground hover:text-foreground transition-colors`), but:
- The journal Save button has no visual active/pressed state.
- Icon buttons in WinCard (Pencil, Trash2) only appear on group-hover — no click feedback.
- The "Log a win" and "Check in" page buttons have color transitions but no scale or press feedback.

**Fix approach — CSS active pseudo-class + motion/react `whileTap` (HIGH confidence):**

Option A — CSS only (zero JS, preferred for simple buttons):
```css
button:active {
  transform: scale(0.96);
  transition: transform 0.08s ease;
}
```
Apply via a Tailwind utility or global `@layer base` rule. Works without motion package.

Option B — `motion/react` `whileTap` (for buttons where motion is already imported):
```jsx
import { motion } from 'motion/react';
<motion.button
  whileTap={{ scale: 0.94 }}
  transition={{ duration: 0.1 }}
>
```

**Recommendation:** Use Tailwind `active:scale-[0.96]` utility class on specific buttons needing tactile feedback (journal Save, "Log a win", "Check in"). Do NOT apply globally — icon buttons in WinCard should not scale. The journal Save button specifically needs both: a visual "saving" state (opacity reduction or a brief opacity flash to "Saved" text) as click confirmation.

For the journal Save button specifically: replace the plain `<button>` with an approach that provides brief text feedback — either a `saving` boolean state that shows "Saving..." while `onSave` resolves, or (simpler) a `saved` boolean that briefly shows "Saved ✓" then resets.

---

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| motion | ^12.35.2 | In-component animate/exit, whileTap | Installed, rebranded framer-motion |
| CSS @keyframes | native | Overlay mount/unmount transitions | Established project pattern — avoids motion v12 / tw-animate-css conflict |
| Tailwind v4 | ^4.2.1 | Utility classes including `active:scale-*` | Already in use |

### Do Not Add
No new packages needed for this phase. All animation primitives are already available.

---

## Architecture Patterns

### Pattern 1: Overlay mount/unmount (ESTABLISHED — do not change)
**What:** `visible` + `exiting` useState pair; CSS class toggling; `onAnimationEnd` to unmount
**Reference:** `src/components/wins/WinInputOverlay.jsx` (canonical example), `src/components/wins/TimerFocusOverlay.jsx`, `src/components/journal/JournalEditorOverlay.jsx`

```jsx
// The established pattern — do NOT use motion for overlay-level mount/unmount
const [visible, setVisible] = useState(false);
const [exiting, setExiting] = useState(false);

useEffect(() => {
  if (open) { setVisible(true); setExiting(false); }
  else if (visible) { setExiting(true); }
}, [open]);

// In JSX:
className={`fixed inset-0 z-50 ... ${exiting ? 'overlay-exit' : 'overlay-enter'}`}
onAnimationEnd={() => { if (exiting) setVisible(false); }}
```

### Pattern 2: In-overlay screen transitions (NEW for Phase 6)
**What:** `AnimatePresence` from `motion/react` wrapping screen branches inside an already-mounted overlay
**When to use:** When an overlay has multiple screens (editing → summary) and the transition should be animated
**Safe because:** The outer overlay div uses CSS `transform`, inner `motion.div` uses CSS `translate` — separate DOM nodes, no conflict

```jsx
import { AnimatePresence, motion } from 'motion/react';

<AnimatePresence mode="wait">
  {screen === 'editing' ? (
    <motion.div key="editing"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}>
      ...
    </motion.div>
  ) : (
    <motion.div key="summary"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}>
      ...
    </motion.div>
  )}
</AnimatePresence>
```

### Pattern 3: Button press feedback
**What:** Tailwind `active:scale-[0.96] transition-transform` on primary action buttons
**When to use:** Buttons that feel "heavy" enough to need tactile confirmation — Save, Log a win, Check in. NOT for icon-only buttons.

```jsx
className="... active:scale-[0.96] transition-transform duration-75"
```

### Anti-Patterns to Avoid
- **Using `motion` for overlay-level mount/unmount:** Causes conflict with tw-animate-css `@keyframes enter` (the project memory documents this as a critical gotcha)
- **Using `tw-animate-css` `animate-in slide-in-from-bottom` classes:** These generate zero CSS in this project (documented critical gotcha)
- **Adding `mode="wait"` to AnimatePresence inside the journal overlay:** The outer overlay is already handling mount/unmount timing via `onAnimationEnd`. `mode="wait"` on the inner `AnimatePresence` is fine for the screen transition since the outer div stays mounted.
- **Wrapping TodayPage content in a new `AnimatePresence` key that changes on store updates:** The flash is caused by reactive re-renders, not missing animation.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| In-overlay screen crossfade | Custom CSS keyframes per screen | `motion/react` AnimatePresence + motion.div | motion already installed, handles mode="wait" queue correctly |
| Button press scale | requestAnimationFrame + manual transform | Tailwind `active:scale-[0.96]` | Single class, browser handles animation |
| Saving state indicator | setTimeout-based text swap | Simple boolean state + conditional render | Clear, testable, idiomatic React |

---

## Common Pitfalls

### Pitfall 1: onAnimationEnd firing for child animations
**What goes wrong:** Adding `AnimatePresence` inside a portal div that has `onAnimationEnd` — if a child motion element's animation ends, `onAnimationEnd` bubbles up and prematurely calls `setVisible(false)`.
**Why it happens:** `onAnimationEnd` is a bubbling event in React.
**How to avoid:** Use `e.target === e.currentTarget` guard in the `onAnimationEnd` handler, or use `onAnimationEndCapture` with a specific animation name check.
```jsx
onAnimationEnd={(e) => {
  if (e.target !== e.currentTarget) return; // guard against bubbling
  if (exiting) setVisible(false);
}}
```
**Warning signs:** Overlay disappears immediately without playing the full exit animation.

### Pitfall 2: AnimatePresence with async save
**What goes wrong:** `handleSave` is `async` — it calls `await onSave(...)` before `setScreen('summary')`. If `onSave` takes >200ms, the editing screen stays visible during the await. This is correct behavior, but pairing it with an `exit` animation on the editing screen means the screen won't start exiting until the await completes.
**How to avoid:** Either (a) accept this — the editing screen stays until save completes, then crossfades to summary, which is actually ideal UX since it prevents premature dismissal; or (b) optimistically show summary immediately, then handle errors by reverting.
**Recommendation:** Accept (a). The current `savingRef.current = true` guard already prevents double-saves; the delay is typically imperceptible.

### Pitfall 3: TodayPage flash root cause misidentification
**What goes wrong:** Assuming the flash needs a new animation and adding `motion` wrappers — when the actual cause is a loading state oscillation that unmounts the `key="content"` motion div.
**How to avoid:** Add `console.log('loading:', loading)` to confirm whether `loading` briefly returns to `true` when `startTimer` fires. If yes, fix in `useWins`; if no, the issue is a key instability somewhere else.
**Warning signs:** If adding animation wrappers doesn't fix the flash, it's a state bug, not an animation bug.

### Pitfall 4: motion v12 `translate` vs CSS `transform` conflict
**Critical documented gotcha (from project MEMORY.md):**
- motion v12 animates using the CSS `translate` property (individual transform)
- tw-animate-css `@keyframes enter` uses `transform: translate3d()` (shorthand)
- These conflict silently on the same element
- The project already solves this with plain `@keyframes` in `index.css`
- **Never** apply both a motion animation AND a CSS keyframe animation to the same DOM element

---

## Code Examples

### Journal editor screen transition (new pattern)
```jsx
// Inside JournalEditorOverlay portal div — wrapping the two screens
// Source: motion/react docs pattern + project established style
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

### onAnimationEnd bubble guard
```jsx
// Prevents child motion animations from triggering premature unmount
onAnimationEnd={(e) => {
  if (e.target !== e.currentTarget) return;
  if (exiting) { setVisible(false); setScreen('editing'); }
}}
```

### TimerFocusOverlay — remove win cap
```jsx
// Before (line 116):
const showAddSlot = displayWins.length < 4;

// After:
const showAddSlot = true; // always show add slot
```

### Journal save button with saving state
```jsx
const [saving, setSaving] = useState(false);

async function handleSave(e) {
  e.preventDefault();
  const currentTitle = title.trim();
  if (!currentTitle || saving) return;
  setSaving(true);
  // ... compute wc, minutes
  await onSave({ title: currentTitle, body: body.trim() });
  setSaving(false);
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
  {saving ? 'Saving…' : 'Save'}
</button>
```

### Tuned journal exit easing (index.css)
```css
/* Current exit — same curve as entry, slightly slow */
.journal-overlay-exit {
  animation: journal-slide-out 0.3s cubic-bezier(0.32, 0.72, 0, 1) both;
}

/* Improved exit — faster ease-in for dismiss feel */
.journal-overlay-exit {
  animation: journal-slide-out 0.22s cubic-bezier(0.4, 0, 1, 1) both;
}
```

---

## Files to Modify

| File | Change | Bug |
|------|--------|-----|
| `src/components/wins/TimerFocusOverlay.jsx` | Remove `displayWins.length < 4` cap on `showAddSlot` | Bug 1 |
| `src/pages/TodayPage.jsx` | Diagnose and fix AnimatePresence flash — check useWins loading oscillation | Bug 2 |
| `src/components/journal/JournalEditorOverlay.jsx` | Wrap screen branches in AnimatePresence/motion.div; add saving state to Save button | Bug 3, Bug 5 |
| `src/index.css` | Tune `journal-slide-out` easing for faster dismiss | Bug 4 |
| `src/components/wins/WinCard.jsx` | (Optional) Add `active:scale-[0.96]` to timer control buttons | Bug 5 |
| `src/pages/TodayPage.jsx` | Add `active:scale-[0.96]` to "Log a win" and "Check in" buttons | Bug 5 |

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
| FIX-03 | JournalEditorOverlay renders summary screen after save (with transition) | unit | `mise exec -- npm run test -- --run src/components/journal/JournalEditorOverlay.test.jsx` | ✅ (existing) |
| FIX-04 | Journal overlay CSS exit class is set on close | unit | part of existing JournalEditorOverlay test | ✅ (existing) |
| FIX-05 | Save button shows saving state while async onSave is pending | unit | `mise exec -- npm run test -- --run src/components/journal/JournalEditorOverlay.test.jsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `mise exec -- npm run test -- --run src/components/wins/TimerFocusOverlay.test.jsx src/components/journal/JournalEditorOverlay.test.jsx`
- **Per wave merge:** `mise exec -- npm run test -- --run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/pages/TodayPage.test.jsx` — covers FIX-02 (flash regression test using userEvent.click on timer button)
- [ ] New test case in `TimerFocusOverlay.test.jsx` — asserts AddSlot renders when 4 wins provided (FIX-01)
- [ ] New test case in `JournalEditorOverlay.test.jsx` — asserts Save button shows "Saving…" while onSave is pending (FIX-05)

---

## Sources

### Primary (HIGH confidence)
- Direct source code audit of all named files — patterns confirmed in-tree
- `src/index.css` — existing `@keyframes` patterns and confirmed gotcha
- `src/components/wins/WinInputOverlay.jsx` — canonical state-machine animation pattern
- `src/components/wins/TimerFocusOverlay.jsx` — confirmed bug at line 116
- `src/components/journal/JournalEditorOverlay.jsx` — confirmed hard-cut at `setScreen('summary')`
- Project MEMORY.md — critical animation gotcha documented and verified

### Secondary (MEDIUM confidence)
- motion/react v12 AnimatePresence behavior — based on installed version in package.json + established usage in WinList.jsx; not re-verified via Context7 since the patterns are already working in this codebase
- CSS `translate` vs `transform` conflict — documented in project memory, consistent with known motion v12 behavior

### Tertiary (LOW confidence)
- TodayPage flash root cause — `loading` oscillation hypothesis not confirmed; requires runtime investigation

---

## Metadata

**Confidence breakdown:**
- Bug 1 (timer cap): HIGH — exact line identified in source
- Bug 2 (TodayPage flash): MEDIUM — root cause hypothesized, runtime confirmation needed
- Bug 3 (journal save transition): HIGH — cause confirmed, fix pattern established
- Bug 4 (journal exit easing): HIGH — single CSS value change
- Bug 5 (button feedback): HIGH — pattern well-established, scope clearly bounded

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable stack — motion v12 API, Tailwind v4 active: pseudo-class, all stable)
