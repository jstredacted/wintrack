---
phase: 04
slug: finance-extended
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x |
| **Config file** | vitest.config.ts |
| **Quick run command** | `bun run test -- --run` |
| **Full suite command** | `bun run test -- --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bun run test -- --run`
- **After every plan wave:** Run `bun run test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | BILL-01..04, HIST-01, ONEOFF-01 | unit | `bun run test -- --run src/hooks/useBills.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | HIST-01..04 | unit | `bun run test -- --run src/hooks/useBalanceHistory.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | BILL-01..07 | unit | `bun run test -- --run src/components/finance/BillRow.test.tsx` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | HIST-02..04, ONEOFF-01..04 | unit | `bun run test -- --run src/components/finance/BalanceHistoryModal.test.tsx` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 3 | FIN-02 | manual | Visual inspection of SVG step chart | N/A | ⬜ pending |
| 04-03-02 | 03 | 3 | FIN-03, FIN-04 | unit | `bun run test -- --run src/hooks/useMonthView.test.ts` | ❌ W0 | ⬜ pending |
| 04-04-01 | 04 | 4 | FIN-05, ONEOFF-03 | manual | Visual inspection of year overview | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/useBills.test.ts` — stubs for bill CRUD, paid toggle, recurrence
- [ ] `src/hooks/useBalanceHistory.test.ts` — stubs for history logging, revert
- [ ] `src/components/finance/BillRow.test.tsx` — stubs for compact row rendering
- [ ] `src/components/finance/BalanceHistoryModal.test.tsx` — stubs for history modal
- [ ] `src/hooks/useMonthView.test.ts` — stubs for past/future month data

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Waterfall step chart SVG | FIN-02 | Visual rendering | Verify stepped balance line in current month |
| Year overview 12-column layout | FIN-05 | Visual layout | Navigate to /finance/year, verify columns |
| One-off income progress bar extension | ONEOFF-03 | SVG visual | Add one-off income, verify bar extends |
| Bill urgency border + text | BILL-05 | Visual urgency | Add bill with near due date, verify indicators |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
