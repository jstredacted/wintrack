import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import TodayPage from './TodayPage';

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }));
vi.mock('@/lib/env', () => ({ USER_ID: 'test-user' }));

const mockWin = {
  id: 'w1', title: 'Test win', timer_elapsed_seconds: 0, timer_started_at: null,
  status: 'pending', win_date: '2026-03-10', created_at: new Date().toISOString(),
};

vi.mock('@/hooks/useWins', () => ({
  useWins: vi.fn(() => ({
    wins: [mockWin], loading: false, error: null, yesterdayWins: [],
    addWin: vi.fn(), editWin: vi.fn(), deleteWin: vi.fn(), rollForward: vi.fn(),
    startTimer: vi.fn(), pauseTimer: vi.fn(), stopTimer: vi.fn(),
  })),
}));

vi.mock('@/stores/uiStore', () => ({
  useUIStore: vi.fn(() => ({
    inputOverlayOpen: false, rollForwardOfferedDate: null,
    openInputOverlay: vi.fn(), closeInputOverlay: vi.fn(),
    markRollForwardOffered: vi.fn(), checkinOverlayOpen: false,
    morningDismissedDate: null, eveningDismissedDate: null,
    openCheckinOverlay: vi.fn(), closeCheckinOverlay: vi.fn(),
    dismissMorningPrompt: vi.fn(), dismissEveningPrompt: vi.fn(),
    timerOverlayOpen: false, openTimerOverlay: vi.fn(),
    closeTimerOverlay: vi.fn(), refreshStreak: vi.fn(),
  })),
}));

vi.mock('@/hooks/useCheckin', () => ({
  useCheckin: vi.fn(() => ({ hasCheckedInToday: vi.fn().mockResolvedValue(false) })),
}));

// Stub heavy child components and WinList to isolate TodayPage render logic
vi.mock('@/components/wins/WinInputOverlay', () => ({ default: () => null }));
vi.mock('@/components/checkin/CheckInOverlay', () => ({ default: () => null }));
vi.mock('@/components/wins/TimerFocusOverlay', () => ({ default: () => null }));
vi.mock('@/components/checkin/MorningPrompt', () => ({ default: () => null }));
vi.mock('@/components/checkin/EveningPrompt', () => ({ default: () => null }));
vi.mock('@/components/wins/RollForwardPrompt', () => ({ default: () => null }));
vi.mock('@/components/wins/TotalFocusTime', () => ({ default: () => null }));
vi.mock('@/components/wins/WinList', () => ({
  default: ({ wins }) => <ul>{wins.map(w => <li key={w.id}>{w.title}</li>)}</ul>,
}));

describe('TodayPage — flash regression (FIX-02)', () => {
  it('renders win list without flicker when timer overlay state is closed', () => {
    render(<MemoryRouter><TodayPage /></MemoryRouter>);
    expect(screen.getByText('Test win')).toBeInTheDocument();
  });
});
