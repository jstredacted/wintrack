import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JournalEntryForm from './JournalEntryForm';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then: vi.fn((resolve) => resolve({ data: [], error: null })),
    catch: vi.fn().mockReturnThis(),
  },
}));

// JOURNAL-01: JournalEntryForm renders title input + body textarea, calls onSubmit on save
// JOURNAL-01: Save button is disabled when title is empty
// Wave 0 stub — all tests fail with module-not-found until Wave 2 creates JournalEntryForm.jsx

describe('JournalEntryForm', () => {
  describe('rendering', () => {
    it('renders a title input with placeholder "Title"', () => {
      render(<JournalEntryForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      expect(screen.getByPlaceholderText('Title')).toBeInTheDocument();
    });

    it('renders a body textarea with placeholder "Write your entry..."', () => {
      render(<JournalEntryForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      expect(screen.getByPlaceholderText('Write your entry...')).toBeInTheDocument();
    });

    it('renders a Save button', () => {
      render(<JournalEntryForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('renders a Cancel button', () => {
      render(<JournalEntryForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('Save button is disabled when title is empty string', () => {
      render(<JournalEntryForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });

    it('Save button is enabled when title has non-empty value', async () => {
      const user = userEvent.setup();
      render(<JournalEntryForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
      const titleInput = screen.getByPlaceholderText('Title');
      await user.type(titleInput, 'My title');
      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('submission', () => {
    it('calls onSubmit({ title, body }) when form submitted with valid title', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<JournalEntryForm onSubmit={onSubmit} onCancel={vi.fn()} />);

      await user.type(screen.getByPlaceholderText('Title'), 'T');
      await user.type(screen.getByPlaceholderText('Write your entry...'), 'B');
      await user.click(screen.getByRole('button', { name: /save/i }));

      expect(onSubmit).toHaveBeenCalledWith({ title: 'T', body: 'B' });
    });

    it('calls onCancel when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(<JournalEntryForm onSubmit={vi.fn()} onCancel={onCancel} />);
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('edit mode', () => {
    it('pre-fills title and body when initialTitle and initialBody props are provided', () => {
      render(
        <JournalEntryForm
          initialTitle="Existing Title"
          initialBody="Existing body."
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(screen.getByDisplayValue('Existing Title')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing body.')).toBeInTheDocument();
    });
  });
});
