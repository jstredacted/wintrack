import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Heatmap from './Heatmap';

// HISTORY-02: Heatmap renders exactly N cells for N-day window
// HISTORY-02: Cell for completed day has distinct class/attribute vs incomplete day
// HISTORY-02: Renders without error when completionMap is {}
// Wave 0 stub — all tests fail with module-not-found until Wave 2 creates Heatmap.jsx

describe('Heatmap', () => {
  describe('cell count', () => {
    it('renders exactly 84 cells for the default 84-day window', () => {
      render(<Heatmap completionMap={{}} days={84} />);
      const cells = document.querySelectorAll('[data-testid="heatmap-cell"]');
      expect(cells).toHaveLength(84);
    });

    it('renders exactly N cells when days prop is provided', () => {
      render(<Heatmap completionMap={{}} days={30} />);
      const cells = document.querySelectorAll('[data-testid="heatmap-cell"]');
      expect(cells).toHaveLength(30);
    });

    it('renders 84 cells by default when no days prop provided', () => {
      render(<Heatmap completionMap={{}} />);
      const cells = document.querySelectorAll('[data-testid="heatmap-cell"]');
      expect(cells).toHaveLength(84);
    });
  });

  describe('completed vs incomplete styling', () => {
    it('cell for a completed day has a distinct class from an incomplete day', () => {
      const today = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(new Date());

      const completionMap = { [today]: true };
      render(<Heatmap completionMap={completionMap} days={1} />);

      const cells = document.querySelectorAll('[data-testid="heatmap-cell"]');
      expect(cells).toHaveLength(1);

      // The completed cell should have a distinguishing class (e.g., bg-foreground)
      // vs incomplete cells which use a muted class (e.g., bg-border)
      const completedCell = cells[0];
      expect(completedCell.className).toMatch(/bg-foreground/);
    });

    it('cell for an incomplete day has a muted class (bg-border)', () => {
      const today = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(new Date());

      const completionMap = { [today]: false };
      render(<Heatmap completionMap={completionMap} days={1} />);

      const cells = document.querySelectorAll('[data-testid="heatmap-cell"]');
      expect(cells).toHaveLength(1);

      const incompleteCell = cells[0];
      expect(incompleteCell.className).toMatch(/bg-border/);
    });

    it('cell for a day with no completionMap entry has a muted class', () => {
      render(<Heatmap completionMap={{}} days={1} />);

      const cells = document.querySelectorAll('[data-testid="heatmap-cell"]');
      expect(cells).toHaveLength(1);

      const unknownCell = cells[0];
      expect(unknownCell.className).toMatch(/bg-border/);
    });
  });

  describe('error resilience', () => {
    it('renders without error when completionMap is {}', () => {
      expect(() => render(<Heatmap completionMap={{}} />)).not.toThrow();
    });

    it('renders without error when completionMap has many entries', () => {
      const map = {};
      for (let i = 0; i < 84; i++) {
        const d = new Date(Date.now() - i * 86400000);
        const dateStr = new Intl.DateTimeFormat('en-CA', {
          year: 'numeric', month: '2-digit', day: '2-digit',
        }).format(d);
        map[dateStr] = i % 2 === 0;
      }
      expect(() => render(<Heatmap completionMap={map} />)).not.toThrow();
    });
  });
});
