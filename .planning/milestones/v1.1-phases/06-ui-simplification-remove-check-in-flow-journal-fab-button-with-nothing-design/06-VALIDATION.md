---
phase: 6
slug: ui-simplification-remove-check-in-flow-journal-fab-button-with-nothing-design
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + jsdom |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `mise exec -- npx vitest run --reporter=verbose` |
| **Full suite command** | `mise exec -- npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `mise exec -- npx vitest run --reporter=verbose`
- **After every plan wave:** Run `mise exec -- npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | SIMPLIFY-01 | unit | `mise exec -- npx vitest run --reporter=verbose` | ✅ (delete test too) | ⬜ pending |
| 06-01-02 | 01 | 1 | SIMPLIFY-02 | unit | `mise exec -- npx vitest run --reporter=verbose` | ✅ (delete tests too) | ⬜ pending |
| 06-01-03 | 01 | 1 | SIMPLIFY-03 | unit | `mise exec -- npx vitest run --reporter=verbose` | ✅ (delete test too) | ⬜ pending |
| 06-01-04 | 01 | 1 | SIMPLIFY-04 | unit | `mise exec -- npx vitest run --reporter=verbose` | ✅ | ⬜ pending |
| 06-01-05 | 01 | 1 | SIMPLIFY-05 | unit | `mise exec -- npx vitest run src/hooks/useStreak.test.js -x` | ✅ (needs update) | ⬜ pending |
| 06-01-06 | 01 | 1 | SIMPLIFY-06 | unit | `mise exec -- npx vitest run src/hooks/useHistory.test.js -x` | ✅ (needs update) | ⬜ pending |
| 06-01-07 | 01 | 1 | SIMPLIFY-07 | unit | `mise exec -- npx vitest run src/components/history/DayDetail.test.jsx -x` | ✅ (needs update) | ⬜ pending |
| 06-01-08 | 01 | 1 | SIMPLIFY-08 | unit | `mise exec -- npx vitest run --reporter=verbose` | ✅ | ⬜ pending |
| 06-01-09 | 01 | 1 | SIMPLIFY-09 | manual | N/A (Edge Function) | N/A | ⬜ pending |
| 06-01-10 | 01 | 1 | SIMPLIFY-10 | unit | `mise exec -- npx vitest run src/pages/TodayPage.test.jsx -x` | ✅ (needs update) | ⬜ pending |
| 06-02-01 | 02 | 1 | FAB-01 | unit+manual | `mise exec -- npx vitest run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 1 | FAB-02 | manual | Visual verification | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Tests need updating (mock shapes, removed imports) but no new test files are needed except:

- [ ] `src/components/journal/JournalFab.test.jsx` — stubs for FAB-01

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Journal FAB visual appearance | FAB-01 | Nothing dot-matrix aesthetic is visual | Verify circular button, lower-right fixed position, monochrome, + icon |
| Journal FAB opens editor | FAB-02 | Navigation/overlay trigger | Click FAB, verify journal editor opens |
| Edge Function evening copy | SIMPLIFY-09 | Deployed function | Check Edge Function source for updated wording |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
