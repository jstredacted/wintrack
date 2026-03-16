---
phase: 02
slug: pin-authentication
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x |
| **Config file** | vitest.config.ts |
| **Quick run command** | `bun run test -- --run` |
| **Full suite command** | `bun run test -- --run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `bun run test -- --run`
- **After every plan wave:** Run `bun run test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | AUTH-03 | unit | `bun run test -- --run src/lib/pin.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | AUTH-01 | unit | `bun run test -- --run src/components/auth/PinSetup.test.tsx` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | AUTH-02 | unit | `bun run test -- --run src/components/auth/PinEntry.test.tsx` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | AUTH-04 | unit | `bun run test -- --run src/hooks/useIdleTimer.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-05 | 01 | 1 | AUTH-05 | manual | `grep -r "VITE_USER_JWT" src/` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/pin.test.ts` — stubs for hash/verify PIN functions
- [ ] `src/components/auth/PinSetup.test.tsx` — stubs for PIN setup flow
- [ ] `src/components/auth/PinEntry.test.tsx` — stubs for PIN entry/unlock
- [ ] `src/hooks/useIdleTimer.test.ts` — stubs for idle detection
- [ ] Verify `crypto.subtle` availability in jsdom test environment

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Content blur on tab switch | AUTH-04 | Page Visibility API | Switch tabs, verify content is hidden in app switcher |
| Shake animation on wrong PIN | AUTH-02 | Visual feedback | Enter wrong PIN, verify dots shake and reset |
| Mobile keyboard input | AUTH-01 | Device-specific | Test PIN entry on iPhone 15 Pro Max via --host |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
