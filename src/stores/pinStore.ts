import { create } from 'zustand';

type PinGateState = 'loading' | 'setup' | 'locked' | 'unlocked';
const SESSION_KEY = 'wintrack-session';

interface PinState {
  gateState: PinGateState;
  setGateState: (state: PinGateState) => void;
  markUnlocked: () => void;
  lock: () => void;
}

function isSessionUnlocked(): boolean {
  try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch { return false; }
}

export const usePinStore = create<PinState>()((set) => ({
  gateState: isSessionUnlocked() ? 'unlocked' : 'loading',
  setGateState: (gateState) => set({ gateState }),
  markUnlocked: () => {
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch {}
    set({ gateState: 'unlocked' });
  },
  lock: () => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    set({ gateState: 'locked' });
  },
}));
