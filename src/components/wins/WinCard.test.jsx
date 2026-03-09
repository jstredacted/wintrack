import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WinCard from './WinCard';

vi.mock('@/lib/supabase');

// WIN-02: Inline edit of win title
// WIN-03: Delete win
// Wave 0 stub — all tests fail with module-not-found until Wave 2 creates WinCard.jsx

const defaultWin = {
  id: 'win-1',
  title: 'Write unit tests',
  timer_elapsed_seconds: 0,
  timer_started_at: null,
};

describe('WinCard', () => {
  it('renders the win title', () => {
    render(
      <WinCard
        win={defaultWin}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('Write unit tests')).toBeInTheDocument();
  });

  it('clicking the edit trigger shows an editable input pre-filled with the title', async () => {
    const user = userEvent.setup();
    render(
      <WinCard
        win={defaultWin}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    // Click edit trigger (pencil icon button or title)
    const editTrigger = screen.getByRole('button', { name: /edit/i });
    await user.click(editTrigger);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('Write unit tests');
  });

  it('submitting the inline edit form (Enter) calls onEdit with the new title', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <WinCard
        win={defaultWin}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />
    );
    const editTrigger = screen.getByRole('button', { name: /edit/i });
    await user.click(editTrigger);
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'Updated win title');
    await user.keyboard('{Enter}');
    expect(onEdit).toHaveBeenCalledWith('Updated win title');
  });

  it('pressing Escape in inline edit mode cancels and restores display', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <WinCard
        win={defaultWin}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />
    );
    const editTrigger = screen.getByRole('button', { name: /edit/i });
    await user.click(editTrigger);
    await user.keyboard('{Escape}');
    // Edit mode closed, original title visible again, onEdit not called
    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.getByText('Write unit tests')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('clicking the delete button calls onDelete', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <WinCard
        win={defaultWin}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />
    );
    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteBtn);
    expect(onDelete).toHaveBeenCalled();
  });
});
