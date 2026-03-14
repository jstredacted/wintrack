import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToPush,
  unsubscribeFromPush,
  getExistingSubscription,
} from '@/lib/push-subscription';

/**
 * React hook managing push subscription state.
 *
 * Reads current Notification.permission and checks for an existing
 * PushManager subscription on mount. Exposes subscribe/unsubscribe
 * actions that trigger the browser permission prompt on user gesture.
 */
export function usePushSubscription() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    getExistingSubscription()
      .then((sub) => {
        if (!cancelled) {
          setSubscribed(!!sub);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const subscribe = useCallback(async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      await subscribeToPush();
      setSubscribed(true);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    await unsubscribeFromPush();
    setSubscribed(false);
  }, []);

  return { permission, subscribed, loading, subscribe, unsubscribe };
}
