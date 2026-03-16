---
title: DayStrip/header date mismatch with dayStartHour offset
area: daystrip
priority: high
created: 2026-03-17
---

## Bug Description

With `dayStartHour=3`, the DayStrip and header date are misaligned:

- **DayStrip** shows Tuesday, March 17 as the current/rightmost day
- **Header** shows Monday, March 16
- Clicking **Monday, March 16** in the DayStrip causes the header to show **Sunday, March 15**

There's an off-by-one error in how the `dayStartHour` offset is applied between:
1. DayStrip date cell generation (which dates appear in the strip)
2. TodayPage selected date display (header text)
3. The date passed when a DayStrip cell is clicked

## Screenshots

- Screenshot 1: Header says "Monday, March 16" but DayStrip highlights Tue 17
- Screenshot 2: Clicking Mon 16 in strip → header shows "Sunday, March 15" with "No wins for this day"

## Context

- User's `dayStartHour` is set to 3 (3:00 AM)
- Bug observed at ~2:38 AM local time (before the 3 AM boundary)
- Likely the DayStrip doesn't apply the dayStartHour offset when generating date cells, but TodayPage does when displaying the selected date
