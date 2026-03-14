---
phase: 7
slug: unified-daily-view-merge-today-and-history-pages-with-daystrip-carousel-navigation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + jsdom + @testing-library/react |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `bunx vitest run --reporter=verbose` |
| **Full suite command** | `bunx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bunx vitest run --reporter=verbose`
- **After every plan wave:** Run `bunx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | UNIFIED-01 | unit | `bunx vitest run src/pages/TodayPage.test.jsx -t "DayStrip"` | Will update existing | ⬜ pending |
| 07-01-02 | 01 | 1 | UNIFIED-02 | unit | `bunx vitest run src/pages/TodayPage.test.jsx -t "editable"` | Will update existing | ⬜ pending |
| 07-01-03 | 01 | 1 | UNIFIED-03 | unit | `bunx vitest run src/pages/TodayPage.test.jsx -t "history"` | Will update existing | ⬜ pending |
| 07-01-04 | 01 | 1 | UNIFIED-04 | unit | `bunx vitest run src/components/layout/SideNav.test.jsx` | Needs update | ⬜ pending |
| 07-01-05 | 01 | 1 | UNIFIED-05 | unit | `bunx vitest run src/pages/TodayPage.test.jsx -t "completion"` | Will update existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/pages/TodayPage.test.jsx` — needs updating for unified view (DayStrip present, date switching behavior)
- [ ] `src/pages/HistoryPage.jsx` and test — delete or redirect
- [ ] SideNav test may need update if History tab assertion exists

*Existing infrastructure covers framework requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| DayStrip carousel swipe/scroll feel | UNIFIED-01 | Touch interaction UX | Swipe through dates on mobile, verify smooth scroll |
| Visual transition between today/past dates | UNIFIED-03 | Animation smoothness | Select past date, verify content transitions cleanly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
