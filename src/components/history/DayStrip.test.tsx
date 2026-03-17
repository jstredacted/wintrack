import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DayStrip from './DayStrip';
import { getLocalDateString } from '@/lib/utils/date';

const today = getLocalDateString(new Date());
const yesterday = getLocalDateString(new Date(Date.now() - 86400000));

// Mock settingsStore — tests override dayStartHour per-case
let mockDayStartHour = 0;
vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: (selector: (s: { settings: { dayStartHour: number } }) => unknown) =>
    selector({ settings: { dayStartHour: mockDayStartHour } }),
}));

describe('DayStrip', () => {
  afterEach(() => {
    mockDayStartHour = 0;
    vi.useRealTimers();
  });

  it('renders N day cells for N days', () => {
    render(<DayStrip completionMap={{}} selectedDate={today} onSelectDate={vi.fn()} days={7} />);
    // Use data-testid to count only day cells, not arrow buttons
    const cells = screen.getAllByTestId('day-cell');
    expect(cells).toHaveLength(7);
  });

  it('shows a checkmark indicator for completed days', () => {
    const completionMap = { [yesterday]: true };
    render(<DayStrip completionMap={completionMap} selectedDate={today} onSelectDate={vi.fn()} days={7} />);
    const completedCell = screen.getByRole('button', { name: new RegExp(yesterday) });
    expect(completedCell).toHaveAttribute('data-completed', 'true');
  });

  it('calls onSelectDate with the date string when a cell is clicked', async () => {
    const user = userEvent.setup();
    const onSelectDate = vi.fn();
    render(<DayStrip completionMap={{}} selectedDate={today} onSelectDate={onSelectDate} days={7} />);
    const firstCell = screen.getAllByTestId('day-cell')[0];
    await user.click(firstCell);
    expect(onSelectDate).toHaveBeenCalledWith(expect.any(String));
  });

  it('when dayStartHour=3 and current time is 2:30 AM, the rightmost cell dateStr and dateNum both represent yesterday', () => {
    // At 2:30 AM with dayStartHour=3, the logical day is "yesterday"
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T02:30:00')); // 2:30 AM
    mockDayStartHour = 3;

    render(<DayStrip completionMap={{}} selectedDate="2026-06-14" onSelectDate={vi.fn()} days={3} />);

    const cells = screen.getAllByTestId('day-cell');
    const rightmost = cells[cells.length - 1];

    // The rightmost cell should have aria-label of yesterday's date (2026-06-14)
    expect(rightmost).toHaveAttribute('aria-label', '2026-06-14');
    // dateNum should be 14, not 15
    expect(rightmost.textContent).toContain('14');
  });
});
