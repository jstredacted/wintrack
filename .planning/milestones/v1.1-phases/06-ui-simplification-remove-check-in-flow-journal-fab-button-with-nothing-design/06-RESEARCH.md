# Phase 6: UI Simplification - Research

**Researched:** 2026-03-15
**Domain:** React component removal, UI state cleanup, FAB design pattern
**Confidence:** HIGH

## Summary

Phase 6 is a subtraction-focused phase: remove the entire check-in flow (overlay, prompts, hook, store state) and update the streak calculation to use the `wins.completed` column directly instead of querying `check_ins`. The second deliverable is a journal FAB (floating action button) in Nothing Phone's monochrome dot-matrix aesthetic, replacing the current inline "New Entry" button on JournalPage.

The check-in removal is straightforward but touches many files: TodayPage, useStreak, useHistory (join), DayDetail (note display), uiStore, DevToolsPanel, and the Edge Function evening notification copy. The streak rewrite is the highest-risk change since it alters core business logic. The FAB is a self-contained UI addition with no data model changes.

**Primary recommendation:** Remove check-in in a surgical first wave (delete components, rewrite useStreak query, clean references), then add the journal FAB as a separate clean task.

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SIMPLIFY-01 | Remove CheckInOverlay component and all its imports | Check-in removal analysis below |
| SIMPLIFY-02 | Remove MorningPrompt and EveningPrompt check-in trigger components | Check-in removal analysis below |
| SIMPLIFY-03 | Remove useCheckin hook entirely | Check-in removal analysis below |
| SIMPLIFY-04 | Clean uiStore of check-in-related state (checkinOverlayOpen, morning/eveningDismissedDate) | uiStore cleanup analysis below |
| SIMPLIFY-05 | Rewrite useStreak to query wins.completed directly instead of check_ins table | Streak rewrite section below |
| SIMPLIFY-06 | Update useHistory.fetchWinsForDate to drop check_ins join | History cleanup analysis below |
| SIMPLIFY-07 | Update DayDetail TimelineItem to remove check_ins note display | DayDetail cleanup below |
| SIMPLIFY-08 | Update DevToolsPanel seedYesterdayComplete to set wins.completed=true instead of inserting check_ins | DevTools update below |
| SIMPLIFY-09 | Update Edge Function evening message copy (remove "check-in" wording) | Edge Function analysis below |
| SIMPLIFY-10 | Clean TodayPage of all check-in imports, state, effects, and UI elements | TodayPage cleanup below |
| FAB-01 | Create JournalFab component with fixed-position circular button in Nothing Phone dot-matrix aesthetic | FAB design section below |
| FAB-02 | Replace JournalPage inline "New Entry" button with JournalFab | JournalPage integration below |

</phase_requirements>

## Architecture Patterns

### Removal Inventory — Check-in Flow

Every file referencing check-in functionality, with the specific changes needed:

**Files to DELETE entirely:**
| File | Lines | Notes |
|------|-------|-------|
| `src/components/checkin/CheckInOverlay.jsx` | 204 | Full overlay component |
| `src/components/checkin/CheckInOverlay.test.jsx` | ~50 | Tests for above |
| `src/components/checkin/EveningPrompt.jsx` | 58 | Evening check-in prompt |
| `src/components/checkin/EveningPrompt.test.jsx` | ~30 | Tests for above |
| `src/components/checkin/MorningPrompt.jsx` | 58 | Morning check-in prompt |
| `src/components/checkin/MorningPrompt.test.jsx` | ~30 | Tests for above |
| `src/hooks/useCheckin.js` | 57 | Hook for check_ins table |
| `src/hooks/useCheckin.test.js` | ~60 | Tests for above |

**Files to MODIFY:**

