---
phase: 5
slug: journal-rich-text-and-mobile
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (or vite.config.ts with test block) |
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
| 05-01-01 | 01 | 1 | JRNL-01 | integration | `bunx vitest run` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | JRNL-02 | unit | `bunx vitest run` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | JRNL-03 | unit | `bunx vitest run` | ❌ W0 | ⬜ pending |
| 05-01-04 | 01 | 1 | JRNL-04 | integration | `bunx vitest run` | ❌ W0 | ⬜ pending |
| 05-01-05 | 01 | 1 | JRNL-05 | unit | `bunx vitest run` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | MOB-01 | manual | visual inspection | N/A | ⬜ pending |
| 05-02-02 | 02 | 2 | MOB-02 | manual | visual inspection | N/A | ⬜ pending |
| 05-02-03 | 02 | 2 | MOB-03 | manual | visual inspection | N/A | ⬜ pending |
| 05-02-04 | 02 | 2 | MOB-04 | manual | visual inspection | N/A | ⬜ pending |
| 05-02-05 | 02 | 2 | MOB-05 | manual | visual inspection | N/A | ⬜ pending |
| 05-02-06 | 02 | 2 | MOB-06 | unit | `bunx vitest run` | ❌ W0 | ⬜ pending |
| 05-02-07 | 02 | 2 | MOB-07 | unit | `bunx vitest run` | ❌ W0 | ⬜ pending |
| 05-02-08 | 02 | 2 | MOB-08 | unit | `bunx vitest run` | ❌ W0 | ⬜ pending |
| 05-02-09 | 02 | 2 | MOB-09 | unit | `bunx vitest run` | ❌ W0 | ⬜ pending |
| 05-02-10 | 02 | 2 | MOB-10 | manual | visual inspection | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Install vitest if not present
- [ ] `src/__tests__/journal-editor.test.ts` — stubs for JRNL-01 through JRNL-05
- [ ] `src/__tests__/mobile-layout.test.ts` — stubs for MOB-06 through MOB-09
- [ ] Test utilities / fixtures for Tiptap editor instances

*Existing infrastructure covers some requirements; Wave 0 adds journal + mobile test stubs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SideNav collapses to bottom tab bar | MOB-01 | Visual layout verification | Resize browser to 430px, verify bottom nav appears |
| All pages usable at 430px | MOB-02 | Visual layout verification | Navigate all pages at 430px, check no horizontal scroll |
| Finance stacked layout | MOB-03 | Visual layout verification | View finance page at 430px, verify cards stack vertically |
| 44x44px touch targets | MOB-04 | Touch target sizing | Inspect interactive elements at mobile width |
| DayStrip touch carousel | MOB-05 | Touch gesture verification | Swipe DayStrip on touch device, verify centering |
| Mobile-optimized year overview | MOB-10 | Visual layout verification | View year overview at 430px, check readability |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
