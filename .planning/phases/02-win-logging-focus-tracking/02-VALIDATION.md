---
phase: 2
slug: win-logging-focus-tracking
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (already installed) |
| **Config file** | `vitest.config.js` (exists — jsdom environment, setupFiles: test-setup.js) |
| **Quick run command** | `npx vitest run src/hooks/ src/components/wins/ --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/hooks/ src/components/wins/ --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 0 | TIMER-01, TIMER-02 | unit | `npx vitest run src/hooks/useStopwatch.test.js -x` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 0 | WIN-01 | unit (RTL) | `npx vitest run src/components/wins/WinInputOverlay.test.jsx -x` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 0 | WIN-02, WIN-03 | unit (RTL) | `npx vitest run src/components/wins/WinCard.test.jsx -x` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 0 | WIN-04 | unit (RTL) | `npx vitest run src/components/wins/RollForwardPrompt.test.jsx -x` | ❌ W0 | ⬜ pending |
| 02-01-05 | 01 | 0 | TIMER-03 | unit (RTL) | `npx vitest run src/components/wins/TotalFocusTime.test.jsx -x` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | TIMER-01, TIMER-02 | unit | `npx vitest run src/hooks/useStopwatch.test.js -x` | ✅ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | WIN-01 | unit (RTL) | `npx vitest run src/components/wins/WinInputOverlay.test.jsx -x` | ✅ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | WIN-01 | manual | Visual: full-screen overlay + AnimatePresence animation | manual | ⬜ pending |
| 02-03-01 | 03 | 1 | WIN-02, WIN-03 | unit (RTL) | `npx vitest run src/components/wins/WinCard.test.jsx -x` | ✅ W0 | ⬜ pending |
| 02-03-02 | 03 | 1 | WIN-04 | unit (RTL) | `npx vitest run src/components/wins/RollForwardPrompt.test.jsx -x` | ✅ W0 | ⬜ pending |
| 02-04-01 | 04 | 2 | TIMER-01, TIMER-02 | unit | `npx vitest run src/hooks/useStopwatch.test.js -x` | ✅ W0 | ⬜ pending |
| 02-04-02 | 04 | 2 | TIMER-01 | manual | Visual: start/pause/stop buttons render correct state | manual | ⬜ pending |
| 02-05-01 | 05 | 2 | TIMER-03 | unit (RTL) | `npx vitest run src/components/wins/TotalFocusTime.test.jsx -x` | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/useStopwatch.test.js` — stubs for TIMER-01, TIMER-02 (wall-clock arithmetic, refresh recovery)
- [ ] `src/components/wins/WinInputOverlay.test.jsx` — stubs for WIN-01 (render, submit, Escape)
- [ ] `src/components/wins/WinCard.test.jsx` — stubs for WIN-02 (edit), WIN-03 (delete)
- [ ] `src/components/wins/RollForwardPrompt.test.jsx` — stubs for WIN-04 (prompt rendering, confirm/dismiss callbacks)
- [ ] `src/components/wins/TotalFocusTime.test.jsx` — stubs for TIMER-03 (sum with live timer)
- [ ] Install `motion` and `zustand` packages

*All test files are Wave 0 gaps — must be created before implementation waves.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full-screen overlay animates in/out (AnimatePresence) | WIN-01 | AnimatePresence exit animations require real browser; JSDOM doesn't render CSS transitions | Open app, click "Add Win", verify overlay slides in; press Escape, verify it slides out |
| Start/pause/stop buttons render correct visual state | TIMER-01 | Button icon/label state changes require visual inspection | Start timer: verify pause+stop icons appear; pause: verify play+stop icons; stop: verify play-only |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
