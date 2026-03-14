import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

// Precache static assets injected by vite-plugin-pwa at build time
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Activate immediately — don't wait for old tabs to close
self.skipWaiting();
clientsClaim();

// --- Push notification handler ---
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'wintrack', body: event.data?.text() || '' };
  }

  const title = data.title || 'wintrack';
  const options = {
    body: data.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'wintrack-reminder',
    renotify: true,
    data: data.url || '/',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// --- Notification click handler ---
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Focus existing window if one is open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        return clients.openWindow(targetUrl);
      })
  );
});
