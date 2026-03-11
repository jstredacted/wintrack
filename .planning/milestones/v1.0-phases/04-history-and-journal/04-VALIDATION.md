---
phase: 4
slug: history-and-journal
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + React Testing Library (jsdom) |
| **Config file** | `vitest.config.js` (root) |
| **Quick run command** | `mise exec -- npx vitest run --reporter=verbose` |
| **Full suite command** | `mise exec -- npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `mise exec -- npx vitest run src/hooks/useJournal.test.js src/hooks/useHistory.test.js src/components/journal/JournalEntryCard.test.jsx src/components/history/Heatmap.test.jsx`
- **After every plan wave:** Run `mise exec -- npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 0 | JOURNAL-01,02,03 HISTORY-01,02 | unit stubs | `mise exec -- npx vitest run` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | JOURNAL-01, JOURNAL-02 | unit | `mise exec -- npx vitest run src/hooks/useJournal.test.js` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | HISTORY-01, HISTORY-02 | unit | `mise exec -- npx vitest run src/hooks/useHistory.test.js` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | JOURNAL-01 | unit | `mise exec -- npx vitest run src/components/journal/JournalEntryForm.test.jsx` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 2 | JOURNAL-02 | unit | `mise exec -- npx vitest run src/components/journal/JournalEntryCard.test.jsx` | ❌ W0 | ⬜ pending |
| 04-03-03 | 03 | 2 | JOURNAL-03 | unit | `mise exec -- npx vitest run src/pages/JournalPage.test.jsx` | ❌ W0 | ⬜ pending |
| 04-04-01 | 04 | 2 | HISTORY-01 | unit | `mise exec -- npx vitest run src/components/history/DayDetail.test.jsx` | ❌ W0 | ⬜ pending |
| 04-04-02 | 04 | 2 | HISTORY-02 | unit | `mise exec -- npx vitest run src/components/history/Heatmap.test.jsx` | ❌ W0 | ⬜ pending |
| 04-05-01 | 05 | 3 | all | manual | visual acceptance | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/useJournal.test.js` — stubs for JOURNAL-01, JOURNAL-02
- [ ] `src/hooks/useHistory.test.js` — stubs for HISTORY-01, HISTORY-02
- [ ] `src/components/journal/JournalEntryForm.test.jsx` — stubs for JOURNAL-01
- [ ] `src/components/journal/JournalEntryCard.test.jsx` — stubs for JOURNAL-02
- [ ] `src/pages/JournalPage.test.jsx` — stubs for JOURNAL-03
- [ ] `src/components/history/DayDetail.test.jsx` — stubs for HISTORY-01
- [ ] `src/components/history/Heatmap.test.jsx` — stubs for HISTORY-02

*Existing vitest.config.js + test-setup.js infrastructure covers all gaps — no new installs needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Journal create flow end-to-end | JOURNAL-01 | jsdom cannot verify overlay/portal animation | Open app, open journal, create entry with title+body, verify it appears in list |
| Edit and delete visually | JOURNAL-02 | Inline expand UX requires browser rendering | Edit an entry, verify pre-fill, save, verify update; delete entry, verify removal |
| Heatmap highlights correct days | HISTORY-02 | Requires live Supabase data with real check_ins | Open History tab, verify days with completed check-ins are visually distinct |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