| File | What Changes |
|------|-------------|
| `src/pages/TodayPage.jsx` | Remove: import useCheckin, import CheckInOverlay/MorningPrompt/EveningPrompt, checkedInToday state + both useEffects, showMorning/showEvening logic, "Check in" button, CheckInOverlay/MorningPrompt/EveningPrompt JSX. Remove from uiStore destructure: checkinOverlayOpen, morningDismissedDate, eveningDismissedDate, openCheckinOverlay, closeCheckinOverlay, dismissMorningPrompt, dismissEveningPrompt |
| `src/hooks/useStreak.js` | Replace check_ins query with wins query (see Streak Rewrite below) |
| `src/hooks/useStreak.test.js` | Update mock to match new wins-based query shape |
| `src/hooks/useHistory.js` | Change `.select('id, title, category, completed, check_ins(note)')` to `.select('id, title, category, completed')` |
| `src/hooks/useHistory.test.js` | Remove `check_ins` from mock data shapes |
| `src/components/history/DayDetail.jsx` | Remove `const note = win.check_ins?.[0]?.note` and all note-related UI (expand button, expanded state, note display) |
| `src/components/history/DayDetail.test.jsx` | Remove `check_ins` from test fixtures |
| `src/stores/uiStore.js` | Remove: checkinOverlayOpen, openCheckinOverlay, closeCheckinOverlay, morningDismissedDate, eveningDismissedDate, dismissMorningPrompt, dismissEveningPrompt |
| `src/components/dev/DevToolsPanel.jsx` | seedYesterdayComplete: instead of inserting check_ins rows, set `completed: true` on the wins insert directly |
| `supabase/functions/send-push/index.ts` | Change evening message body from "Time for your evening check-in" to something like "Time to reflect on your day" |
| `src/pages/TodayPage.test.jsx` | Remove check-in related mock setup and assertions |

### Streak Rewrite (SIMPLIFY-05) — Critical Change

**Current logic (useStreak.js lines 28-33):**
```javascript
// Queries check_ins table joined to wins for win_date
const { data, error } = await supabase
  .from('check_ins')
  .select('win_id, wins(win_date)')
  .eq('user_id', USER_ID)
  .eq('completed', true);
```

**New logic — query wins.completed directly:**
```javascript
// Query wins table directly for completed wins
const { data, error } = await supabase
  .from('wins')
  .select('win_date')
  .eq('user_id', USER_ID)
  .eq('completed', true);
```

**Data shape change:**
- Old: `data.map(row => row.wins?.win_date)` (nested join)
- New: `data.map(row => row.win_date)` (flat, direct column)

The rest of the streak counting logic (while loop walking backwards through dates) stays identical. Journal streak and combined streak logic are unaffected since they already query `journal_entries` directly.

### DayDetail Simplification (SIMPLIFY-07)

The `TimelineItem` component currently reads `win.check_ins?.[0]?.note` and renders an expandable note section for incomplete wins. With check-in removal:
- Remove the `note` variable, `expanded` state, expand button, and AnimatePresence note block
- The `ChevronDown`/`ChevronUp` imports from lucide-react can be removed
- The `completed` status badge ("Completed"/"Incomplete") stays — it now reads from `win.completed` directly (which it already does)

### Journal FAB Design (FAB-01)

**Nothing Phone Glyph aesthetic applied to FAB:**

The app already uses the Nothing design language throughout (SHELL-02): Geist Mono font, monochrome palette, dot-grid background, structured negative space. The FAB should extend this.

**Design spec:**
- Fixed position: `fixed bottom-6 right-6 z-40` (below overlays at z-50)
- Size: `w-14 h-14` (56px circle) — standard Material FAB size works well
- Shape: `rounded-full` — circle
- Colors: `bg-foreground text-background` (inverted, high contrast) — matches existing primary buttons
- Icon: `Plus` from lucide-react (already imported in TodayPage, consistent)
- Border: `border border-foreground/20` — subtle definition
- Dot-matrix glow effect: Use a subtle `box-shadow` with `0 0 0 1px` pattern or `ring` utility for the Nothing-style structured border. A `shadow-[0_0_20px_rgba(255,255,255,0.05)]` in dark mode adds the characteristic subtle glow
- Hover: `hover:scale-105 transition-transform` — minimal, clean
- Active: `active:scale-95` — tactile feedback

**Implementation pattern:**
```jsx
<button
  onClick={onAdd}
  aria-label="New journal entry"
  className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-foreground text-background border border-foreground/20 shadow-sm hover:scale-105 active:scale-95 transition-transform duration-100"
>
  <Plus size={24} strokeWidth={1.5} />
</button>
```

The `strokeWidth={1.5}` matches the thinner, more refined Nothing aesthetic versus the default 2.

### JournalPage Integration (FAB-02)

Current "New Entry" button is an inline text button in the header. Replace with:
1. Remove the button from the `flex items-baseline justify-between` header
2. Add the FAB component (either inline or as a separate `JournalFab.jsx` component)
3. The FAB calls the same `setShowNewForm(true)` handler

**Decision: Inline vs separate component.** Given the FAB is ~10 lines of JSX and only used on JournalPage, it can be inline in JournalPage.jsx. No need for a separate file unless it will be reused elsewhere (Phase 7 might reuse it — but that phase can extract if needed).

