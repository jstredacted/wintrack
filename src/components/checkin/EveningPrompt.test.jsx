import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EveningPrompt from './EveningPrompt';

// CHECKIN-03: In-app evening prompt at 9pm if check-in not completed today
// Wave 0 stub — all tests fail with module-not-found until Wave 2 creates EveningPrompt.jsx

describe('EveningPrompt', () => {
  describe('visibility conditions', () => {
    it('renders when show=true', () => {
      render(
        <EveningPrompt
          show={true}
          onStartCheckin={vi.fn()}
          onDismiss={vi.fn()}
        />
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render when show=false', () => {
      render(
        <EveningPrompt
          show={false}
          onStartCheckin={vi.fn()}
          onDismiss={vi.fn()}
        />
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('buttons', () => {
    it('"Start check-in" button calls onStartCheckin callback', async () => {
      const user = userEvent.setup();
      const onStartCheckin = vi.fn();
      render(
        <EveningPrompt
          show={true}
          onStartCheckin={onStartCheckin}
          onDismiss={vi.fn()}
        />
      );
      await user.click(screen.getByRole('button', { name: /start check-in/i }));
      expect(onStartCheckin).toHaveBeenCalled();
    });

    it('Dismiss button calls onDismiss callback', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      render(
        <EveningPrompt
          show={true}
          onStartCheckin={vi.fn()}
          onDismiss={onDismiss}
        />
      );
      await user.click(screen.getByRole('button', { name: /dismiss|later/i }));
      expect(onDismiss).toHaveBeenCalled();
    });
  });
});
