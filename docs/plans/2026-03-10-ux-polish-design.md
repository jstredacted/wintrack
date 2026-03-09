# Phase 5: UX Polish — Approved Design Doc

**Date**: 2026-03-10
**Status**: Approved — ready for implementation planning

---

## Overview

Phase 5 polishes the visual and interaction quality of wintrack across all four major surfaces: global layout, Timer, Journal, and History/Streak. No new data model changes — purely presentational and UX improvements.

---

## 1. Global Layout

- **Max width**: `max-w-[600px]` centered layout container
- **Typography**: `clamp()`-based fluid monospace sizing across all text elements
- **Icons**: All Lucide icons sized to `size={18}` for visual consistency
- **WinCard list items**: Borderless — remove card borders for a cleaner reading feel

---

## 2. Timer — Full-Screen Focus Overlay

- **Layout**: Full-screen overlay (via `createPortal` to `document.body`), similar to WinInputOverlay pattern
- **Multiple timers**: Bento grid layout for parallel timers (max 3 visible simultaneously)
- **TotalFocusTime animation**: Count-up animation on the total focus time stat when the timer overlay closes (number ticks up to final value)

---

## 3. Journal — Full-Screen Slide-Up Editor

- **Entry form**: Full-screen slide-up editor (replaces inline form)
- **Live word count**: Shown while writing, updates in real time
- **Completion summary screen**: Shown after saving — displays word count + time written as chips before returning to the journal list
- **Transition**: Slide-up enter / slide-down dismiss animation

---

## 4. History — Day-Strip Navigation

- **Replace heatmap**: Remove the 80-cell GitHub-style heatmap
- **Day strip**: Horizontally scrollable strip showing individual days
  - Each day cell: day abbreviation (Mon/Tue/etc.) + date number + checkmark if completed
  - Scrollable so full history is accessible
- **Greeting header**: Time-of-day greeting ("Good morning", "Good afternoon", "Good evening") displayed above the history content

---

## 5. Streak — Dual Stats in Header

- **Replace single number**: Header currently shows one streak number
- **Two streak stats**:
  1. **Wins streak**: consecutive days with ≥1 completed check-in
  2. **Journal streak**: consecutive days with ≥1 journal entry
- **Display**: Both shown in header side by side

---

## Implementation Notes

- Timer overlay follows same `createPortal` + state-machine pattern as `WinInputOverlay`
- Day-strip replaces `src/components/history/` heatmap component(s)
- Journal slide-up editor likely a new component replacing/wrapping `JournalEntryForm`
- Dual streaks require `useJournal` hook to expose a journal streak calculation alongside existing win streak from `useStreak`
- Count-up animation can use CSS animation or a simple `requestAnimationFrame` counter
