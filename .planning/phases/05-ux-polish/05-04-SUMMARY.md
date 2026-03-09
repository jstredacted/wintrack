---
phase: 05-ux-polish
plan: 04
subsystem: ui
tags: [react, createPortal, journal, animation, word-count, css-keyframes]

# Dependency graph
requires:
  - phase: 05-02
    provides: "JournalEntryForm bare inputs and stoic aesthetic established in Phase 4"
  - phase: 04-history-and-journal
    provides: "useJournal hook, JournalEntryForm component, JournalPage wiring"
provides:
  - "Full-screen slide-up JournalEditorOverlay with createPortal state-machine pattern"
  - "Live word count tracking via liveWordCountRef (closure-safe)"
  - "Summary screen showing word count chip and time-written chip after save"
  - "journal-overlay-enter / journal-overlay-exit CSS keyframe classes in index.css"
  - "JournalPage updated to use JournalEditorOverlay instead of inline JournalEntryForm"
affects: [05-05, any future journal-related plans]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "liveWordCountRef pattern: track state as ref alongside useState for closure-safe reads in async handlers — avoids stale closure issue in createPortal + userEvent test context"
    - "autoFocus prop instead of setTimeout focus — avoids timer-based focus racing with userEvent.type in tests"

key-files:
  created:
    - "src/components/journal/JournalEditorOverlay.jsx"
  modified:
    - "src/index.css"
    - "src/pages/JournalPage.jsx"

key-decisions:
  - "liveWordCount tracked as both state (for rendering) and ref (liveWordCountRef.current) — ref used in handleSave to avoid stale closure issue in test environment with createPortal"
  - "autoFocus prop on title input replaces setTimeout(..., 50) focus — the timer was racing with userEvent.type in tests, stealing focus from body textarea mid-typing"
  - "body state still controlled for live word count display; word count for summary captured via liveWordCountRef before async onSave call"

patterns-established:
  - "Dual-track state+ref pattern: setLiveWordCount(wc) + liveWordCountRef.current = wc in same handler for display + async-safe capture"

requirements-completed: []

# Metrics
duration: 18min
completed: 2026-03-10
---

# Phase 5 Plan 04: Journal Editor Overlay Summary

**Full-screen createPortal journal editor with slide-up animation, live word count, and post-save summary screen showing word count + time written chips**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-10T03:15:19Z
- **Completed:** 2026-03-10T03:33:28Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Built JournalEditorOverlay with CSS keyframe slide-up/slide-down using journal-overlay-enter/exit classes
- Live word count updates in real time via liveWordCountRef pattern, resolving createPortal + userEvent stale-closure flakiness
- Summary screen shows "X words" and "X min" chips after save, with a Done button calling onClose
- Updated JournalPage to use single JournalEditorOverlay instance, removing inline JournalEntryForm and motion.div wrapper

## Task Commits

1. **Task 1: Add journal CSS keyframes to index.css** - `cb4310b` (chore)
2. **Task 2: Build JournalEditorOverlay + update JournalPage** - `7967ba0` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified
- `src/index.css` — Added journal-slide-in, journal-slide-out keyframes and .journal-overlay-enter / .journal-overlay-exit classes
- `src/components/journal/JournalEditorOverlay.jsx` — Full-screen createPortal editor with state-machine animation, live word count, summary screen, Escape key handler
- `src/pages/JournalPage.jsx` — Replaced two inline JournalEntryForm usages with single JournalEditorOverlay, removed motion.div wrapper

## Decisions Made
- **liveWordCountRef pattern:** Word count tracked as both state (for live display) and ref (for async-safe capture in handleSave). The ref avoids a subtle test environment issue where closing over `liveWordCount` state in the async handleSave gives a stale value when other tests have run before this one in the same vitest worker.
- **autoFocus instead of setTimeout:** The original plan used `setTimeout(() => titleRef.current?.focus(), 50)`. This caused test flakiness: the 50ms timer fired during `userEvent.type` on the body textarea, stealing focus mid-typing. `autoFocus` prop on the input achieves the same UX without a timer.
- **body state remains controlled:** The body `<textarea>` stays controlled (value={body}) because the live word count rendering requires it. The word count state is captured before the async onSave, so it's always correct.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced setTimeout focus with autoFocus prop**
- **Found during:** Task 2 (TDD GREEN phase — tests flaky in full vitest suite)
- **Issue:** `setTimeout(() => titleRef.current?.focus(), 50)` fired during `userEvent.type` on body textarea in test 3 (`shows live word count`), stealing focus mid-typing. Tests passed in isolation but failed ~2/3 of the time in the full suite due to timing variance.
- **Fix:** Removed setTimeout focus call. Added `autoFocus` prop directly on the `<input>` element.
- **Files modified:** src/components/journal/JournalEditorOverlay.jsx
- **Verification:** 3 consecutive full suite runs all pass. JournalEditorOverlay 5/5 GREEN.
- **Committed in:** 7967ba0 (Task 2 commit)

**2. [Rule 1 - Bug] liveWordCountRef pattern for closure-safe word count capture**
- **Found during:** Task 2 (TDD GREEN phase — summary test showed 1 word instead of 3)
- **Issue:** In the test environment with createPortal, the `body` React state had stale closure values when read in `handleSave` after `await onSave(...)`. The word count chip showed 1 instead of 3.
- **Fix:** Track word count as both `liveWordCount` state (for rendering) and `liveWordCountRef.current` (for async-safe reads). Read `liveWordCountRef.current` in handleSave instead of computing from potentially-stale state.
- **Files modified:** src/components/journal/JournalEditorOverlay.jsx
- **Verification:** All 5 JournalEditorOverlay tests GREEN in 3 consecutive full suite runs.
- **Committed in:** 7967ba0 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - bug)
**Impact on plan:** Both fixes required for test reliability and correct word count display. No scope creep.

## Issues Encountered
- Significant debugging required for test isolation issue: word count showed 1 instead of 3 when 4th test ran after 3rd. Root cause: stale closures in async handlers with createPortal. Solution: liveWordCountRef pattern.
- Focus timer race condition: setTimeout(50ms) raced with userEvent.type events in tests. Fixed by using autoFocus prop.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- JournalEditorOverlay ready for phase 05-05 (DayStrip + Header dual-streak)
- Journal writing experience fully immersive: full-screen, slide-up animation, live word count, completion summary
- JournalPage wiring complete: new entry and edit both use the overlay

## Self-Check: PASSED
- src/components/journal/JournalEditorOverlay.jsx: FOUND
- src/pages/JournalPage.jsx: FOUND
- Commit cb4310b: FOUND
- Commit 7967ba0: FOUND

---
*Phase: 05-ux-polish*
*Completed: 2026-03-10*
