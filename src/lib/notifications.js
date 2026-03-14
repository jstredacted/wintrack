/**
 * notifications.js — Push notification scheduling.
 *
 * Notification timing is handled server-side by pg_cron + Edge Function.
 * These functions ensure the browser is subscribed to push. Actual delivery
 * happens via Supabase Edge Functions using the Web Push protocol.
 *
 * Both functions are idempotent — subscribeToPush upserts on user_id.
 */

import { subscribeToPush } from './push-subscription';

export async function scheduleMorningReminder() {
  await subscribeToPush();
}

export async function scheduleEveningReminder() {
  await subscribeToPush();
}
