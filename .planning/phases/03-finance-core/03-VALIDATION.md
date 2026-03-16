---
phase: 03
slug: finance-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x |
| **Config file** | vitest.config.ts |
| **Quick run command** | `bun run test -- --run` |
| **Full suite command** | `bun run test -- --run` |
| **Estimated runtime** | ~12 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bun run test -- --run`
- **After every plan wave:** Run `bun run test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 12 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | BAL-01..05, BUD-01 | unit | `bun run test -- --run src/hooks/useFinance.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | INC-01..06 | unit | `bun run test -- --run src/hooks/useIncomeStreams.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | BAL-01, BAL-02, BUD-02 | unit | `bun run test -- --run src/components/finance/BalanceHero.test.tsx` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | INC-03..05 | unit | `bun run test -- --run src/components/finance/IncomeCard.test.tsx` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 2 | FIN-01 | unit | `bun run test -- --run src/components/finance/MonthStrip.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/useFinance.test.ts` — stubs for balance, budget, month queries
- [ ] `src/hooks/useIncomeStreams.test.ts` — stubs for income source config + toggle received
- [ ] `src/components/finance/BalanceHero.test.tsx` — stubs for balance display + inline edit
- [ ] `src/components/finance/IncomeCard.test.tsx` — stubs for income card toggle + collapse
- [ ] `src/components/finance/MonthStrip.test.tsx` — stubs for month navigation

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Circular gauge renders correctly | BUD-02 | SVG visual | Inspect gauge at different budget percentages |
| MonthStrip scroll centering | FIN-01 | Scroll behavior | Navigate between months, verify centering |
| Tap-to-edit balance | BAL-02 | Touch interaction | Tap balance number, type new amount, press enter |
| Wise/PayPal conversion display | INC-04 | Network + visual | Toggle income received, verify PHP amount shown |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 12s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
