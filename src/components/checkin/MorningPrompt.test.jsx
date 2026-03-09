import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MorningPrompt from './MorningPrompt';

// CHECKIN-02: In-app morning prompt at 9am if no wins logged yet
// Wave 0 stub — all tests fail with module-not-found until Wave 2 creates MorningPrompt.jsx

describe('MorningPrompt', () => {
  describe('visibility conditions', () => {
    it('renders when hour >= 9, wins are empty, and not dismissed today', () => {
      render(
        <MorningPrompt
          show={true}
          onLogWin={vi.fn()}
          onDismiss={vi.fn()}
        />
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render when show=false', () => {
      render(
        <MorningPrompt
          show={false}
          onLogWin={vi.fn()}
          onDismiss={vi.fn()}
        />
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('buttons', () => {
    it('"Log a win" button calls onLogWin callback', async () => {
      const user = userEvent.setup();
      const onLogWin = vi.fn();
      render(
        <MorningPrompt
          show={true}
          onLogWin={onLogWin}
          onDismiss={vi.fn()}
        />
      );
      await user.click(screen.getByRole('button', { name: /log a win/i }));
      expect(onLogWin).toHaveBeenCalled();
    });

    it('Dismiss/Later button calls onDismiss callback', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      render(
        <MorningPrompt
          show={true}
          onLogWin={vi.fn()}
          onDismiss={onDismiss}
        />
      );
      await user.click(screen.getByRole('button', { name: /dismiss|later/i }));
      expect(onDismiss).toHaveBeenCalled();
    });
  });
});
