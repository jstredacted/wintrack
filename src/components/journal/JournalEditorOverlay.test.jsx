import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JournalEditorOverlay from './JournalEditorOverlay';

// Wave 0 stub — fails with module-not-found until plan 05-04 creates JournalEditorOverlay.jsx

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }));

describe('JournalEditorOverlay', () => {
  it('renders nothing when open is false', () => {
    render(<JournalEditorOverlay open={false} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders a dialog when open is true', () => {
    render(<JournalEditorOverlay open={true} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows live word count that updates as user types in body textarea', async () => {
    const user = userEvent.setup();
    render(<JournalEditorOverlay open={true} onSave={vi.fn()} onClose={vi.fn()} />);
    const textarea = screen.getByRole('textbox', { name: /body/i });
    await user.type(textarea, 'Hello world');
    expect(screen.getByText(/2 words/i)).toBeInTheDocument();
  });

  it('shows summary screen with word count chip after save', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<JournalEditorOverlay open={true} onSave={onSave} onClose={vi.fn()} />);
    // Fill title (required)
    await user.type(screen.getByRole('textbox', { name: /title/i }), 'Test entry');
    await user.type(screen.getByRole('textbox', { name: /body/i }), 'One two three');
    await user.click(screen.getByRole('button', { name: /save/i }));
    // After save: summary screen with word count
    expect(await screen.findByText(/3 words/i)).toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<JournalEditorOverlay open={true} onSave={vi.fn()} onClose={onClose} />);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('shows "Saving\u2026" on Save button while async onSave is pending', async () => {
    const user = userEvent.setup();
    let resolveSave;
    const onSave = vi.fn(() => new Promise((resolve) => { resolveSave = resolve; }));
    render(<JournalEditorOverlay open={true} onSave={onSave} onClose={vi.fn()} />);
    await user.type(screen.getByRole('textbox', { name: /title/i }), 'My entry');
    await user.click(screen.getByRole('button', { name: /save/i }));
    // While save is pending, button text should be 'Saving...'
    expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
    resolveSave();
  });
});
