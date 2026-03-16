import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('settingsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('has correct defaults when localStorage is empty', async () => {
    const { useSettingsStore } = await import('./settingsStore');
    const state = useSettingsStore.getState();
    expect(state.settings).toEqual({
      dayStartHour: 0,
      morningPromptHour: 9,
      eveningPromptHour: 21,
    });
    expect(state.loaded).toBe(false);
  });

  it('reads from localStorage cache on init', async () => {
    localStorage.setItem('wintrack-settings', JSON.stringify({
      dayStartHour: 4,
      morningPromptHour: 10,
      eveningPromptHour: 22,
    }));
    const { useSettingsStore } = await import('./settingsStore');
    const state = useSettingsStore.getState();
    expect(state.settings.dayStartHour).toBe(4);
    expect(state.loaded).toBe(true);
  });

  it('setSettings writes to localStorage and updates state', async () => {
    const { useSettingsStore } = await import('./settingsStore');
    useSettingsStore.getState().setSettings({
      dayStartHour: 3,
      morningPromptHour: 8,
      eveningPromptHour: 20,
    });
    const state = useSettingsStore.getState();
    expect(state.settings.dayStartHour).toBe(3);
    expect(state.loaded).toBe(true);
    const cached = JSON.parse(localStorage.getItem('wintrack-settings'));
    expect(cached.dayStartHour).toBe(3);
  });
});
