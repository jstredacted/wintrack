import { useEffect } from 'react';
import { Outlet } from 'react-router';
import { usePinStore } from '@/stores/pinStore';
import { usePinAuth } from '@/hooks/usePinAuth';
import { useIdleTimer } from '@/hooks/useIdleTimer';
import PinScreen from './PinScreen';
import PinSetup from './PinSetup';

export default function PinGate() {
  const gateState = usePinStore((s) => s.gateState);
  const pinAuth = usePinAuth();

  // Initialize gate on mount — determines setup/locked/unlocked state
  useEffect(() => {
    pinAuth.initializeGate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  return <Outlet />;
}
