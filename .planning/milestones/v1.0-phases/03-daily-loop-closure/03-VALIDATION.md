---
phase: 3
slug: daily-loop-closure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + React Testing Library (jsdom) |
| **Config file** | `vitest.config.js` (root) |
| **Quick run command** | `mise exec -- npx vitest run --reporter=verbose` |
| **Full suite command** | `mise exec -- npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `mise exec -- npx vitest run src/hooks/useStreak.test.js src/components/checkin/CheckInOverlay.test.jsx src/components/checkin/MorningPrompt.test.jsx src/components/checkin/EveningPrompt.test.jsx src/hooks/useCheckin.test.js src/lib/notifications.test.js`
- **After every plan wave:** Run `mise exec -- npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-stub-checkin | 01 | 0 | CHECKIN-01 | unit stub | `mise exec -- npx vitest run src/components/checkin/CheckInOverlay.test.jsx` | ❌ W0 | ⬜ pending |
| 03-01-stub-morning | 01 | 0 | CHECKIN-02 | unit stub | `mise exec -- npx vitest run src/components/checkin/MorningPrompt.test.jsx` | ❌ W0 | ⬜ pending |
| 03-01-stub-evening | 01 | 0 | CHECKIN-03 | unit stub | `mise exec -- npx vitest run src/components/checkin/EveningPrompt.test.jsx` | ❌ W0 | ⬜ pending |
| 03-01-stub-notif | 01 | 0 | CHECKIN-04 | unit stub | `mise exec -- npx vitest run src/lib/notifications.test.js` | ❌ W0 | ⬜ pending |
| 03-01-stub-usecheckin | 01 | 0 | CHECKIN-01 | unit stub | `mise exec -- npx vitest run src/hooks/useCheckin.test.js` | ❌ W0 | ⬜ pending |
| 03-01-stub-usestreak | 01 | 0 | STREAK-01 | unit stub | `mise exec -- npx vitest run src/hooks/useStreak.test.js` | ❌ W0 | ⬜ pending |
| 03-02-usestreak | 02 | 1 | STREAK-01 | unit | `mise exec -- npx vitest run src/hooks/useStreak.test.js` | ❌ W0 | ⬜ pending |
| 03-02-usecheckin | 02 | 1 | CHECKIN-01 | unit | `mise exec -- npx vitest run src/hooks/useCheckin.test.js` | ❌ W0 | ⬜ pending |
| 03-02-uistore | 02 | 1 | CHECKIN-02/03 | unit | `mise exec -- npx vitest run src/stores/uiStore.test.js` | ❌ W0 | ⬜ pending |
| 03-02-notifications | 02 | 1 | CHECKIN-04 | unit | `mise exec -- npx vitest run src/lib/notifications.test.js` | ❌ W0 | ⬜ pending |
| 03-03-checkinoverlay | 03 | 2 | CHECKIN-01 | unit | `mise exec -- npx vitest run src/components/checkin/CheckInOverlay.test.jsx` | ❌ W0 | ⬜ pending |
| 03-04-morningprompt | 04 | 2 | CHECKIN-02 | unit | `mise exec -- npx vitest run src/components/checkin/MorningPrompt.test.jsx` | ❌ W0 | ⬜ pending |
| 03-04-eveningprompt | 04 | 2 | CHECKIN-03 | unit | `mise exec -- npx vitest run src/components/checkin/EveningPrompt.test.jsx` | ❌ W0 | ⬜ pending |
| 03-05-integration | 05 | 3 | ALL | unit + manual | `mise exec -- npx vitest run` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/checkin/CheckInOverlay.test.jsx` — stubs for CHECKIN-01 (step flow, yes/no, reflection note, completion screen)
- [ ] `src/components/checkin/MorningPrompt.test.jsx` — stubs for CHECKIN-02 (condition gating, dismissal, callback buttons)
- [ ] `src/components/checkin/EveningPrompt.test.jsx` — stubs for CHECKIN-03 (condition gating, dismissal, callback buttons)
- [ ] `src/lib/notifications.test.js` — stubs for CHECKIN-04 (exports exist, callable without throw)
- [ ] `src/hooks/useCheckin.test.js` — stubs for CHECKIN-01 Supabase submission logic
- [ ] `src/hooks/useStreak.test.js` — stubs for STREAK-01 (all streak computation cases including timezone)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Overlay slide animation feels smooth | CHECKIN-01 | jsdom doesn't run CSS keyframe animations | Open app, start check-in, verify slide-up from bottom |
| Step-to-step crossfade inside check-in | CHECKIN-01 | motion/react animations don't run in jsdom | Step through wins, verify crossfade between each |
| Completion screen tally is correct | CHECKIN-01 | End-to-end user flow with real data | Complete check-in with N wins, verify "X of N" tally |
| Morning prompt appears at correct time | CHECKIN-02 | Time-of-day condition requires real clock or time mocking | Test at 9am with no wins logged, or mock Date.getHours |
| Evening prompt appears at correct time | CHECKIN-03 | Time-of-day condition requires real clock | Test at 9pm with wins but no check-in, or mock Date.getHours |
| Streak counter visible in header | STREAK-01 | Layout/spacing with ThemeToggle — visual only | Open app after completing wins on consecutive days |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
