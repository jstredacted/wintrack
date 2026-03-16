/**
 * push-subscription.js — Web Push subscription management with Supabase persistence.
 *
 * Handles subscribing/unsubscribing the browser to push notifications and
 * storing the subscription server-side so the Edge Function can deliver
 * notifications via the Web Push protocol.
 */

import { supabase } from '@/lib/supabase';
import { USER_ID } from '@/lib/env';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/**
 * Convert a URL-safe base64 string to a Uint8Array (for applicationServerKey).
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe the browser to push notifications and persist the subscription
 * in Supabase so the server can send pushes later.
 *
 * Idempotent: safe to call multiple times — upserts on user_id.
 * @returns {PushSubscription} The active push subscription.
 */
export async function subscribeToPush(): Promise<PushSubscription> {
  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const json = subscription.toJSON();

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: USER_ID,
      endpoint: json.endpoint!,
      p256dh: json.keys!.p256dh!,
      auth: json.keys!.auth!,
      expiration_time: json.expirationTime ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    console.error('[push-subscription] Failed to persist subscription:', error);
    throw error;
  }

  return subscription;
}

/**
 * Unsubscribe from push notifications and remove the subscription from the DB.
 */
export async function unsubscribeFromPush(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    await subscription.unsubscribe();
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', USER_ID);

  if (error) {
    console.error('[push-subscription] Failed to remove subscription:', error);
    throw error;
  }
}

/**
 * Get the existing push subscription (if any) without modifying state.
 * @returns {PushSubscription | null}
 */
export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null;

  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}
