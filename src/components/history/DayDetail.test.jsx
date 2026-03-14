import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DayDetail from './DayDetail';

// HISTORY-01: DayDetail renders win titles with completed/incomplete badges
// HISTORY-01: Renders empty state when no wins for date
// Wave 0 stub — all tests fail with module-not-found until Wave 2 creates DayDetail.jsx

const mockWinsCompleted = [
  { id: 'win-1', title: 'Ship the feature', completed: true },
  { id: 'win-2', title: 'Write the tests', completed: false },
];

describe('DayDetail', () => {
  describe('rendering wins', () => {
    it('renders win titles for the selected date', () => {
      render(<DayDetail wins={mockWinsCompleted} date="2026-03-09" />);
      expect(screen.getByText('Ship the feature')).toBeInTheDocument();
      expect(screen.getByText('Write the tests')).toBeInTheDocument();
    });

    it('renders a "Completed" badge for wins where check_in.completed === true', () => {
      render(<DayDetail wins={mockWinsCompleted} date="2026-03-09" />);
      expect(screen.getByText(/completed/i)).toBeInTheDocument();
    });

    it('renders an "Incomplete" badge for wins where check_in.completed === false', () => {
      render(<DayDetail wins={mockWinsCompleted} date="2026-03-09" />);
      expect(screen.getByText(/incomplete/i)).toBeInTheDocument();
    });

    it('renders correct number of wins', () => {
      render(<DayDetail wins={mockWinsCompleted} date="2026-03-09" />);
      // Both wins should be present
      expect(screen.getAllByText(/completed|incomplete/i)).toHaveLength(2);
    });
  });

  describe('empty state', () => {
    it('renders empty state message when no wins for date', () => {
      render(<DayDetail wins={[]} date="2026-03-09" />);
      expect(screen.getByText(/no wins/i)).toBeInTheDocument();
    });
  });

  describe('category badges', () => {
    it('renders category badge for non-default category on timeline item', () => {
      const winsWithCategory = [
        { id: 'win-1', title: 'Exercise', category: 'health', completed: true },
      ];
      render(<DayDetail wins={winsWithCategory} date="2026-03-09" />);
      expect(screen.getByText('health')).toBeInTheDocument();
    });

    it('does not render category badge for default work category', () => {
      const winsWithWork = [
        { id: 'win-1', title: 'Write tests', category: 'work', completed: false },
      ];
      render(<DayDetail wins={winsWithWork} date="2026-03-09" />);
      expect(screen.queryByText('work')).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('renders a loading indicator when loading prop is true', () => {
      render(<DayDetail wins={[]} date="2026-03-09" loading={true} />);
      // Should show some loading indicator
      expect(
        screen.getByText(/loading/i) ||
        document.querySelector('[aria-busy="true"]') ||
        document.querySelector('[data-testid="loading"]')
      ).toBeTruthy();
    });
  });
});
