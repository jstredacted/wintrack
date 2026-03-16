import { hashPin } from '@/lib/pin';
import { supabase } from '@/lib/supabase';
import { USER_ID } from '@/lib/env';
import { usePinStore } from '@/stores/pinStore';

// Module-level so it persists across re-renders
let storedHash: string | null = null;

export function usePinAuth() {

  async function initializeGate(): Promise<void> {
    // If session flag is already set (e.g. page reload within same tab), keep unlocked
    if (usePinStore.getState().gateState === 'unlocked') {
      return;
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('pin_hash')
      .eq('user_id', USER_ID)
      .single();

    if (error || !data) {
      // Fail closed — show lock screen rather than exposing content
      usePinStore.getState().setGateState('locked');
      return;
    }

    if (!data.pin_hash) {
      usePinStore.getState().setGateState('setup');
      return;
    }

    storedHash = data.pin_hash;
    usePinStore.getState().setGateState('locked');
  }

  async function verify(pin: string): Promise<boolean> {
    const hash = await hashPin(pin);
    return hash === storedHash;
  }

  async function setup(pin: string): Promise<void> {
    const hash = await hashPin(pin);
    await supabase
      .from('user_settings')
      .upsert({ user_id: USER_ID, pin_hash: hash });
    storedHash = hash;
    usePinStore.getState().markUnlocked();
  }

  return { initializeGate, verify, setup };
}
