import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

vi.mock('@/hooks/useHistory', () => ({
  useHistory: vi.fn(() => ({
    completionMap: {}, loading: false,
    fetchWinsForDate: vi.fn().mockResolvedValue([]),
  })),
}));

vi.mock('@/stores/uiStore', () => ({
  useUIStore: vi.fn(() => ({
    inputOverlayOpen: false, rollForwardOfferedDate: null,
    openInputOverlay: vi.fn(), closeInputOverlay: vi.fn(),
    markRollForwardOffered: vi.fn(), refreshStreak: vi.fn(),
  })),
}));

vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: vi.fn((sel: (s: { settings: { dayStartHour: number } }) => unknown) => sel({ settings: { dayStartHour: 0 } })),
}));

// Stub heavy child components
vi.mock('@/components/wins/WinInputOverlay', () => ({ default: () => null }));
vi.mock('@/components/wins/RollForwardPrompt', () => ({ default: () => null }));
vi.mock('@/components/wins/WinList', () => ({
  default: ({ wins }: { wins: Array<{ id: string; title: string }> }) => <ul>{wins.map((w: { id: string; title: string }) => <li key={w.id}>{w.title}</li>)}</ul>,
}));
vi.mock('@/components/wins/CategorySummary', () => ({ default: () => null }));

vi.mock('@/components/history/DayStrip', () => ({
  default: ({ selectedDate, onSelectDate }: { selectedDate: string; onSelectDate?: (d: string) => void }) => (
    <div data-testid="day-strip" onClick={() => onSelectDate?.('2026-03-10')}>
      {selectedDate}
    </div>
  ),
}));
vi.mock('@/components/history/DayDetail', () => ({
  default: ({ date, wins, loading }: { date: string; wins?: Array<{ id: string; title: string }>; loading?: boolean }) => (
    <div data-testid="day-detail">
      {loading ? 'Loading...' : wins?.map((w: { id: string; title: string }) => <span key={w.id}>{w.title}</span>)}
    </div>
  ),
}));

describe('TodayPage', () => {
  it('renders DayStrip on main page', () => {
    render(<MemoryRouter><TodayPage /></MemoryRouter>);
    expect(screen.getByTestId('day-strip')).toBeInTheDocument();
  });

  it('shows editable win list when today is selected', () => {
    render(<MemoryRouter><TodayPage /></MemoryRouter>);
    expect(screen.getByText('Test win')).toBeInTheDocument();
    expect(screen.getByLabelText('Set intentions')).toBeInTheDocument();
  });

  it('shows DayDetail when past date selected', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><TodayPage /></MemoryRouter>);

    await user.click(screen.getByTestId('day-strip'));

    await waitFor(() => {
      expect(screen.getByTestId('day-detail')).toBeInTheDocument();
    });
  });

  it('hides roll-forward and set-intentions on past dates', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><TodayPage /></MemoryRouter>);

    await user.click(screen.getByTestId('day-strip'));

    await waitFor(() => {
      expect(screen.queryByLabelText('Set intentions')).not.toBeInTheDocument();
    });
  });

  it('renders greeting header for today', () => {
    render(<MemoryRouter><TodayPage /></MemoryRouter>);
    expect(
      screen.getByText(/good (morning|afternoon|evening)/i)
    ).toBeInTheDocument();
  });
});
