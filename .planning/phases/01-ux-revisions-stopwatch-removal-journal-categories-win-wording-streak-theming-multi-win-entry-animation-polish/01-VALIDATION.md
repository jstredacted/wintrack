---
phase: 1
slug: ux-revisions-stopwatch-removal-journal-categories-win-wording-streak-theming-multi-win-entry-animation-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.js |
| **Quick run command** | `mise exec -- npx vitest run --reporter=verbose` |
| **Full suite command** | `mise exec -- npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `mise exec -- npx vitest run --reporter=verbose`
- **After every plan wave:** Run `mise exec -- npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | TBD | TBD | TBD | TBD | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test stubs for stopwatch removal (verify timer code is inactive)
- [ ] Test stubs for journal categories (DB migration, UI selector)
- [ ] Test stubs for multi-win entry (overlay stays open, batch submit)
- [ ] Test stubs for streak icon theming (Lucide icon renders, no emoji)
- [ ] Test stubs for dev tools (gated behind import.meta.env.DEV)

*Updated after planner creates PLAN.md files with specific task IDs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Animation smoothness | Streak celebration polish | Visual timing perception | Trigger streak increment, verify overlay shows "on a roll" text, stays until click |
| Win wording UX | Copy change | Subjective copy review | Open win input, verify new wording feels intentional not past-tense |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
