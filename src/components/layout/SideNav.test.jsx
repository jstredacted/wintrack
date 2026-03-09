import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import SideNav from './SideNav';

vi.mock('@/hooks/useStreak', () => ({
  useStreak: () => ({ combinedStreak: 5, loading: false }),
}));
vi.mock('@/stores/uiStore', () => ({
  useUIStore: (sel) => sel({ streakRefreshKey: 0 }),
}));

const renderWithRouter = (ui, { route = '/' } = {}) =>
  render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);

describe('SideNav', () => {
  it('renders the three nav links', () => {
    renderWithRouter(<SideNav />);
    expect(screen.getByRole('link', { name: /today/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /history/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /journal/i })).toBeInTheDocument();
  });

  it('displays the streak value', () => {
    renderWithRouter(<SideNav />);
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it('renders the wintrack monogram', () => {
    renderWithRouter(<SideNav />);
    expect(screen.getByLabelText(/wintrack/i)).toBeInTheDocument();
  });
});
