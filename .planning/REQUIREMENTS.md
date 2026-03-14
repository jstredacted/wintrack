# Requirements: wintrack

**Defined:** 2026-03-09
**Core Value:** The daily discipline loop: declare wins in the morning, complete them through the day, evaluate honestly at night.

## v1 Requirements

### Win Logging

- [x] **WIN-01**: User can create a win using a full-screen Typeform-style input flow (one prompt at a time, animated transitions between steps)
- [x] **WIN-02**: User can edit the text of an existing win
- [x] **WIN-03**: User can delete a win from today's list
- [x] **WIN-04**: User can roll incomplete wins from yesterday into today's list

### Check-ins

- [x] **CHECKIN-01**: User can complete an evening check-in — binary yes/no per win with optional short reflection note
- [x] **CHECKIN-02**: App shows an in-app morning prompt at 9am if no wins have been logged yet for today
- [x] **CHECKIN-03**: App shows an in-app evening prompt at 9pm if the evening check-in has not been completed
- [x] **CHECKIN-04**: App sends browser push notifications at 9am and 9pm as reminders

### Time Tracking

- [x] **TIMER-01**: User can start, stop, and pause a stopwatch for any win
- [x] **TIMER-02**: Cumulative time logged for a win is displayed on its win card
- [x] **TIMER-03**: Today view shows total focused time across all wins for the day

### Journal

- [x] **JOURNAL-01**: User can write a daily journal entry with a title and body
- [x] **JOURNAL-02**: User can edit or delete past journal entries
- [x] **JOURNAL-03**: User can browse past journal entries in a list view

### Streaks & History

- [x] **STREAK-01**: App displays a streak counter for consecutive days where at least one win was marked complete
- [x] **HISTORY-01**: User can browse past days' wins and their completion status
- [x] **HISTORY-02**: App shows a visual calendar / heatmap of days with completed wins

### App Shell

- [x] **SHELL-01**: User can toggle between dark and light mode
- [x] **SHELL-02**: App uses the Nothing Phone Glyph Matrix design language — dot grid patterns, monospaced type, structured negative space, strictly black and white palette

## v1.1 Requirements

### UX Revisions (Phase 1)

- [x] **UX-01**: Stopwatch feature is removed from the UI (code commented out, not deleted)
- [x] **UX-02**: DB migration drops timer columns from wins table
- [x] **UX-03**: Win entry wording changed from "Log a win" to intention-oriented language ("Set intentions")
- [x] **UX-04**: Win input overlay supports multi-win entry (stays open after submit, shows submitted list, Done to close)
- [x] **UX-05**: Journal entries have categories (Daily, Milestone, Financial) with selector in editor and badge on cards
- [x] **UX-06**: Streak display uses monochrome Lucide Flame icon instead of fire emoji
- [x] **UX-07**: Streak celebration requires explicit click to dismiss (no auto-close), shows "You're on a roll" messaging
- [x] **UX-08**: Dev tools panel accessible via Ctrl+Shift+D for test data seeding and clearing (dev mode only)

### Win Interactions (Phase 2)

- **INT-01**: User can mark a win as complete/incomplete inline on the Today page via always-visible toggle button
- **INT-02**: Completed wins show line-through text styling and muted foreground color
- **INT-03**: Toggle persists to Supabase with optimistic update and error rollback

### Timeline Display (Phase 2)

- **TIMELINE-01**: History DayDetail renders as a vertical dot-and-line timeline (no timestamps)
- **TIMELINE-02**: Completed wins show filled dot and left-border accent; incomplete wins show hollow dot and muted border

### Win Categories (Phase 3)

- **CAT-01**: User can assign a category (work/personal/health) to a win when creating it via button-row selector in WinInputOverlay
- **CAT-02**: Category persists to Supabase wins table with DB migration adding category column
- **CAT-03**: Category badge is visible on WinCard in TodayPage (suppressed for default 'work')
- **CAT-04**: Category badge is visible on TimelineItem in DayDetail history view
- **CAT-05**: TodayPage shows per-category completion counts when multiple categories are in use

### User Settings (Phase 4)

- **SETTINGS-01**: User settings persist to Supabase user_settings table with defaults (single row per user)
- **SETTINGS-02**: Settings load from localStorage cache on mount for instant availability (no flash)
- **NIGHTOWL-01**: getLocalDateString respects a configurable dayStartHour offset (e.g., 4am = wins at 2am count as previous day)
- **NIGHTOWL-02**: Streak calculation (useStreak) correctly handles night-owl day offset
- **NIGHTOWL-03**: useWins fetches correct "today" and "yesterday" wins with day offset applied
- **SCHEDULE-01**: Morning and evening prompt hours are configurable via settings (not hardcoded 9am/9pm)
- **HEATMAP-01**: App shows a GitHub-style 84-day consistency heatmap with colored cells for completed days
- **SETTINGSUI-01**: User can access a Settings page from SideNav to configure day boundary, prompt hours, and view consistency graph

### Push Notifications (Phase 5)

