import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RollForwardPrompt from './RollForwardPrompt';

vi.mock('@/lib/supabase');

// WIN-04: Roll-forward prompt for incomplete wins from yesterday
// Wave 0 stub — all tests fail with module-not-found until Wave 2 creates RollForwardPrompt.jsx

describe('RollForwardPrompt', () => {
  it('renders correctly with count=1 (singular: "1 unfinished win from yesterday")', () => {
    render(
      <RollForwardPrompt
        count={1}
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText(/1 unfinished win from yesterday/i)).toBeInTheDocument();
  });

  it('renders correctly with count=3 (plural: "3 unfinished wins from yesterday")', () => {
    render(
      <RollForwardPrompt
        count={3}
        onConfirm={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText(/3 unfinished wins from yesterday/i)).toBeInTheDocument();
  });

  it('clicking "Yes" calls onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <RollForwardPrompt
        count={2}
        onConfirm={onConfirm}
        onDismiss={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /yes/i }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('clicking "Dismiss" calls onDismiss', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <RollForwardPrompt
        count={2}
        onConfirm={vi.fn()}
        onDismiss={onDismiss}
      />
    );
    await user.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalled();
  });
});
