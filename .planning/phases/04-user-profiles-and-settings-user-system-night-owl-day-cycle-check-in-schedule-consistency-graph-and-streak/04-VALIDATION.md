---
phase: 04
slug: user-profiles-and-settings-user-system-night-owl-day-cycle-check-in-schedule-consistency-graph-and-streak
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (with @testing-library/react, @testing-library/user-event) |
| **Config file** | vitest.config.js |
| **Quick run command** | `mise exec -- bun run test --run` |
| **Full suite command** | `mise exec -- bun run test --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `mise exec -- bun run test --run`
- **After every plan wave:** Run `mise exec -- bun run test --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | SETTINGS-01 | unit | `mise exec -- bun run test --run src/hooks/useSettings.test.js` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | SETTINGS-02 | unit | `mise exec -- bun run test --run src/stores/settingsStore.test.js` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | NIGHTOWL-01 | unit | `mise exec -- bun run test --run src/lib/utils/date.test.js` | ✅ extend | ⬜ pending |
| 04-02-02 | 02 | 2 | NIGHTOWL-02 | unit | `mise exec -- bun run test --run src/hooks/useStreak.test.js` | ✅ extend | ⬜ pending |
| 04-03-01 | 03 | 2 | SETTINGSUI-01 | unit | `mise exec -- bun run test --run src/pages/SettingsPage.test.jsx` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 2 | HEATMAP-01 | unit | `mise exec -- bun run test --run src/components/history/ConsistencyGraph.test.jsx` | ❌ W0 | ⬜ pending |
| 04-03-03 | 03 | 2 | SCHEDULE-01 | unit | `mise exec -- bun run test --run src/pages/TodayPage.test.jsx` | ✅ extend | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/useSettings.test.js` — stubs for SETTINGS-01 (new hook)
- [ ] `src/stores/settingsStore.test.js` — stubs for SETTINGS-02 (new store)
- [ ] `src/components/history/ConsistencyGraph.test.jsx` — stubs for HEATMAP-01 (new component)
- [ ] `src/pages/SettingsPage.test.jsx` — stubs for SETTINGSUI-01 (new page)
- [ ] DB migration `005_user_settings.sql` — required before Supabase integration

*Existing test files cover NIGHTOWL-01, NIGHTOWL-02, SCHEDULE-01 — they need new test cases added.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Night owl boundary at 3am shows previous day's wins | NIGHTOWL-01 | Requires real clock manipulation | Set dayStartHour to 4, open app at 3am (or mock), verify "today" shows previous calendar date |
| ConsistencyGraph visual heatmap layout | HEATMAP-01 | Visual grid alignment | Open settings/stats page, verify 84-day grid renders with correct colors |
| Settings form layout and interactions | SETTINGSUI-01 | Visual styling | Open settings page, verify form fields, change values, verify save persists |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
