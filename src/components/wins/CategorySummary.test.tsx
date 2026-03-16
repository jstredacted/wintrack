import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CategorySummary from './CategorySummary';

function makeWin(overrides: Record<string, unknown>) {
  return {
    id: 'win-1',
    title: 'Default',
    category: 'work',
    completed: false,
    created_at: '2026-03-09T10:00:00Z',
    user_id: 'test-user',
    win_date: '2026-03-09',
    ...overrides,
  };
}

describe('CategorySummary', () => {
  it('returns null for empty wins array', () => {
    const { container } = render(<CategorySummary wins={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null for undefined wins', () => {
    const { container } = render(<CategorySummary wins={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when all wins share the same category (single group)', () => {
    const wins = [
      makeWin({ id: '1', title: 'A', category: 'work', completed: false }),
      makeWin({ id: '2', title: 'B', category: 'work', completed: true }),
    ];
    const { container } = render(<CategorySummary wins={wins} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders correct counts for multi-category wins', () => {
    const wins = [
      makeWin({ id: '1', title: 'Write report', category: 'work', completed: true }),
      makeWin({ id: '2', title: 'Code review', category: 'work', completed: false }),
      makeWin({ id: '3', title: 'Gym', category: 'health', completed: false }),
    ];
    render(<CategorySummary wins={wins} />);
    // work: 1 completed out of 2 total (CSS uppercase, DOM text is lowercase)
    expect(screen.getByText('work: 1/2')).toBeInTheDocument();
    // health: 0 completed out of 1 total
    expect(screen.getByText('health: 0/1')).toBeInTheDocument();
  });

  it('handles wins with missing category (falls back to work)', () => {
    const wins = [
      makeWin({ id: '1', title: 'No category win', completed: true }),
      makeWin({ id: '2', title: 'Personal win', category: 'personal', completed: false }),
    ];
    render(<CategorySummary wins={wins} />);
    // fallback-to-work win should appear in the work group (CSS uppercase, DOM text is lowercase)
    expect(screen.getByText('work: 1/1')).toBeInTheDocument();
    expect(screen.getByText('personal: 0/1')).toBeInTheDocument();
  });

  it('renders all three categories when wins span work, personal, and health', () => {
    const wins = [
      makeWin({ id: '1', title: 'Work task', category: 'work', completed: false }),
      makeWin({ id: '2', title: 'Personal task', category: 'personal', completed: false }),
      makeWin({ id: '3', title: 'Health task', category: 'health', completed: true }),
    ];
    render(<CategorySummary wins={wins} />);
    // CSS uppercase applied, DOM text is lowercase
    expect(screen.getByText('work: 0/1')).toBeInTheDocument();
    expect(screen.getByText('personal: 0/1')).toBeInTheDocument();
    expect(screen.getByText('health: 1/1')).toBeInTheDocument();
  });
});
