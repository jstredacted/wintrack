import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import SideNav from './SideNav';

vi.mock('@/hooks/useStreak', () => ({
  useStreak: () => ({ combinedStreak: 5, loading: false }),
}));
vi.mock('@/stores/uiStore', () => ({
  useUIStore: (sel: (s: { streakRefreshKey: number }) => unknown) => sel({ streakRefreshKey: 0 }),
}));

const renderWithRouter = (ui: React.ReactNode, { route = '/' } = {}) =>
  render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);

describe('SideNav', () => {
  it('renders nav links without History tab', () => {
    renderWithRouter(<SideNav />);
    expect(screen.getByRole('link', { name: /today/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /journal/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /history/i })).not.toBeInTheDocument();
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
