/**
 * notifications.js — Push notification stubs (v1)
 *
 * v1 deliverable: callable stubs with documented v2 path.
 * No actual push notification delivery in v1 — single-user app,
 * service worker registration is a v2 concern.
 */

export function scheduleMorningReminder() {
  if (import.meta.env.DEV) {
    console.log('[notifications] scheduleMorningReminder() called — stub only');
  }
  // TODO v2: Implement actual push notification delivery:
  // 1. Check Notification.permission — prompt if 'default'
  // 2. await Notification.requestPermission()
  // 3. Register service worker: await navigator.serviceWorker.register('/sw.js')
  // 4. Use registration.showNotification() or server-side push subscription
  // 5. Target time: 9am local — compute ms until next 9am, use setTimeout or cron
  //    Note: setTimeout is not reliable for background delivery; prefer Web Push API.
  // Reference: https://developer.mozilla.org/en-US/docs/Web/API/Push_API
}

export function scheduleEveningReminder() {
  if (import.meta.env.DEV) {
    console.log('[notifications] scheduleEveningReminder() called — stub only');
  }
  // TODO v2: Same path as scheduleMorningReminder(), target time is 9pm local.
  // Separate registration from morning to allow independent scheduling.
}
