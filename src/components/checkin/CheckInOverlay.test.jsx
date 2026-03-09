import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CheckInOverlay from './CheckInOverlay';

vi.mock('@/lib/supabase');

// CHECKIN-01: Step-through evening check-in overlay (one win at a time, yes/no + optional note)
// Wave 0 stub — all tests fail with module-not-found until Wave 2 creates CheckInOverlay.jsx

const mockWins = [
  { id: 'win-1', title: 'Ship the feature' },
  { id: 'win-2', title: 'Write the tests' },
];

describe('CheckInOverlay', () => {
  describe('step rendering', () => {
    it('renders the first win title on step 0', () => {
      render(
        <CheckInOverlay
          open={true}
          wins={mockWins}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText('Ship the feature')).toBeInTheDocument();
    });

    it('renders Yes and No buttons on each win step', () => {
      render(
        <CheckInOverlay
          open={true}
          wins={mockWins}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument();
    });

    it('does not render when open=false', () => {
      render(
        <CheckInOverlay
          open={false}
          wins={mockWins}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Yes path', () => {
    it('pressing Yes advances to the next win without showing a reflection field', async () => {
      const user = userEvent.setup();
      render(
        <CheckInOverlay
          open={true}
          wins={mockWins}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      await user.click(screen.getByRole('button', { name: /yes/i }));
      expect(screen.getByText('Write the tests')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('No path', () => {
    it('pressing No reveals a reflection text field on the same screen', async () => {
      const user = userEvent.setup();
      render(
        <CheckInOverlay
          open={true}
          wins={mockWins}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      await user.click(screen.getByRole('button', { name: /no/i }));
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('can advance past a No step with an empty note (pressing Next/Enter)', async () => {
      const user = userEvent.setup();
      render(
        <CheckInOverlay
          open={true}
          wins={mockWins}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      await user.click(screen.getByRole('button', { name: /no/i }));
      // Submit with empty note — should advance
      await user.keyboard('{Enter}');
      expect(screen.getByText('Write the tests')).toBeInTheDocument();
    });
  });

  describe('completion screen', () => {
    it('shows a completion screen after all wins are answered', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      render(
        <CheckInOverlay
          open={true}
          wins={[{ id: 'win-1', title: 'Ship the feature' }]}
          onComplete={onComplete}
          onClose={vi.fn()}
        />
      );
      await user.click(screen.getByRole('button', { name: /yes/i }));
      // Completion screen should show a tally
      expect(screen.getByText(/1 of 1/i)).toBeInTheDocument();
    });

    it('shows 0 of 0 completion screen immediately when wins array is empty', () => {
      render(
        <CheckInOverlay
          open={true}
          wins={[]}
          onComplete={vi.fn()}
          onClose={vi.fn()}
        />
      );
      expect(screen.getByText(/0 of 0/i)).toBeInTheDocument();
    });
  });
});
