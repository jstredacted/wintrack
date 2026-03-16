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
  category: 'work',
  completed: false,
  created_at: '2026-03-09T10:00:00Z',
  user_id: 'test-user',
  win_date: '2026-03-09',
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

  it('renders category badge for non-default category (personal)', () => {
    render(
      <WinCard
        win={{ ...defaultWin, category: 'personal' }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('personal')).toBeInTheDocument();
  });

  it('does not render category badge for default category (work)', () => {
    render(
      <WinCard
        win={{ ...defaultWin, category: 'work' }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.queryByText('work')).not.toBeInTheDocument();
  });

  it('does not render category badge when category is undefined', () => {
    render(
      <WinCard
        win={{ ...defaultWin }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    // No badge text that would be a category label
    expect(screen.queryByText('health')).not.toBeInTheDocument();
    expect(screen.queryByText('personal')).not.toBeInTheDocument();
  });

  // INT-01: Toggle button renders and fires onToggle on click
  it('renders a toggle button that calls onToggle when clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <WinCard
        win={{ ...defaultWin, completed: false }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggle={onToggle}
      />
    );
    const toggleBtn = screen.getByRole('button', { name: /mark complete/i });
    expect(toggleBtn).toBeInTheDocument();
    await user.click(toggleBtn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  // INT-01: Completed win shows "Mark incomplete" aria-label
  it('shows "Mark incomplete" label when win is completed', () => {
    render(
      <WinCard
        win={{ ...defaultWin, completed: true }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggle={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /mark incomplete/i })).toBeInTheDocument();
  });

  // INT-02: Completed wins display line-through text styling
  it('applies line-through styling to completed win title', () => {
    render(
      <WinCard
        win={{ ...defaultWin, completed: true }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggle={vi.fn()}
      />
    );
    const title = screen.getByText('Write unit tests');
    expect(title.className).toContain('line-through');
    expect(title.className).toContain('text-muted-foreground');
  });

  // INT-02: Incomplete wins do NOT have line-through
  it('does not apply line-through styling to incomplete win title', () => {
    render(
      <WinCard
        win={{ ...defaultWin, completed: false }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggle={vi.fn()}
      />
    );
    const title = screen.getByText('Write unit tests');
    expect(title.className).not.toContain('line-through');
    expect(title.className).toContain('text-foreground');
  });

  it('renders without a card border class on the root element', () => {
    const { container } = render(
      <WinCard
        win={defaultWin}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    const root = container.firstChild as HTMLElement;
    // Phase 5 removes 'border border-border' from WinCard root div
    expect(root.className).not.toContain('border-border');
  });
});
