# Phase 3: Daily Loop Closure - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Close the daily accountability loop: evening check-in captures yes/no completion + optional reflection note per win, in-app full-screen prompts appear at 9am (no wins logged) and 9pm (no check-in done), and a streak counter in the header tracks consecutive days with at least one completed win. Push notification delivery is v2; v1 is code stubs only.

</domain>

<decisions>
## Implementation Decisions

### Check-in Flow Structure
- **Step-through overlay**: One win at a time, full-screen, same WinInputOverlay pattern — reuses existing animation infrastructure (plain CSS keyframes, createPortal)
- Entry point: "Start check-in" button (surfaced via evening in-app prompt and available on TodayPage)
- Each win screen shows: win title prominently + two buttons (Yes / No)
- **On No**: A reflection note text field appears on the same screen — "What happened?" Optional, can be skipped by pressing Enter or tapping Next
- **On Yes**: Advance immediately to next win — no note field
- **Completion screen**: After last win, show a brief final screen with tally (e.g., "3 of 4 — 24 min tracked") + current streak number. Auto-closes or tap to close. Not a celebration — informational and Stoic.

### In-App Prompts
- **Morning prompt (9am, no wins logged today)**:
  - Full-screen overlay, appears on first app open after 9am if no wins exist for today
  - Only dismissible via buttons — no tap-anywhere dismiss
  - Buttons: "Log a win" (opens WinInputOverlay, closes morning overlay) and a secondary "Dismiss" or "Later" option
  - Copy direction: direct and ritual — e.g., "What are you committing to today?"
- **Evening prompt (9pm, no check-in completed)**:
  - Same full-screen overlay pattern as morning
  - Only dismissible via buttons
  - Buttons: "Start check-in" (opens check-in overlay) and secondary dismiss
  - Copy direction: reflective — e.g., "Time to close the loop."
- Both prompts: shown only once per day (state stored in uiStore or localStorage) — dismissing once per day is enough

### Streak Display
- **Location**: Header area, right side — next to the wintrack wordmark (replacing or alongside the ThemeToggle)
- **Format**: Number only, mono font — stark and minimal. "7" not "7 days". Very Nothing Phone.
- **At zero**: Show "0" — consistent with number-only design; honest
- **Calculation**: Count of consecutive days (up to and including today) where at least one win has `completed = true`. Uses `getLocalDateString()` for timezone-safe date comparison.

### Push Notification Stubs (CHECKIN-04)
- **No visible UI** — v1 is code comments only
- Implement a `notifications.js` utility with well-commented stub functions: `scheduleMorningReminder()` and `scheduleEveningReminder()`
- Each function logs to console in dev: `// TODO v2: register service worker, call Notification.requestPermission(), push at 9am/9pm`
- Document the v2 path clearly in comments — this is the deliverable for CHECKIN-04 in v1

### Claude's Discretion
- Exact animation/transition of check-in overlay steps (slide, fade, or both)
- Exact wording of prompt copy (beyond direction given above)
- Whether streak lives in a new `useStreak` hook or is computed in TodayPage/Header
- ThemeToggle placement adjustment when streak counter shares the header right side
- How check-in completion state is stored (check_ins table row vs wins column update)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/wins/WinInputOverlay.jsx`: Full-screen overlay with createPortal, CSS keyframe slide animation (overlay-slide-in/out), Escape key handler — check-in overlay should use the same pattern
- `src/stores/uiStore.js`: Zustand store already manages `inputOverlayOpen`, `editingWinId`, `rollForwardOffered` — extend with `checkinOverlayOpen`, `morningPromptDismissed`, `eveningPromptDismissed`
- `src/hooks/useWins.js`: Fetches today's wins — check-in needs to update `completed` field and `reflection_note` on each win. May need a `submitCheckin()` action added here or in a new `useCheckin` hook.
- `src/components/layout/Header.jsx`: Right side currently has only ThemeToggle — streak counter goes here too
- `src/components/wins/RollForwardPrompt.jsx`: Banner-style prompt pattern — morning/evening prompts are full-screen but can reference this for state/callback patterns

### Established Patterns
- Full-screen overlays: `createPortal(…, document.body)`, plain CSS keyframes, `visible/exiting` useState + `onAnimationEnd` to unmount
- Zustand v5: `create()(fn)` double-parens, named exports only
- Supabase queries: `.from('wins').update({…}).eq('id', id).eq('user_id', USER_ID)`
- Dark mode: `.dark` class on `<html>`, all color via CSS vars — no hardcoded colors

### Integration Points
- `src/components/layout/Header.jsx`: Add streak number (right side, alongside ThemeToggle)
- `src/pages/TodayPage.jsx`: Add morning/evening prompt overlay rendering (similar to WinInputOverlay)
- `src/hooks/useWins.js` or new `src/hooks/useCheckin.js`: Add check-in submission (update `completed` + `reflection_note` per win)
- `src/stores/uiStore.js`: Add prompt dismissed state and checkin overlay open state
- Supabase `check_ins` table: already exists from Phase 1 schema — check_in records tie to `win_date` + `user_id`

</code_context>

<specifics>
## Specific Ideas

- Check-in feel: PROJECT.md says "Stoic app energy — whitespace-heavy, serif or mono font, meditative pacing". The completion screen should not feel like an achievement badge — it's a quiet summary and a number.
- The streak "0" in the header on day one sets the tone: "you're at zero, let's go" — not hidden, not softened.
- Morning overlay copy inspiration: sparse, direct. Not motivational poster energy. Just the question.
- Evening overlay copy inspiration: "Time to close the loop." — not "Great job!" or "You can do it!"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-daily-loop-closure*
*Context gathered: 2026-03-09*
