-- ============================================================================
-- Push Notification Cron Setup
-- ============================================================================
-- Run this script in the Supabase SQL Editor to configure automated
-- push notification delivery via pg_cron + pg_net.
--
-- Prerequisites:
--   1. Edge Function 'send-push' deployed: supabase functions deploy send-push
--   2. VAPID secrets set: supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=...
--   3. Replace YOUR_PROJECT_URL and YOUR_ANON_KEY below with actual values
-- ============================================================================

-- Step 1: Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Step 2: Store project secrets in Vault
-- Replace these placeholders with your actual Supabase project URL and anon key.
-- These are read by the cron job to call the Edge Function.
--
-- SELECT vault.create_secret('https://YOUR_PROJECT_ID.supabase.co', 'project_url');
-- SELECT vault.create_secret('YOUR_ANON_KEY', 'anon_key');

-- Step 3: Schedule hourly push notification check
-- Fires every hour on the hour. The Edge Function itself checks user_settings
-- to determine whether to send (morning_prompt_hour / evening_prompt_hour).
-- This means changing notification times in Settings takes effect immediately
-- without needing to update the cron schedule.
SELECT cron.schedule(
  'push-notification-check',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')
    ),
    body := '{"type":"check"}'::jsonb
  ) AS request_id;
  $$
);

-- ============================================================================
-- Helpful queries
-- ============================================================================

-- View scheduled cron jobs:
-- SELECT * FROM cron.job;

-- View recent cron execution history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Manually trigger a morning notification (for testing):
-- SELECT net.http_post(
--   url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
--          || '/functions/v1/send-push',
--   headers := jsonb_build_object(
--     'Content-Type', 'application/json',
--     'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')
--   ),
--   body := '{"type":"morning"}'::jsonb
-- ) AS request_id;

-- Remove the cron job:
-- SELECT cron.unschedule('push-notification-check');
