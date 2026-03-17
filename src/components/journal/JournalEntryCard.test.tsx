import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JournalEntryCard from './JournalEntryCard';

// JOURNAL-02: JournalEntryCard shows edit and delete buttons; delete calls onDelete prop with entry.id
// JOURNAL-02: Delete button is hidden when entry is in edit mode (editingId === entry.id)
// Wave 0 stub — all tests fail with module-not-found until Wave 2 creates JournalEntryCard.jsx

const mockEntry = {
  id: 'entry-1',
  title: 'My journal entry',
  body: 'Today was a good day.',
  body_format: 'plaintext',
  category: 'daily',
  created_at: '2026-03-09T10:00:00Z',
  updated_at: '2026-03-09T10:00:00Z',
  user_id: 'test-user',
};

describe('JournalEntryCard', () => {
  describe('rendering', () => {
    it('renders the entry title', () => {
      render(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          editingId={null}
        />
      );
      expect(screen.getByText('My journal entry')).toBeInTheDocument();
    });

    it('renders an edit button', () => {
      render(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          editingId={null}
        />
      );
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });

    it('renders a delete button', () => {
      render(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          editingId={null}
        />
      );
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('clicking delete calls onDelete with entry.id', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={vi.fn()}
          onDelete={onDelete}
          editingId={null}
        />
      );
      await user.click(screen.getByRole('button', { name: /delete/i }));
      expect(onDelete).toHaveBeenCalledWith('entry-1');
    });

    it('clicking edit calls onEdit with entry.id', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      render(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={onEdit}
          onDelete={vi.fn()}
          editingId={null}
        />
      );
      await user.click(screen.getByRole('button', { name: /edit/i }));
      expect(onEdit).toHaveBeenCalledWith('entry-1');
    });
  });

  describe('format-aware body rendering', () => {
    it('renders body with whitespace-pre-wrap when body_format is plaintext', () => {
      const { container } = render(
        <JournalEntryCard
          entry={{ ...mockEntry, body_format: 'plaintext' }}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          editingId={null}
        />
      );
      const pre = container.querySelector('.whitespace-pre-wrap');
      expect(pre).toBeInTheDocument();
      expect(pre?.textContent).toBe('Today was a good day.');
    });

    it('renders body with tiptap-content class and dangerouslySetInnerHTML when body_format is html', () => {
      const htmlBody = '<p>Hello <strong>world</strong></p>';
      const { container } = render(
        <JournalEntryCard
          entry={{ ...mockEntry, body: htmlBody, body_format: 'html' }}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          editingId={null}
        />
      );
      const htmlDiv = container.querySelector('.tiptap-content');
      expect(htmlDiv).toBeInTheDocument();
      expect(htmlDiv?.innerHTML).toBe(htmlBody);
    });
  });

  describe('edit mode guard', () => {
    it('delete button is hidden when editingId === entry.id', () => {
      render(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          editingId="entry-1"
        />
      );
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    it('delete button is visible when editingId !== entry.id', () => {
      render(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          editingId="entry-other"
        />
      );
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('delete button is visible when editingId is null', () => {
      render(
        <JournalEntryCard
          entry={mockEntry}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          editingId={null}
        />
      );
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });
  });
});
