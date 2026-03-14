---
phase: 05
slug: push-notifications-web-push-with-service-workers-and-cloud-compute-setup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x + jsdom |
| **Config file** | vitest.config.js |
| **Quick run command** | `bunx vitest run --reporter=verbose` |
| **Full suite command** | `bunx vitest run --reporter=verbose` |
| **Estimated runtime** | ~11 seconds |

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
| 05-01-01 | 01 | 1 | PUSH-01 | unit | `bunx vitest run src/sw.test.js` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | PUSH-02 | unit | `bunx vitest run src/lib/push-subscription.test.js` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | PUSH-03 | unit | `bunx vitest run src/components/NotificationPermission.test.jsx` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 1 | PUSH-04 | unit | `bunx vitest run src/lib/notifications.test.js` | ✅ | ⬜ pending |
| 05-02-03 | 02 | 1 | PUSH-05 | unit | `bunx vitest run src/pages/SettingsPage.test.jsx` | ✅ | ⬜ pending |
| 05-03-01 | 03 | 2 | PUSH-06 | manual | Deploy and test via Supabase dashboard | N/A | ⬜ pending |
| 05-03-02 | 03 | 2 | PUSH-07 | manual | Verify via Supabase SQL editor | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/sw.test.js` — push event listener, notificationclick handler stubs
- [ ] `src/lib/push-subscription.test.js` — subscribe/unsubscribe with mocked PushManager
- [ ] `src/components/NotificationPermission.test.jsx` — permission states, click handlers

*Existing: `src/lib/notifications.test.js` (stubs), `src/pages/SettingsPage.test.jsx` (settings)*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Edge Function sends push | PUSH-06 | Runs in Deno on Supabase infrastructure | Deploy function, trigger via pg_cron or manual invoke, verify push received |
| pg_cron triggers at configured times | PUSH-07 | Postgres extension, not testable in jsdom | Check cron.job_run_details table after schedule runs |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
