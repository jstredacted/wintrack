import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from './Header';

// Wave 0 stub — fails with assertion until plan 05-05 modifies Header.jsx for dual streaks

vi.mock('@/hooks/useStreak', () => ({
  useStreak: vi.fn(() => ({ streak: 3, journalStreak: 2, loading: false })),
}));

describe('Header', () => {
  it('displays the wins streak value', () => {
    render(<Header />);
    // Wins streak — existing behavior, extended to show "3W" or similar
    expect(screen.getByTitle(/wins streak/i)).toBeInTheDocument();
  });

  it('displays the journal streak value', () => {
    render(<Header />);
    // Journal streak — new in Phase 5
    expect(screen.getByTitle(/journal streak/i)).toBeInTheDocument();
  });

  it('renders both streak numbers side by side', () => {
    render(<Header />);
    expect(screen.getByTitle(/wins streak/i)).toHaveTextContent('3');
    expect(screen.getByTitle(/journal streak/i)).toHaveTextContent('2');
  });
});
