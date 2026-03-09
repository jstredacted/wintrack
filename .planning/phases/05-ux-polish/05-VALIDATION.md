---
phase: 5
slug: ux-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.js |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test -- --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run`
- **After every plan wave:** Run `npm run test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Feature | Test Type | Automated Command | File Exists | Status |
|---------|------|------|---------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 0 | TimerFocusOverlay stubs | unit | `npm run test -- --run src/components/timer/TimerFocusOverlay.test.jsx` | ❌ W0 | ⬜ pending |
| 5-01-02 | 01 | 0 | JournalEditorOverlay stubs | unit | `npm run test -- --run src/components/journal/JournalEditorOverlay.test.jsx` | ❌ W0 | ⬜ pending |
| 5-01-03 | 01 | 0 | DayStrip stubs | unit | `npm run test -- --run src/components/history/DayStrip.test.jsx` | ❌ W0 | ⬜ pending |
| 5-01-04 | 01 | 0 | useStreak journal streak stubs | unit | `npm run test -- --run src/hooks/useStreak.test.js` | ✅ | ⬜ pending |
| 5-01-05 | 01 | 0 | WinCard borderless stubs | unit | `npm run test -- --run src/components/wins/WinCard.test.jsx` | ✅ | ⬜ pending |
| 5-02-01 | 02 | 1 | AppShell layout container | unit | `npm run test -- --run` | ✅ | ⬜ pending |
| 5-02-02 | 02 | 1 | useStreak journal streak impl | unit | `npm run test -- --run src/hooks/useStreak.test.js` | ✅ | ⬜ pending |
| 5-02-03 | 02 | 1 | WinCard borderless impl | unit | `npm run test -- --run src/components/wins/WinCard.test.jsx` | ✅ | ⬜ pending |
| 5-03-01 | 03 | 2 | TimerFocusOverlay impl | unit | `npm run test -- --run src/components/timer/TimerFocusOverlay.test.jsx` | ❌ W0 | ⬜ pending |
| 5-04-01 | 04 | 2 | JournalEditorOverlay impl | unit | `npm run test -- --run src/components/journal/JournalEditorOverlay.test.jsx` | ❌ W0 | ⬜ pending |
| 5-05-01 | 05 | 3 | DayStrip impl | unit | `npm run test -- --run src/components/history/DayStrip.test.jsx` | ❌ W0 | ⬜ pending |
| 5-05-02 | 05 | 3 | Header dual streaks | unit | `npm run test -- --run src/components/layout/Header.test.jsx` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/timer/TimerFocusOverlay.test.jsx` — stubs for full-screen timer overlay
- [ ] `src/components/journal/JournalEditorOverlay.test.jsx` — stubs for slide-up journal editor + completion summary
- [ ] `src/components/history/DayStrip.test.jsx` — stubs for scrollable day strip replacing heatmap
- [ ] Extension to `src/hooks/useStreak.test.js` — journal streak behavioral contracts
- [ ] Extension to `src/components/wins/WinCard.test.jsx` — borderless rendering assertion

---

## Manual-Only Verifications

| Behavior | Why Manual | Test Instructions |
|----------|------------|-------------------|
| Count-up animation on TotalFocusTime | Animation timing not verifiable in jsdom | Open timer overlay, stop it, observe number animates up to new total |
| Slide-up/slide-down on JournalEditorOverlay | CSS animation in jsdom doesn't run | Open journal editor, verify slide-up; close it, verify slide-down |
| Bento grid layout for 2-3 parallel timers | Visual layout not verifiable in jsdom | Start 2-3 timers, verify grid layout in browser |
| Horizontal scroll on DayStrip | Scroll interaction not fully testable | View History tab with many days, verify horizontal scroll works |
| Time-of-day greeting | Depends on wall clock | Check morning/afternoon/evening at different times (or mock Date) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