- **PUSH-01**: Service worker registers at root scope and handles push events (displays notification with title, body, tag)
- **PUSH-02**: Client subscribes to Web Push API and stores subscription (endpoint, p256dh, auth) in Supabase push_subscriptions table
- **PUSH-03**: Notification permission UI shows current state (enabled/disabled/blocked) with toggle on Settings page
- **PUSH-04**: Notification stubs in notifications.js replaced with real push subscription wiring
- **PUSH-05**: Settings page shows notification toggle section with contextual link to morning/evening hour settings
- **PUSH-06**: Supabase Edge Function sends web push messages to stored subscriptions using VAPID authentication
- **PUSH-07**: pg_cron triggers Edge Function hourly; function reads user_settings to determine whether to send at current hour

## v2 Requirements

### Notifications

- **NOTIF-01**: Configurable notification times (user sets preferred 9am/9pm window)
- **NOTIF-02**: Notification for streak at risk (approaching midnight with no check-in)

### Wins

- **WIN-V2-01**: Win templates / recurring wins
- **WIN-V2-02**: Reorder wins by drag

### Journal

- **JOURNAL-V2-01**: Full-text search across journal entries

### Analytics

- **ANALYTICS-01**: Weekly / monthly summary stats (avg wins per day, completion rate, total focus time)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-user / auth | Personal tool — single user, no accounts |
| AI coaching or suggestions | Out of scope for this product's character |
| Social / sharing | Personal accountability tool, not social |
| Pomodoro timer | Different feature set; timer is per-win, not timed sessions |
| Mobile app | Web-first; Vercel deployment covers mobile browser |
| Streak freeze / grace mechanics | Roll-forward wins is the compassion mechanism |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| WIN-01 | v1.0 Phase 2 | Complete |
| WIN-02 | v1.0 Phase 2 | Complete |
| WIN-03 | v1.0 Phase 2 | Complete |
| WIN-04 | v1.0 Phase 2 | Complete |
| CHECKIN-01 | v1.0 Phase 3 | Complete |
| CHECKIN-02 | v1.0 Phase 3 | Complete |
| CHECKIN-03 | v1.0 Phase 3 | Complete |
| CHECKIN-04 | v1.0 Phase 3 | Complete |
| TIMER-01 | v1.0 Phase 2 | Complete |
| TIMER-02 | v1.0 Phase 2 | Complete |
| TIMER-03 | v1.0 Phase 2 | Complete |
| JOURNAL-01 | v1.0 Phase 4 | Complete |
| JOURNAL-02 | v1.0 Phase 4 | Complete |
| JOURNAL-03 | v1.0 Phase 4 | Complete |
| STREAK-01 | v1.0 Phase 3 | Complete |
| HISTORY-01 | v1.0 Phase 4 | Complete |
| HISTORY-02 | v1.0 Phase 4 | Complete |
| SHELL-01 | v1.0 Phase 1 | Complete |
| SHELL-02 | v1.0 Phase 1 | Complete |
| UX-01 | v1.1 Phase 1 | Planned |
| UX-02 | v1.1 Phase 1 | Planned |
| UX-03 | v1.1 Phase 1 | Planned |
| UX-04 | v1.1 Phase 1 | Planned |
| UX-05 | v1.1 Phase 1 | Planned |
| UX-06 | v1.1 Phase 1 | Planned |
| UX-07 | v1.1 Phase 1 | Planned |
| UX-08 | v1.1 Phase 1 | Planned |
| INT-01 | v1.1 Phase 2 | Planned |
| INT-02 | v1.1 Phase 2 | Planned |
| INT-03 | v1.1 Phase 2 | Planned |
| TIMELINE-01 | v1.1 Phase 2 | Planned |
| TIMELINE-02 | v1.1 Phase 2 | Planned |
| CAT-01 | v1.1 Phase 3 | Planned |
| CAT-02 | v1.1 Phase 3 | Planned |
| CAT-03 | v1.1 Phase 3 | Planned |
| CAT-04 | v1.1 Phase 3 | Planned |
| CAT-05 | v1.1 Phase 3 | Planned |
| SETTINGS-01 | v1.1 Phase 4 | Planned |
| SETTINGS-02 | v1.1 Phase 4 | Planned |
| NIGHTOWL-01 | v1.1 Phase 4 | Planned |
| NIGHTOWL-02 | v1.1 Phase 4 | Planned |
| NIGHTOWL-03 | v1.1 Phase 4 | Planned |
| SCHEDULE-01 | v1.1 Phase 4 | Planned |
| HEATMAP-01 | v1.1 Phase 4 | Planned |
| SETTINGSUI-01 | v1.1 Phase 4 | Planned |
| PUSH-01 | v1.1 Phase 5 | Planned |
| PUSH-02 | v1.1 Phase 5 | Planned |
| PUSH-03 | v1.1 Phase 5 | Planned |
| PUSH-04 | v1.1 Phase 5 | Planned |
| PUSH-05 | v1.1 Phase 5 | Planned |
| PUSH-06 | v1.1 Phase 5 | Planned |
| PUSH-07 | v1.1 Phase 5 | Planned |

**Coverage:**
- v1 requirements: 19 total — 19 complete
- v1.1 requirements: 33 total — 8 complete, 25 planned
- v2 requirements: 5 total — unmapped (future)

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-14 — v1.1 Phase 5 requirements added (PUSH-01..07)*
