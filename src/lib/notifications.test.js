import { describe, it, expect, vi } from 'vitest';

// Mock push-subscription so tests run in jsdom (no real service worker)
vi.mock('./push-subscription', () => ({
  subscribeToPush: vi.fn().mockResolvedValue(undefined),
}));

describe('notifications', () => {
  it('exports scheduleMorningReminder as a function', async () => {
    const mod = await import('./notifications');
    expect(typeof mod.scheduleMorningReminder).toBe('function');
  });

  it('exports scheduleEveningReminder as a function', async () => {
    const mod = await import('./notifications');
    expect(typeof mod.scheduleEveningReminder).toBe('function');
  });

  it('scheduleMorningReminder() does not throw when called', async () => {
    const { scheduleMorningReminder } = await import('./notifications');
    await expect(scheduleMorningReminder()).resolves.not.toThrow();
  });

  it('scheduleEveningReminder() does not throw when called', async () => {
    const { scheduleEveningReminder } = await import('./notifications');
    await expect(scheduleEveningReminder()).resolves.not.toThrow();
  });
});
