import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DayDetail from './DayDetail';

// HISTORY-01: DayDetail renders win titles with completed/incomplete badges
// HISTORY-01: Renders empty state when no wins for date
// Wave 0 stub — all tests fail with module-not-found until Wave 2 creates DayDetail.jsx

const mockWinsCompleted = [
  { id: 'win-1', title: 'Ship the feature', category: 'work', completed: true },
  { id: 'win-2', title: 'Write the tests', category: 'work', completed: false },
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
      const winsWithCategory: Array<{ id: string; title: string; category: string; completed: boolean }> = [
        { id: 'win-1', title: 'Exercise', category: 'health', completed: true },
      ];
      render(<DayDetail wins={winsWithCategory} date="2026-03-09" />);
      expect(screen.getByText('health')).toBeInTheDocument();
    });

    it('does not render category badge for default work category', () => {
      const winsWithWork: Array<{ id: string; title: string; category: string; completed: boolean }> = [
        { id: 'win-1', title: 'Write tests', category: 'work', completed: false },
      ];
      render(<DayDetail wins={winsWithWork} date="2026-03-09" />);
      expect(screen.queryByText('work')).not.toBeInTheDocument();
    });
  });

  describe('timeline structure', () => {
    // TIMELINE-01: Vertical timeline layout with connecting line
    it('renders a vertical connecting line container', () => {
      const { container } = render(<DayDetail wins={mockWinsCompleted} date="2026-03-09" />);
      const lineContainer = container.querySelector('.border-l.border-border.ml-\\[7px\\]');
      expect(lineContainer).toBeInTheDocument();
    });

    // TIMELINE-01: Timeline dots are rendered for each win
    it('renders timeline dots for each win item', () => {
      const { container } = render(<DayDetail wins={mockWinsCompleted} date="2026-03-09" />);
      const dots = container.querySelectorAll('.rounded-full.border-2');
      expect(dots).toHaveLength(2);
    });

    // TIMELINE-01: Timeline items use relative + pl-8 layout
    it('renders timeline items with relative positioning and left padding', () => {
      const { container } = render(<DayDetail wins={mockWinsCompleted} date="2026-03-09" />);
      const items = container.querySelectorAll('.relative.pl-8');
      expect(items).toHaveLength(2);
    });

    // TIMELINE-02: Completed win dot is filled (bg-foreground)
    it('renders a filled dot for completed wins', () => {
      const completedOnly = [{ id: 'win-1', title: 'Done task', category: 'work', completed: true }];
      const { container } = render(<DayDetail wins={completedOnly} date="2026-03-09" />);
      const dot = container.querySelector('.rounded-full.border-2');
      expect(dot!.className).toContain('bg-foreground');
      expect(dot!.className).toContain('border-foreground');
    });

    // TIMELINE-02: Incomplete win dot is hollow (bg-background)
    it('renders a hollow dot for incomplete wins', () => {
      const incompleteOnly = [{ id: 'win-1', title: 'Open task', category: 'work', completed: false }];
      const { container } = render(<DayDetail wins={incompleteOnly} date="2026-03-09" />);
      const dot = container.querySelector('.rounded-full.border-2');
      expect(dot!.className).toContain('bg-background');
      expect(dot!.className).toContain('border-border');
    });

    // TIMELINE-02: Completed win card has foreground left border accent
    it('renders foreground left border accent for completed wins', () => {
      const completedOnly = [{ id: 'win-1', title: 'Done task', category: 'work', completed: true }];
      const { container } = render(<DayDetail wins={completedOnly} date="2026-03-09" />);
      const card = container.querySelector('.border-l-2.pl-4');
      expect(card!.className).toContain('border-foreground');
    });

    // TIMELINE-02: Incomplete win card has muted left border accent
    it('renders muted left border accent for incomplete wins', () => {
      const incompleteOnly = [{ id: 'win-1', title: 'Open task', category: 'work', completed: false }];
      const { container } = render(<DayDetail wins={incompleteOnly} date="2026-03-09" />);
      const card = container.querySelector('.border-l-2.pl-4');
      expect(card!.className).toContain('border-border/40');
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
