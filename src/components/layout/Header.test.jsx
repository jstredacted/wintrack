import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from './Header';

vi.mock('@/hooks/useStreak', () => ({
  useStreak: vi.fn(() => ({ streak: 3, journalStreak: 2, combinedStreak: 2, loading: false })),
}));

vi.mock('@/stores/uiStore', () => ({
  useUIStore: vi.fn((selector) => selector({ streakRefreshKey: 0, refreshStreak: vi.fn() })),
}));

describe('Header', () => {
  it('displays combined streak when > 0', () => {
    render(<Header />);
    expect(screen.getByTitle(/combined streak/i)).toBeInTheDocument();
  });

  it('shows fire emoji next to positive streak', () => {
    render(<Header />);
    expect(screen.getByTitle(/combined streak/i)).toHaveTextContent('🔥');
  });

  it('shows non-zero combined streak value', () => {
    render(<Header />);
    const el = screen.getByTitle(/combined streak/i);
    expect(el.textContent).toMatch(/2/);
  });
});
