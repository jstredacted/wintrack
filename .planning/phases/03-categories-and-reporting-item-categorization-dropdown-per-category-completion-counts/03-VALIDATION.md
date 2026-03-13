---
phase: 03
slug: categories-and-reporting-item-categorization-dropdown-per-category-completion-counts
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 03 — Validation Strategy

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
| 03-01-01 | 01 | 0 | CAT-05 | unit | `mise exec -- bun run test --run src/components/wins/CategorySummary.test.jsx` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | CAT-01 | unit | `mise exec -- bun run test --run src/components/wins/WinInputOverlay.test.jsx` | ✅ extend | ⬜ pending |
| 03-01-03 | 01 | 1 | CAT-02 | unit | `mise exec -- bun run test --run src/hooks/useWins.test.js` | ✅ extend | ⬜ pending |
| 03-01-04 | 01 | 1 | CAT-03 | unit | `mise exec -- bun run test --run src/components/wins/WinCard.test.jsx` | ✅ extend | ⬜ pending |
| 03-01-05 | 01 | 1 | CAT-04 | unit | `mise exec -- bun run test --run src/components/history/DayDetail.test.jsx` | ✅ extend | ⬜ pending |
| 03-02-01 | 02 | 1 | CAT-05 | unit | `mise exec -- bun run test --run src/components/wins/CategorySummary.test.jsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/wins/CategorySummary.test.jsx` — stubs for CAT-05 (new component, new test file)
- [ ] DB migration `supabase/migrations/004_add_category_to_wins.sql` — required before Supabase integration

*Existing test files cover all other phase requirements — they need new test cases added, not created from scratch.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Category selector button row visual layout | CAT-01 | Visual alignment and spacing | Open WinInputOverlay, verify button-row renders like journal category selector |
| Category badge color and suppression | CAT-03 | Visual styling | Create wins with different categories, verify badge appears/hides correctly |
| CategorySummary visual rendering | CAT-05 | Layout and typography | Add wins in multiple categories, verify per-category counts render correctly on TodayPage |
| Timeline category badge in history | CAT-04 | Visual alignment | Navigate to history, verify category badges appear in DayDetail timeline items |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
