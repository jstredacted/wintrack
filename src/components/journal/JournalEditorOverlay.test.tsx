import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JournalEditorOverlay from './JournalEditorOverlay';

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }));

// Mock Tiptap — provide stubs so tests don't need a full DOM ProseMirror environment
vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => ({
    getHTML: () => '<p>test</p>',
    storage: { characterCount: { words: () => 5 } },
    isActive: () => false,
    commands: { setContent: vi.fn() },
    on: () => {},
  })),
  EditorContent: ({ editor }: { editor: unknown }) => (
    <div data-testid="tiptap-editor" aria-label="body" role="textbox" contentEditable>
      {editor ? 'editor' : ''}
    </div>
  ),
}));

vi.mock('@tiptap/starter-kit', () => ({ default: {} }));
vi.mock('@tiptap/extension-character-count', () => ({ default: {} }));
vi.mock('@tiptap/extension-placeholder', () => ({ default: { configure: vi.fn(() => ({})) } }));
vi.mock('./SlashCommand', () => ({ default: {} }));

describe('JournalEditorOverlay', () => {
  it('renders nothing when open is false', () => {
    render(<JournalEditorOverlay open={false} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders a dialog when open is true', () => {
    render(<JournalEditorOverlay open={true} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders the Tiptap editor in place of a textarea', () => {
    render(<JournalEditorOverlay open={true} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByTestId('tiptap-editor')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /body/i })).not.toBeNull();
    // no native textarea
    expect(document.querySelector('textarea')).not.toBeInTheDocument();
  });

  it('calls onSave with body_format="html" when save is submitted', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<JournalEditorOverlay open={true} onSave={onSave} onClose={vi.fn()} />);
    await user.type(screen.getByRole('textbox', { name: /title/i }), 'Test entry');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ body_format: 'html' })
    );
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
    let resolveSave: (() => void) | undefined;
    const onSave = vi.fn((): Promise<void> => new Promise((resolve) => { resolveSave = resolve; }));
    render(<JournalEditorOverlay open={true} onSave={onSave} onClose={vi.fn()} />);
    await user.type(screen.getByRole('textbox', { name: /title/i }), 'My entry');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
    resolveSave!();
  });
});
