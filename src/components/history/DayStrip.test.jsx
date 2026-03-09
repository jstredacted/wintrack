import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DayStrip from './DayStrip';
import { getLocalDateString } from '@/lib/utils/date';

const today = getLocalDateString(new Date());
const yesterday = getLocalDateString(new Date(Date.now() - 86400000));

describe('DayStrip', () => {
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
});
