import { describe, it, expect } from 'vitest';

// CHECKIN-04: Push notification stubs — v1 is code only, no actual delivery
// Wave 0 stub — all tests fail with module-not-found until Wave 1 creates notifications.js

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
    expect(() => scheduleMorningReminder()).not.toThrow();
  });

  it('scheduleEveningReminder() does not throw when called', async () => {
    const { scheduleEveningReminder } = await import('./notifications');
    expect(() => scheduleEveningReminder()).not.toThrow();
  });
});
