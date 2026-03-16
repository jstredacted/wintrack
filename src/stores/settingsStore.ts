import { create } from 'zustand';

export interface Settings {
  dayStartHour: number;
  morningPromptHour: number;
  eveningPromptHour: number;
}

interface SettingsState {
  settings: Settings;
  loaded: boolean;
  setSettings: (settings: Settings) => void;
}

const CACHE_KEY = 'wintrack-settings';

const DEFAULTS: Settings = {
  dayStartHour: 0,
  morningPromptHour: 9,
  eveningPromptHour: 21,
};

function readCache(): Settings | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  settings: readCache() ?? { ...DEFAULTS },
  loaded: !!readCache(),
  setSettings: (settings: Settings) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
    } catch {}
    set({ settings, loaded: true });
  },
}));
