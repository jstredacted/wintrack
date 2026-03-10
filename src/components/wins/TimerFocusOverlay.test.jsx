import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimerFocusOverlay from './TimerFocusOverlay';

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
    expect(screen.getByText('Write docs')).toBeInTheDocument();
    expect(screen.getByText('Review PR')).toBeInTheDocument();
  });

  it('renders all wins when there are more than 3', () => {
    const manyWins = Array.from({ length: 5 }, (_, i) => ({
      id: `w${i}`, title: `Win ${i}`, timer_elapsed_seconds: 0, timer_started_at: null,
    }));
    render(<TimerFocusOverlay open={true} wins={manyWins} onClose={vi.fn()} />);
    for (let i = 0; i < 5; i++) {
      expect(screen.getByText(`Win ${i}`)).toBeInTheDocument();
    }
  });

  it('calls onStartWin when play is clicked on a non-running, fresh win', async () => {
    const user = userEvent.setup();
    const onStartWin = vi.fn();
    const wins = [{ id: 'w1', title: 'Write docs', timer_elapsed_seconds: 0, timer_started_at: null }];
    render(<TimerFocusOverlay open={true} wins={wins} onClose={vi.fn()} onStartWin={onStartWin} />);
    await user.click(screen.getByRole('button', { name: /start timer/i }));
    expect(onStartWin).toHaveBeenCalledWith('w1');
  });

  it('calls onStartWin when play is clicked on a paused win (elapsed > 0, not running)', async () => {
    const user = userEvent.setup();
    const onStartWin = vi.fn();
    const wins = [{ id: 'w1', title: 'Write docs', timer_elapsed_seconds: 300, timer_started_at: null }];
    render(<TimerFocusOverlay open={true} wins={wins} onClose={vi.fn()} onStartWin={onStartWin} />);
    await user.click(screen.getByRole('button', { name: /resume timer/i }));
    expect(onStartWin).toHaveBeenCalledWith('w1');
  });

  it('renders Add slot when exactly 4 wins are shown', () => {
    const fourWins = Array.from({ length: 4 }, (_, i) => ({
      id: `w${i}`, title: `Win ${i}`, timer_elapsed_seconds: 0, timer_started_at: null,
    }));
    render(<TimerFocusOverlay open={true} wins={fourWins} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add a win/i })).toBeInTheDocument();
  });
});
