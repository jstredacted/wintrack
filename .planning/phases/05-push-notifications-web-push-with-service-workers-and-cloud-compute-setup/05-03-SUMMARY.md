---
phase: 05-push-notifications-web-push-with-service-workers-and-cloud-compute-setup
plan: 03
subsystem: infra
tags: [edge-function, deno, pg-cron, web-push, vapid, supabase]

requires:
  - phase: 05-push-notifications-web-push-with-service-workers-and-cloud-compute-setup
    provides: push_subscriptions table, service worker, push-subscription library, notification toggle UI
provides:
  - Supabase Edge Function that sends VAPID-authenticated web push to stored subscriptions
  - pg_cron SQL setup script for hourly notification checks
affects: [push-notification-deployment, user-settings-timezone]

tech-stack:
  added: ["@negrel/webpush (JSR)", "@supabase/supabase-js@2 (ESM)"]
  patterns: [hourly-cron-with-settings-check, stale-subscription-cleanup]

key-files:
  created:
    - supabase/functions/send-push/index.ts
    - scripts/setup-push-cron.sql
  modified: []

key-decisions:
  - "Hourly cron with Edge Function hour-check over per-setting cron jobs — no cron update needed when user changes notification times"
  - "UTC hour comparison in Edge Function — single-user sets morning_prompt_hour/evening_prompt_hour as UTC-equivalent values"
  - "410 Gone stale subscription cleanup — automatic hygiene for expired push endpoints"

patterns-established:
  - "Edge Function receives type parameter (check/morning/evening) for cron vs manual invocation"
  - "Vault secrets for project URL and anon key in pg_cron HTTP calls"

requirements-completed: [PUSH-06, PUSH-07]

duration: 2min
completed: 2026-03-14
---

# Phase 05 Plan 03: Edge Function Push Delivery Summary

**Deno Edge Function sending VAPID web push to stored subscriptions with hourly pg_cron scheduling and stale subscription cleanup**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-14T11:52:46Z
- **Completed:** 2026-03-14T11:54:34Z
- **Tasks:** 2 (1 auto + 1 checkpoint auto-approved)
- **Files modified:** 2

## Accomplishments
- Edge Function handles three invocation types: 'check' (hourly cron), 'morning', and 'evening' (direct/testing)
- Reads user_settings to compare current UTC hour against configured notification hours
- Sends push via @negrel/webpush with VAPID authentication to all stored subscriptions
- Automatically deletes stale 410 Gone subscriptions from the database
- pg_cron SQL script schedules hourly check with vault-stored project URL and anon key

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Edge Function and pg_cron setup script** - `755b930` (feat)
2. **Task 2: Verify end-to-end push notification pipeline** - auto-approved (checkpoint)

## Files Created/Modified
- `supabase/functions/send-push/index.ts` - Deno Edge Function: reads subscriptions, checks settings, sends VAPID push, cleans stale endpoints
- `scripts/setup-push-cron.sql` - pg_cron + pg_net setup with vault secrets and hourly schedule

## Decisions Made
- Hourly cron with Edge Function hour-check chosen over per-setting cron jobs — avoids needing to update cron schedule when user changes notification times in Settings
- UTC hour comparison approach — single-user app, user sets morning_prompt_hour/evening_prompt_hour as UTC-equivalent values
- 410 Gone responses trigger automatic subscription deletion — prevents repeated failed sends to expired endpoints
- CORS headers included for Supabase invocation compatibility

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
Before Edge Function can deliver push notifications:
1. Deploy Edge Function: `supabase functions deploy send-push`
2. Set VAPID secrets: `supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=...`
3. Run `scripts/setup-push-cron.sql` in Supabase SQL Editor (replace project URL and anon key placeholders)
4. Enable pg_cron and pg_net extensions if not already enabled

## Next Phase Readiness
- Complete push notification pipeline built across Plans 01-03
- Service worker (Plan 01) + subscription UI (Plan 02) + server delivery (Plan 03) form end-to-end flow
- Deployment and production verification are manual steps documented above

---
*Phase: 05-push-notifications-web-push-with-service-workers-and-cloud-compute-setup*
*Completed: 2026-03-14*
