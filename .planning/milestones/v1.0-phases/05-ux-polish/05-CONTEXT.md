# Phase 5: UX Polish - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning
**Source:** PRD Express Path (docs/plans/2026-03-10-ux-polish-design.md)

<domain>
## Phase Boundary

Phase 5 polishes the visual and interaction quality across all four major surfaces: global layout, Timer, Journal, and History/Streak. No new data model changes — purely presentational and UX improvements.

</domain>

<decisions>
## Implementation Decisions

### Global Layout
- `max-w-[600px]` centered layout container (locked)
- `clamp()`-based fluid monospace sizing across all text elements (locked)
- All Lucide icons sized to `size={18}` for visual consistency (locked)
- WinCard list items: borderless — remove card borders (locked)

### Timer — Full-Screen Focus Overlay
- Full-screen overlay via `createPortal` to `document.body`, same pattern as WinInputOverlay (locked)
- Bento grid layout for parallel timers, max 3 visible simultaneously (locked)
- Count-up animation on TotalFocusTime stat when timer overlay closes (locked)

### Journal — Full-Screen Slide-Up Editor
- Full-screen slide-up editor replaces inline JournalEntryForm (locked)
- Live word count shown while writing, updates in real time (locked)
- Completion summary screen after saving: word count + time written as chips before returning to list (locked)
- Slide-up enter / slide-down dismiss animation (locked)

### History — Day-Strip Navigation
- Remove 80-cell GitHub-style heatmap (locked)
- Replace with horizontally scrollable day strip (locked)
- Each day cell: day abbreviation (Mon/Tue/etc.) + date number + checkmark if completed (locked)
- Time-of-day greeting header ("Good morning" / "Good afternoon" / "Good evening") above history content (locked)

### Streak — Dual Stats in Header
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

</decisions>

<specifics>
## Specific Ideas

- Timer overlay: follows same `createPortal` + state-machine (visible/exiting/unmounted) pattern as `WinInputOverlay.jsx`
- Day-strip: replaces `src/components/history/` heatmap component(s)
- Journal editor: new component replacing/wrapping current `JournalEntryForm`
- Dual streaks: `useJournal` hook should expose journal streak calculation alongside existing win streak from `useStreak`
- Count-up animation: simple `requestAnimationFrame` counter is acceptable

</specifics>

<deferred>
## Deferred Ideas

- Actual Web Push / service worker delivery (already deferred to v2)
- Any new data model changes — all polish is purely presentational
- More than 3 parallel timers in bento grid

</deferred>

---

*Phase: 05-ux-polish*
*Context gathered: 2026-03-10 via PRD Express Path*
