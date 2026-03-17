---
title: Night owl dayStartHour bugs — heatmap NaN, rollover ignoring completed wins after midnight
area: daystrip/heatmap/rollover
priority: high
created: 2026-03-17
---

## Bug Description

Multiple issues with the `dayStartHour` offset (set to 3am):

### 1. Consistency heatmap shows "NaN wins completed in the last 84 days"
- The heatmap total wins counter displays NaN
- Likely the completionMap data doesn't align with the dayStartHour offset, causing numeric calculation to fail

### 2. Win completion recording affected by dayStartHour
- Wins completed between 12am and 3am may not be correctly attributed to the "current day" (which should still be the previous calendar day per dayStartHour=3)
- This affects the consistency heatmap intensity shading

### 3. Rollover prompts for already-completed wins
- Wins marked as completed after 12am but before 3am (the day boundary) are being treated as incomplete by the rollover logic
- Rollover asks to carry forward wins that were already completed
- Expected: wins completed before dayStartHour boundary should count as completed for that "logical day"

## Related Issue

Also related to the DayStrip date mismatch bug (see `daystrip-date-mismatch.md`) — both stem from inconsistent dayStartHour offset application across different parts of the app.

## Context

- User's `dayStartHour` is set to 3 (3:00 AM)
- All three bugs share the same root cause: dayStartHour offset not consistently applied in useHistory completionMap, ConsistencyGraph calculations, and rollover logic in useWins
