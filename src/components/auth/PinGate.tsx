import { useEffect } from 'react';
import { Outlet } from 'react-router';
import { usePinStore } from '@/stores/pinStore';
import { usePinAuth } from '@/hooks/usePinAuth';
import { useIdleTimer } from '@/hooks/useIdleTimer';
import PinScreen from './PinScreen';
import PinSetup from './PinSetup';

export default function PinGate() {
  const gateState = usePinStore((s) => s.gateState);
  const blurred = usePinStore((s) => s.blurred);
  const pinAuth = usePinAuth();

  // Initialize gate on mount — determines setup/locked/unlocked state
  useEffect(() => {
    pinAuth.initializeGate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Page Visibility API — blur content when tab is hidden
  useEffect(() => {
    const handler = () => {
      if (document.hidden) {
        usePinStore.getState().setBlurred(true);
      } else {
        usePinStore.getState().setBlurred(false);
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // Idle timer — lock after 15 minutes of no interaction (only when unlocked)
  useIdleTimer(
    () => usePinStore.getState().lock(),
    gateState === 'unlocked',
  );

  if (gateState === 'loading') {
    return <div className="fixed inset-0 bg-background" />;
  }

  if (gateState === 'setup') {
    return (
      <PinSetup
        onComplete={async (pin) => {
          await pinAuth.setup(pin);
        }}
      />
    );
  }

  if (gateState === 'locked') {
    return (
      <PinScreen
        onUnlock={async (pin) => {
          const ok = await pinAuth.verify(pin);
          if (ok) usePinStore.getState().markUnlocked();
          return ok;
        }}
      />
    );
  }

  // gateState === 'unlocked'
  return (
    <>
      <Outlet />
      {blurred && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xl" />
      )}
    </>
  );
}
