import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimerFocusOverlay from './TimerFocusOverlay';

// Wave 0 stub — fails with module-not-found until plan 05-03 creates TimerFocusOverlay.jsx

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }));

const sampleWins = [
  { id: 'w1', title: 'Write docs', timer_elapsed_seconds: 120, timer_started_at: null },
  { id: 'w2', title: 'Review PR', timer_elapsed_seconds: 0, timer_started_at: null },
];

describe('TimerFocusOverlay', () => {
  it('renders nothing when open is false', () => {
    render(<TimerFocusOverlay open={false} wins={sampleWins} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders a dialog when open is true', () => {
    render(<TimerFocusOverlay open={true} wins={sampleWins} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders one bento cell per win when open', () => {
    render(<TimerFocusOverlay open={true} wins={sampleWins} onClose={vi.fn()} />);
    // Each win gets a cell with its title visible
    expect(screen.getByText('Write docs')).toBeInTheDocument();
    expect(screen.getByText('Review PR')).toBeInTheDocument();
  });

  it('renders at most 3 bento cells when more than 3 wins have running timers', () => {
    const manyWins = Array.from({ length: 5 }, (_, i) => ({
      id: `w${i}`, title: `Win ${i}`, timer_elapsed_seconds: 0, timer_started_at: null,
    }));
    render(<TimerFocusOverlay open={true} wins={manyWins} onClose={vi.fn()} />);
    // Only the first 3 wins should appear in the overlay
    expect(screen.getByText('Win 0')).toBeInTheDocument();
    expect(screen.getByText('Win 1')).toBeInTheDocument();
    expect(screen.getByText('Win 2')).toBeInTheDocument();
    expect(screen.queryByText('Win 3')).not.toBeInTheDocument();
  });
});
