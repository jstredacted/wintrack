import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsPage from './SettingsPage';

const mockSaveSettings = vi.fn();

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: { dayStartHour: 0, morningPromptHour: 9, eveningPromptHour: 21 },
    loading: false,
    saveSettings: mockSaveSettings,
  }),
}));

vi.mock('@/hooks/useHistory', () => ({
  useHistory: () => ({
    completionMap: {},
    loading: false,
  }),
}));

vi.mock('@/components/history/ConsistencyGraph', () => ({
  default: ({ completionMap }) => (
    <div data-testid="consistency-graph" />
  ),
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
});
