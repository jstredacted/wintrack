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

- [ ] **JOURNAL-01**: User can write a daily journal entry with a title and body
- [ ] **JOURNAL-02**: User can edit or delete past journal entries
- [ ] **JOURNAL-03**: User can browse past journal entries in a list view

### Streaks & History

- [x] **STREAK-01**: App displays a streak counter for consecutive days where at least one win was marked complete
- [ ] **HISTORY-01**: User can browse past days' wins and their completion status
- [ ] **HISTORY-02**: App shows a visual calendar / heatmap of days with completed wins

### App Shell

- [x] **SHELL-01**: User can toggle between dark and light mode
- [x] **SHELL-02**: App uses the Nothing Phone Glyph Matrix design language — dot grid patterns, monospaced type, structured negative space, strictly black and white palette

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
| Win categories / tags | Deliberately minimal — freeform text only |
| Journal tags / categories | No distractions, no taxonomy |
| AI coaching or suggestions | Out of scope for this product's character |
| Social / sharing | Personal accountability tool, not social |
| Pomodoro timer | Different feature set; timer is per-win, not timed sessions |
| Mobile app | Web-first; Vercel deployment covers mobile browser |
| Streak freeze / grace mechanics | Roll-forward wins is the compassion mechanism |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| WIN-01 | Phase 2 | Complete |
| WIN-02 | Phase 2 | Complete |
| WIN-03 | Phase 2 | Complete |
| WIN-04 | Phase 2 | Complete |
| CHECKIN-01 | Phase 3 | Complete |
| CHECKIN-02 | Phase 3 | Complete |
| CHECKIN-03 | Phase 3 | Complete |
| CHECKIN-04 | Phase 3 | Complete |
| TIMER-01 | Phase 2 | Complete |
| TIMER-02 | Phase 2 | Complete |
| TIMER-03 | Phase 2 | Complete |
| JOURNAL-01 | Phase 4 | Pending |
| JOURNAL-02 | Phase 4 | Pending |
| JOURNAL-03 | Phase 4 | Pending |
| STREAK-01 | Phase 3 | Complete |
| HISTORY-01 | Phase 4 | Pending |
| HISTORY-02 | Phase 4 | Pending |
| SHELL-01 | Phase 1 | In progress (test stubs created in 01-01; implementation in 01-04) |
| SHELL-02 | Phase 1 | In progress (test stubs created in 01-01; implementation in 01-02) |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-09 — SHELL-01 and SHELL-02 test stubs created in 01-01*
