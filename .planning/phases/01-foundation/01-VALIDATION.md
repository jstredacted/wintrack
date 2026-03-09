---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (Wave 0 installs) |
| **Config file** | `vitest.config.js` — Wave 0 gap |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/hooks/ src/lib/utils/ --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | SHELL-01 | unit | `npx vitest run src/hooks/useTheme.test.js -x` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 0 | SHELL-01 | unit | `npx vitest run src/hooks/useTheme.test.js -x` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 0 | SHELL-02 | unit | `npx vitest run src/lib/utils/date.test.js -x` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | SHELL-01 | unit | `npx vitest run src/hooks/useTheme.test.js -x` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 1 | SHELL-01 | manual | Visual: dark/light toggle switches correctly | n/a | ⬜ pending |
| 1-03-01 | 03 | 2 | SHELL-02 | manual | Visual: Geist Mono renders, dot grid visible | n/a | ⬜ pending |
| 1-03-02 | 03 | 2 | SHELL-02 | manual | Visual: dot grid in both dark and light modes | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.js` — Vitest config with jsdom environment for hook and utility tests
- [ ] `src/hooks/useTheme.test.js` — stubs for SHELL-01 (localStorage toggle, class mutation, system preference default)
- [ ] `src/lib/utils/date.test.js` — stubs for SHELL-02 (en-CA locale output, non-UTC verification)
- [ ] Vitest install: `npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Geist Mono font renders in browser | SHELL-02 | CSS font rendering not verifiable in jsdom | Open DevTools → Computed → font-family on `body`, confirm "Geist Mono Variable" |
| Dot grid visible at correct opacity in light mode | SHELL-02 | Visual opacity check not automatable | Load app, inspect `body` background-image in DevTools; confirm radial-gradient present |
| Dot grid visible at correct opacity in dark mode | SHELL-02 | Visual opacity check not automatable | Toggle to dark mode, confirm dot grid still visible at similar density |
| No theme flash on hard refresh in dark mode | SHELL-01 | Timing artifact, not testable in jsdom | Set dark in localStorage, hard-refresh (Ctrl+Shift+R); confirm no white flash |
| Bottom tab bar clears iPhone home indicator | SHELL-02 | Safe-area inset, requires real device/simulator | Test on iOS Safari; confirm tab bar not clipped |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
