---
phase: 6
slug: animations-micro-interactions-and-overlay-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.0.18 + @testing-library/react ^16.3.2 |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `mise exec -- npm run test -- --reporter=verbose --run` |
| **Full suite command** | `mise exec -- npm run test -- --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `mise exec -- npm run test -- --run src/components/wins/TimerFocusOverlay.test.jsx src/components/journal/JournalEditorOverlay.test.jsx`
- **After every plan wave:** Run `mise exec -- npm run test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 1 | FIX-01 | unit | `mise exec -- npm run test -- --run src/components/wins/TimerFocusOverlay.test.jsx` | ✅ (needs new case) | ⬜ pending |
| 6-01-02 | 01 | 1 | FIX-02 | integration | `mise exec -- npm run test -- --run src/pages/TodayPage.test.jsx` | ❌ W0 | ⬜ pending |
| 6-02-01 | 02 | 2 | FIX-03 | unit | `mise exec -- npm run test -- --run src/components/journal/JournalEditorOverlay.test.jsx` | ✅ (existing) | ⬜ pending |
| 6-02-02 | 02 | 2 | FIX-04 | unit | `mise exec -- npm run test -- --run src/components/journal/JournalEditorOverlay.test.jsx` | ✅ (existing) | ⬜ pending |
| 6-02-03 | 02 | 2 | FIX-05 | unit | `mise exec -- npm run test -- --run src/components/journal/JournalEditorOverlay.test.jsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/pages/TodayPage.test.jsx` — stubs for FIX-02 (flash regression using userEvent.click on timer button)
- [ ] New test case in `src/components/wins/TimerFocusOverlay.test.jsx` — asserts AddSlot renders when 4 wins provided (FIX-01)
- [ ] New test case in `src/components/journal/JournalEditorOverlay.test.jsx` — asserts Save button shows "Saving…" while onSave is pending (FIX-05)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Journal save crossfade animation visible | FIX-03 | CSS animation timing not testable in jsdom | Open journal, write entry, click Save — observe smooth fade/slide to summary screen |
| Journal exit slide-down feels snappy | FIX-04 | CSS easing not testable in jsdom | Open journal, click close — observe fast ease-in dismiss (should feel ~22% faster than entry) |
| Button press scale feedback on Save | FIX-05 | CSS active pseudo-class not testable in jsdom | Click journal Save button — observe brief scale-down press effect |
| No flash on TodayPage when opening timer overlay | FIX-02 | Visual regression not testable in jsdom | On Today page with wins, click timer icon — observe no flash/flicker of content area |
| TimerFocusOverlay shows Add after 4+ wins | FIX-01 | Integration with live state | Log 4 wins, open timer overlay — confirm Add slot is still visible |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
