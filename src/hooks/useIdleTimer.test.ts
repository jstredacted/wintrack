import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIdleTimer, IDLE_TIMEOUT_MS } from '@/hooks/useIdleTimer';

describe('useIdleTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onIdle after IDLE_TIMEOUT_MS of no interaction', () => {
    const onIdle = vi.fn();
    renderHook(() => useIdleTimer(onIdle));

    // Advance past idle timeout + check interval
    vi.advanceTimersByTime(IDLE_TIMEOUT_MS + 10_000);

    expect(onIdle).toHaveBeenCalled();
  });

  it('does NOT call onIdle if interaction events fire within timeout window', () => {
    const onIdle = vi.fn();
    renderHook(() => useIdleTimer(onIdle));

    // Advance 10 minutes
    vi.advanceTimersByTime(10 * 60 * 1000);

    // Fire an interaction event
    document.dispatchEvent(new Event('mousemove'));

    // Advance past the remaining time + check interval
    vi.advanceTimersByTime(IDLE_TIMEOUT_MS + 10_000);

    // onIdle should have been called eventually since we advanced past timeout from the last activity
    // But NOT before the reset happened
    expect(onIdle).toHaveBeenCalled();

    // Reset and test that interaction truly resets
    onIdle.mockClear();

    // Now test: onIdle should NOT fire within 14 minutes after interaction
    document.dispatchEvent(new Event('click'));

    // Need to clear the throttle timer first
    vi.advanceTimersByTime(1100);

    document.dispatchEvent(new Event('keydown'));
    vi.advanceTimersByTime(14 * 60 * 1000);
    expect(onIdle).not.toHaveBeenCalled();
  });

  it('cleans up event listeners on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const onIdle = vi.fn();

    const { unmount } = renderHook(() => useIdleTimer(onIdle));
    unmount();

    // Should have removed listeners for all tracked events
    const removedEvents = removeSpy.mock.calls.map(call => call[0]);
    expect(removedEvents).toContain('mousemove');
    expect(removedEvents).toContain('keydown');
    expect(removedEvents).toContain('scroll');
    expect(removedEvents).toContain('touchstart');
    expect(removedEvents).toContain('click');
    expect(removedEvents).toContain('pointerdown');

    removeSpy.mockRestore();
  });

  it('does not add listeners when enabled=false', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const onIdle = vi.fn();

    renderHook(() => useIdleTimer(onIdle, false));

    // Should not have added any of our tracked event listeners
    const addedEvents = addSpy.mock.calls.map(call => call[0]);
    expect(addedEvents).not.toContain('mousemove');
    expect(addedEvents).not.toContain('keydown');

    // And onIdle should never fire
    vi.advanceTimersByTime(IDLE_TIMEOUT_MS + 10_000);
    expect(onIdle).not.toHaveBeenCalled();

    addSpy.mockRestore();
  });
});
