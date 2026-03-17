import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConsistencyGraph from './ConsistencyGraph';

describe('ConsistencyGraph', () => {
  it('renders 84 heatmap cells by default', () => {
    render(<ConsistencyGraph completionMap={{}} />);
    const cells = screen.getAllByTestId('heatmap-cell');
    expect(cells).toHaveLength(84);
  });

  it('renders configurable number of cells via days prop', () => {
    render(<ConsistencyGraph completionMap={{}} days={14} />);
    const cells = screen.getAllByTestId('heatmap-cell');
    expect(cells).toHaveLength(14);
  });

  it('applies intensity=4 to completed days (boolean true entry)', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(yesterday);

    render(<ConsistencyGraph completionMap={{ [dateStr]: true }} days={7} />);
    const cells = screen.getAllByTestId('heatmap-cell');
    const completed = cells.filter((c) => c.getAttribute('data-intensity') === '4');
    expect(completed.length).toBeGreaterThanOrEqual(1);
  });

  it('applies intensity=0 to empty days', () => {
    render(<ConsistencyGraph completionMap={{}} days={7} />);
    const cells = screen.getAllByTestId('heatmap-cell');
    const empty = cells.filter((c) => c.getAttribute('data-intensity') === '0');
    expect(empty.length).toBe(7);
  });

  it('totalCompleted does not produce NaN when cell.entry.completed is undefined', () => {
    // Entry with undefined completed field should be treated as 0, not NaN
    const today = new Date();
    const dateStr = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(today);

    // completionMap entry with undefined completed (simulates a bad/partial shape)
    const badEntry = { total: 3 } as { completed: number; total: number };
    render(<ConsistencyGraph completionMap={{ [dateStr]: badEntry }} days={1} />);

    // The summary text should show a valid number (0), not NaN
    const summary = screen.getByText(/win.*completed in the last/i);
    expect(summary.textContent).not.toContain('NaN');
    expect(summary.textContent).toMatch(/^\d/);
  });
});
