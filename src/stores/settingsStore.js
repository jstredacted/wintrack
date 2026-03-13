import { create } from 'zustand';

const CACHE_KEY = 'wintrack-settings';

const DEFAULTS = {
  dayStartHour: 0,
  morningPromptHour: 9,
  eveningPromptHour: 21,
};

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useSettingsStore = create((set) => ({
  settings: readCache() ?? { ...DEFAULTS },
  loaded: !!readCache(),
  setSettings: (settings) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
    } catch {}
    set({ settings, loaded: true });
  },
}));
