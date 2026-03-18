import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsPage from './SettingsPage';

const mockSaveSettings = vi.fn();

// Stable reference — avoids infinite re-render from useEffect dep on `settings`
const MOCK_SETTINGS = { dayStartHour: 0, morningPromptHour: 9, eveningPromptHour: 21 };

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: MOCK_SETTINGS,
    loading: false,
    saveSettings: mockSaveSettings,
  }),
}));

vi.mock('@/hooks/useHistory', () => {
  const map = {};
  return {
    useHistory: () => ({
      completionMap: map,
      loading: false,
    }),
  };
});

vi.mock('@/hooks/useIncomeConfig', () => ({
  useIncomeConfig: () => ({
    sources: [],
    loading: false,
    addSource: vi.fn(),
    updateSource: vi.fn(),
    removeSource: vi.fn(),
  }),
}));

vi.mock('@/components/history/ConsistencyGraph', () => ({
  default: (_props: { completionMap: Record<string, boolean> }) => (
    <div data-testid="consistency-graph" />
  ),
}));

vi.mock('@/components/history/CategoryRadar', () => ({
  default: () => <div data-testid="category-radar" />,
}));

vi.mock('@/components/NotificationPermission', () => ({
  default: () => <div data-testid="notification-permission" />,
}));

vi.mock('@/components/theme/ThemeToggle', () => ({
  default: () => <button data-testid="theme-toggle">Theme</button>,
}));

vi.mock('@/stores/pinStore', () => ({
  usePinStore: { getState: () => ({ setGateState: vi.fn() }) },
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: [] }) }) }),
      update: () => ({ eq: () => Promise.resolve({}) }),
    }),
  },
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    mockSaveSettings.mockClear();
  });

  it('renders form fields for day start hour, morning hour, evening hour', () => {
    render(<SettingsPage />);
    expect(screen.getByLabelText(/day start/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/morning/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/evening/i)).toBeInTheDocument();
  });

  it('calls saveSettings on submit with correct values', async () => {
    render(<SettingsPage />);
    const dayStart = screen.getByLabelText(/day start/i);
    fireEvent.change(dayStart, { target: { value: '4' } });

    const saveBtn = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockSaveSettings).toHaveBeenCalledWith({
        dayStartHour: 4,
        morningPromptHour: 9,
        eveningPromptHour: 21,
      });
    });
  });

  it('renders ConsistencyGraph', () => {
    render(<SettingsPage />);
    expect(screen.getByTestId('consistency-graph')).toBeInTheDocument();
  });

  it('renders 4 tab triggers', () => {
    render(<SettingsPage />);
    expect(screen.getByRole('tab', { name: 'General' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Income' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Security' })).toBeInTheDocument();
  });

  it('defaults to General tab active', () => {
    render(<SettingsPage />);
    const generalTab = screen.getByRole('tab', { name: 'General' });
    expect(generalTab).toHaveAttribute('data-state', 'active');
  });
});
