import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import TodayPage from './TodayPage';

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }));
vi.mock('@/lib/env', () => ({ USER_ID: 'test-user' }));

const mockWin = {
  id: 'w1', title: 'Test win',
  status: 'pending', win_date: '2026-03-10', created_at: new Date().toISOString(),
};

vi.mock('@/hooks/useWins', () => ({
  useWins: vi.fn(() => ({
    wins: [mockWin], loading: false, error: null, yesterdayWins: [],
    addWin: vi.fn(), editWin: vi.fn(), deleteWin: vi.fn(), rollForward: vi.fn(),
    toggleWinCompleted: vi.fn(),
  })),
}));

vi.mock('@/stores/uiStore', () => ({
  useUIStore: vi.fn(() => ({
    inputOverlayOpen: false, rollForwardOfferedDate: null,
    openInputOverlay: vi.fn(), closeInputOverlay: vi.fn(),
    markRollForwardOffered: vi.fn(), refreshStreak: vi.fn(),
  })),
}));

// Stub heavy child components and WinList to isolate TodayPage render logic
vi.mock('@/components/wins/WinInputOverlay', () => ({ default: () => null }));
vi.mock('@/components/wins/RollForwardPrompt', () => ({ default: () => null }));
vi.mock('@/components/wins/WinList', () => ({
  default: ({ wins }) => <ul>{wins.map(w => <li key={w.id}>{w.title}</li>)}</ul>,
}));

describe('TodayPage', () => {
  it('renders win list', () => {
    render(<MemoryRouter><TodayPage /></MemoryRouter>);
    expect(screen.getByText('Test win')).toBeInTheDocument();
  });

  it('renders Set intentions button', () => {
    render(<MemoryRouter><TodayPage /></MemoryRouter>);
    expect(screen.getByLabelText('Set intentions')).toBeInTheDocument();
  });
});