### uiStore Cleanup (SIMPLIFY-04)

Remove from uiStore:
```javascript
// DELETE these lines:
checkinOverlayOpen: false,
morningDismissedDate: readDate('morningDismissedDate'),
eveningDismissedDate: readDate('eveningDismissedDate'),
openCheckinOverlay: () => set({ checkinOverlayOpen: true }),
closeCheckinOverlay: () => set({ checkinOverlayOpen: false }),
dismissMorningPrompt: (dayStartHour) => set({ morningDismissedDate: writeDate('morningDismissedDate', dayStartHour) }),
dismissEveningPrompt: (dayStartHour) => set({ eveningDismissedDate: writeDate('eveningDismissedDate', dayStartHour) }),
```

The `readDate`/`writeDate` helper functions are still used by `rollForwardOfferedDate`, so they stay.

### MorningPrompt Repurpose Decision

MorningPrompt currently shows "What are you committing to today?" and opens the win input overlay. This is check-in-adjacent but actually a productivity nudge, not part of the check-in data flow. However, per user feedback, the check-in flow should be removed entirely. The evening prompt is clearly check-in. The morning prompt triggers win entry, not check-in submission.

**Recommendation:** Remove both prompts. The morning prompt's value is marginal since push notifications (Phase 5) already handle the morning reminder. The in-app prompt only fires if you're already in the app with no wins, which is a narrow window. Removing both simplifies TodayPage significantly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| FAB positioning | Custom position/z-index management | Tailwind `fixed bottom-6 right-6 z-40` | Standard pattern, no conflicts with existing z-50 overlays |
| Streak query | Complex join through check_ins | Direct `wins.completed` query | Simpler, faster, no join needed |
| Check-in note migration | Data migration to move notes | Just drop the feature | Notes were check-in-specific; wins already have title for context |

## Common Pitfalls

### Pitfall 1: Orphaned localStorage Keys
**What goes wrong:** After removing check-in state from uiStore, old localStorage keys (`morningDismissedDate`, `eveningDismissedDate`) persist in users' browsers.
**Why it happens:** `readDate()` in uiStore reads them on init.
**How to avoid:** This is harmless — the keys are never read once the code is removed. No cleanup needed. The `readDate`/`writeDate` helpers stay for `rollForwardOfferedDate`.

### Pitfall 2: Streak Regression
**What goes wrong:** Streak count changes after rewriting from check_ins-based to wins.completed-based query.
**Why it happens:** Historical data may have check_ins records for wins that don't have `completed=true` (or vice versa). The inline toggle (INT-01) sets `wins.completed`, while the old check-in flow wrote to `check_ins`.
**How to avoid:** The current codebase already has inline win completion (Phase v1.1 Phase 2), so `wins.completed` should be the source of truth. The check_ins table may have stale data from the old flow. Using wins.completed is actually more correct going forward.
**Warning signs:** Streak count drops to 0 after deploy. Verify with DevTools seed data.

### Pitfall 3: DayDetail Note Display Removal
**What goes wrong:** Removing check_ins note display without updating test fixtures causes test failures.
**Why it happens:** `DayDetail.test.jsx` fixtures include `check_ins: [{ note: '...' }]` in win objects.
**How to avoid:** Update all test fixtures to remove `check_ins` property from win objects.

### Pitfall 4: FAB Overlapping Bottom Content
**What goes wrong:** FAB covers the last journal entry on short viewports.
**Why it happens:** Fixed position button sits over scrollable content.
**How to avoid:** Add `pb-24` (or similar padding-bottom) to JournalPage's entry list container to ensure content can scroll past the FAB.

### Pitfall 5: Evening Push Notification Copy
**What goes wrong:** Push notification still says "Time for your evening check-in" after check-in is removed.
**Why it happens:** Edge Function has hardcoded message strings.
**How to avoid:** Update the MESSAGES object in `supabase/functions/send-push/index.ts`.

## Code Examples

### useStreak Rewrite
```javascript
// Source: Direct analysis of current useStreak.js
async function fetchStreak() {
  setLoading(true);

  // NEW: Query wins directly instead of check_ins join
  const { data, error } = await supabase
    .from('wins')
    .select('win_date')
    .eq('user_id', USER_ID)
    .eq('completed', true);

  if (cancelled) return;

  let completedDates = new Set();
  if (!error && data) {
    // NEW: Flat access, no nested .wins property
    completedDates = new Set(
      data.map((row) => row.win_date).filter(Boolean)
    );
    // ... rest of while loop stays identical
  }
  // ... journal streak and combined streak logic unchanged
}
```

