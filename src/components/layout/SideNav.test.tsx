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
vi.mock('@/stores/pinStore', () => ({
  usePinStore: {
    getState: () => ({ lock: vi.fn() }),
  },
}));

const renderWithRouter = (ui: React.ReactNode, { route = '/' } = {}) =>
  render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);

describe('SideNav', () => {
  it('renders nav links without History tab', () => {
    renderWithRouter(<SideNav />);
    expect(screen.getAllByRole('link', { name: /today/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /journal/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /settings/i })[0]).toBeInTheDocument();
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

  it('renders mobile bottom tab bar with 5 items', () => {
    renderWithRouter(<SideNav />);
    const navs = screen.getAllByRole('navigation');
    // Two nav elements: desktop left nav + mobile bottom tab bar
    expect(navs.length).toBeGreaterThanOrEqual(2);

    // All 5 tab labels should be present in the document
    expect(screen.getAllByText('Today').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Journal').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Finance').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Settings').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Lock')).toBeInTheDocument();
  });

  it('mobile tab items have 44px touch targets', () => {
    renderWithRouter(<SideNav />);
    // The mobile bottom tab bar is the second nav
    const navs = screen.getAllByRole('navigation');
    const mobileNav = navs[navs.length - 1];

    // NavLinks for Today, Journal, Finance, Settings
    const links = mobileNav.querySelectorAll('a');
    links.forEach((link) => {
      expect(link.className).toContain('min-h-[44px]');
      expect(link.className).toContain('min-w-[44px]');
    });

    // Lock button
    const lockBtn = mobileNav.querySelector('button');
    expect(lockBtn).not.toBeNull();
    expect(lockBtn!.className).toContain('min-h-[44px]');
    expect(lockBtn!.className).toContain('min-w-[44px]');
  });
});
