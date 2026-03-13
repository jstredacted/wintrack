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

  it('applies bg-foreground class to completed days', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(yesterday);

    render(<ConsistencyGraph completionMap={{ [dateStr]: true }} days={7} />);
    const cells = screen.getAllByTestId('heatmap-cell');
    const completed = cells.filter((c) => c.className.includes('bg-foreground'));
    expect(completed.length).toBeGreaterThanOrEqual(1);
  });

  it('applies bg-border class to empty days', () => {
    render(<ConsistencyGraph completionMap={{}} days={7} />);
    const cells = screen.getAllByTestId('heatmap-cell');
    const empty = cells.filter((c) => c.className.includes('bg-border'));
    expect(empty.length).toBe(7);
  });
});
