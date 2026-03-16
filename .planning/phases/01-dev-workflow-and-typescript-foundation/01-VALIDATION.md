---
phase: 01
slug: dev-workflow-and-typescript-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x |
| **Config file** | vitest.config.js |
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
| 01-01-01 | 01 | 1 | DW-01 | manual | `git branch -a \| grep develop` | N/A | ⬜ pending |
| 01-01-02 | 01 | 1 | DW-02 | manual | `grep VITE_ENABLE_DEV_TOOLS .env` | N/A | ⬜ pending |
| 01-01-03 | 01 | 1 | DW-03 | manual | `grep -- "--host" package.json` | N/A | ⬜ pending |
| 01-02-01 | 02 | 2 | TS-01 | automated | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 2 | TS-02 | automated | `test -f src/lib/database.types.ts` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 2 | TS-03 | automated | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 01-02-04 | 02 | 2 | TS-04 | automated | `grep '"strict": true' tsconfig.json` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tsconfig.json` — TypeScript config with strict mode
- [ ] `src/lib/database.types.ts` — Supabase generated types

*Existing test infrastructure (vitest) covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dev server accessible from phone | DW-03 | Network access | Run `bun run dev`, open on phone via LAN IP |
| DevTools absent on main | DW-02 | Branch-specific | Check production build has no DevToolsPanel |
| Develop branch exists | DW-01 | Git state | Verify branch exists and tracks remote |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
