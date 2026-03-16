import { Bell, BellOff } from 'lucide-react';
import { usePushSubscription } from '@/hooks/usePushSubscription';

/**
 * Toggle button for enabling/disabling push notifications.
 *
 * Renders three states:
 * - loading: null (hidden)
 * - denied: informational message (browser blocked notifications)
 * - default/granted: toggle button (enable/disable)
 */
export default function NotificationPermission() {
  const { permission, subscribed, loading, subscribe, unsubscribe } =
    usePushSubscription();

  if (loading) return null;

  if (permission === 'denied') {
    return (
      <p className="font-mono text-xs text-muted-foreground">
        Notifications blocked by browser
      </p>
    );
  }

  if (subscribed) {
    return (
      <button
        onClick={unsubscribe}
        className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest border-b border-foreground pb-0.5 hover:opacity-70 transition-opacity"
      >
        <Bell className="h-4 w-4" />
        Notifications on
      </button>
    );
  }

  return (
    <button
      onClick={subscribe}
      className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest border-b border-foreground pb-0.5 hover:opacity-70 transition-opacity"
    >
      <BellOff className="h-4 w-4" />
      Enable notifications
    </button>
  );
}
