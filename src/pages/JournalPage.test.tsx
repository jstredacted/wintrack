import { describe, it, expect, vi, type Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import JournalPage from './JournalPage';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then: vi.fn((resolve: (v: unknown) => unknown) => resolve({ data: [], error: null })),
    catch: vi.fn().mockReturnThis(),
  },
}));

vi.mock('@/hooks/useJournal', () => ({
  useJournal: vi.fn(() => ({
    entries: [],
    loading: false,
    addEntry: vi.fn(),
    editEntry: vi.fn(),
    deleteEntry: vi.fn(),
  })),
}));

// JOURNAL-03: JournalPage renders list of entries sorted by created_at DESC
// JOURNAL-03: Empty state renders when no entries exist
// Wave 0 stub — all tests fail with module-not-found until Wave 2 creates JournalPage.jsx

describe('JournalPage', () => {
  describe('empty state', () => {
    it('renders an empty state message when entries array is empty', async () => {
      const { useJournal } = await import('@/hooks/useJournal');
      (useJournal as Mock).mockReturnValue({
        entries: [],
        loading: false,
        addEntry: vi.fn(),
        editEntry: vi.fn(),
        deleteEntry: vi.fn(),
      });

      render(<JournalPage />);

      expect(screen.getByText(/no entries/i)).toBeInTheDocument();
    });
  });

  describe('entry list', () => {
    it('renders entry titles from the entries list', async () => {
      const { useJournal } = await import('@/hooks/useJournal');
      (useJournal as Mock).mockReturnValue({
        entries: [
          { id: 'entry-1', title: 'First Entry', body: 'Content one.', created_at: '2026-03-09T10:00:00Z', updated_at: '2026-03-09T10:00:00Z' },
          { id: 'entry-2', title: 'Second Entry', body: 'Content two.', created_at: '2026-03-08T10:00:00Z', updated_at: '2026-03-08T10:00:00Z' },
        ],
        loading: false,
        addEntry: vi.fn(),
        editEntry: vi.fn(),
        deleteEntry: vi.fn(),
      });

      render(<JournalPage />);

      expect(screen.getByText('First Entry')).toBeInTheDocument();
      expect(screen.getByText('Second Entry')).toBeInTheDocument();
    });

    it('renders entries sorted by created_at DESC (most recent first)', async () => {
      const { useJournal } = await import('@/hooks/useJournal');
      // entries already arrive sorted DESC from useJournal (hook queries with order desc)
      // page should render them in the order provided
      (useJournal as Mock).mockReturnValue({
        entries: [
          { id: 'entry-2', title: 'Newer Entry', body: 'Content two.', created_at: '2026-03-10T10:00:00Z', updated_at: '2026-03-10T10:00:00Z' },
          { id: 'entry-1', title: 'Older Entry', body: 'Content one.', created_at: '2026-03-09T10:00:00Z', updated_at: '2026-03-09T10:00:00Z' },
        ],
        loading: false,
        addEntry: vi.fn(),
        editEntry: vi.fn(),
        deleteEntry: vi.fn(),
      });

      render(<JournalPage />);

      const titles = screen.getAllByText(/Entry/);
      // "Newer Entry" should appear before "Older Entry" in the DOM
      const newerIndex = titles.findIndex(el => el.textContent === 'Newer Entry');
      const olderIndex = titles.findIndex(el => el.textContent === 'Older Entry');
      expect(newerIndex).toBeLessThan(olderIndex);
    });
  });

  describe('create button', () => {
    it('renders a button to create a new entry', async () => {
      const { useJournal } = await import('@/hooks/useJournal');
      (useJournal as Mock).mockReturnValue({
        entries: [],
        loading: false,
        addEntry: vi.fn(),
        editEntry: vi.fn(),
        deleteEntry: vi.fn(),
      });

      render(<JournalPage />);

      // Should have some way to create a new entry (New Entry, +, etc.)
      expect(
        screen.getByRole('button', { name: /new entry|add entry|\+|new/i })
      ).toBeInTheDocument();
    });
  });
});
