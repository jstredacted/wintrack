import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TotalFocusTime from './TotalFocusTime';

vi.mock('@/lib/supabase');

// TIMER-03: Total focus time display — sum of all win timers including live running timer
// Wave 0 stub — all tests fail with module-not-found until Wave 2 creates TotalFocusTime.jsx

describe('TotalFocusTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null (renders nothing) when totalSeconds across all wins is 0', () => {
    const wins = [
      { id: 'w1', timer_elapsed_seconds: 0, timer_started_at: null },
      { id: 'w2', timer_elapsed_seconds: 0, timer_started_at: null },
    ];
    const { container } = render(<TotalFocusTime wins={wins} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows correct sum when wins have timer_elapsed_seconds and no running timers', () => {
    const wins = [
      { id: 'w1', timer_elapsed_seconds: 300, timer_started_at: null },  // 5 min
      { id: 'w2', timer_elapsed_seconds: 600, timer_started_at: null },  // 10 min
      { id: 'w3', timer_elapsed_seconds: 0, timer_started_at: null },
    ];
    render(<TotalFocusTime wins={wins} />);
    // Total = 900 seconds = 15 minutes — rendered format TBD by implementation
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });

  it('includes live delta from timer_started_at in the total when a timer is running', () => {
    const startedAt = new Date('2026-03-09T10:00:00.000Z');
    vi.setSystemTime(startedAt);
    vi.advanceTimersByTime(60000); // advance 60 seconds

    const wins = [
      { id: 'w1', timer_elapsed_seconds: 300, timer_started_at: null },       // 5 min stored
      { id: 'w2', timer_elapsed_seconds: 0, timer_started_at: startedAt.toISOString() }, // 60s running
    ];
    render(<TotalFocusTime wins={wins} />);
    // Total = 300 + 60 = 360 seconds = 6 minutes
    expect(screen.getByText(/6/)).toBeInTheDocument();
  });
});