### DevToolsPanel seedYesterdayComplete Rewrite
```javascript
// Source: Direct analysis of current DevToolsPanel.jsx
async function seedYesterdayComplete() {
  const yesterday = getLocalDateString(new Date(Date.now() - 86400000));
  const wins = Array.from({ length: 3 }, (_, i) => ({
    user_id: USER_ID,
    title: `Dev win ${i + 1}`,
    win_date: yesterday,
    completed: true,  // NEW: set completed directly on wins
  }));
  await supabase.from('wins').insert(wins);
  // REMOVED: check_ins insert block
  onClose();
  window.location.reload();
}
```

### Journal FAB Button
```jsx
// Nothing Phone aesthetic: monochrome, clean, dot-matrix influence
<button
  onClick={() => setShowNewForm(true)}
  aria-label="New journal entry"
  className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-foreground text-background shadow-sm hover:scale-105 active:scale-95 transition-transform duration-100"
>
  <Plus size={24} strokeWidth={1.5} />
</button>
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest + jsdom |
| Config file | `vitest.config.js` |
| Quick run command | `mise exec -- npx vitest run --reporter=verbose` |
| Full suite command | `mise exec -- npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SIMPLIFY-05 | Streak uses wins.completed not check_ins | unit | `mise exec -- npx vitest run src/hooks/useStreak.test.js -x` | Yes (needs update) |
| SIMPLIFY-06 | useHistory drops check_ins join | unit | `mise exec -- npx vitest run src/hooks/useHistory.test.js -x` | Yes (needs update) |
| SIMPLIFY-07 | DayDetail renders without check_ins data | unit | `mise exec -- npx vitest run src/components/history/DayDetail.test.jsx -x` | Yes (needs update) |
| SIMPLIFY-10 | TodayPage renders without check-in UI | unit | `mise exec -- npx vitest run src/pages/TodayPage.test.jsx -x` | Yes (needs update) |
| FAB-01 | Journal FAB renders and is clickable | manual-only | N/A | N/A (visual) |

### Sampling Rate
- **Per task commit:** `mise exec -- npx vitest run --reporter=verbose`
- **Per wave merge:** `mise exec -- npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. Tests need updating (mock shapes, removed imports) but no new test files are needed.

## Open Questions

1. **Should we create a DB migration to drop the check_ins table?**
   - What we know: The table will no longer be queried by application code after this phase.
   - What's unclear: Whether to keep it for data preservation or drop it.
   - Recommendation: Do NOT drop the table in this phase. Leave it in place. The app simply stops querying it. A future cleanup migration can drop it once we're confident the data isn't needed. This keeps the phase reversible.

2. **Should MorningPrompt be kept as a standalone feature?**
   - What we know: It's a productivity nudge, not strictly "check-in." But user said "remove check-in entirely."
   - What's unclear: Whether the morning prompt has value independent of check-in.
   - Recommendation: Remove both prompts. Push notifications (Phase 5) cover the reminder use case. Simplification is the goal.

3. **Should the evening push notification be removed or just re-worded?**
   - What we know: The evening push says "Time for your evening check-in." The morning push says "What's the grind for today?"
   - What's unclear: Whether evening reminders still have value.
   - Recommendation: Keep the evening push but re-word to "Time to reflect on your day" or similar. Journal writing is the evening activity now.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of all files listed above
- Supabase migrations 001, 003 confirming check_ins schema and wins.completed column

### Secondary (MEDIUM confidence)
- [Nothing Phone Glyph Matrix design coverage](https://design-milk.com/the-nothing-phone-3s-glyph-matrix-turns-notifications-into-pixel-art/) - dot-matrix aesthetic reference
- [Nothing Phone 3 Glyph hands-on](https://www.engadget.com/mobile/smartphones/nothing-phone-3-hands-on-dot-matrix-glyph-flagship-phone-173019742.html) - monochrome UI patterns

## Metadata

**Confidence breakdown:**
- Check-in removal: HIGH - complete codebase analysis, every reference identified
- Streak rewrite: HIGH - simple query change, data shape well understood
- FAB design: HIGH - standard CSS pattern, nothing novel, project already uses Nothing aesthetic
- Edge cases: MEDIUM - streak regression risk depends on historical data state

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable — no external dependencies changing)
