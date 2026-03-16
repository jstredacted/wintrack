import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WinInputOverlay from './WinInputOverlay';

vi.mock('@/lib/supabase');

// WIN-01: Full-screen overlay for win title input
// Wave 0 stub — all tests fail with module-not-found until Wave 2 creates WinInputOverlay.jsx

describe('WinInputOverlay', () => {
  it('renders the full-screen overlay when open=true', () => {
    render(
      <WinInputOverlay
        open={true}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when open=false', () => {
    render(
      <WinInputOverlay
        open={false}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('submitting the form with a non-empty title calls onSubmit with title and default category work', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <WinInputOverlay
        open={true}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />
    );
    const input = screen.getByRole('textbox');
    await user.type(input, '  Ship the feature  ');
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('Ship the feature', 'work');
  });

  it('pressing Escape calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <WinInputOverlay
        open={true}
        onSubmit={vi.fn()}
        onClose={onClose}
      />
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('submitting with empty/whitespace title does NOT call onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <WinInputOverlay
        open={true}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />
    );
    const input = screen.getByRole('textbox');
    await user.type(input, '   ');
    await user.keyboard('{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('renders 3 category buttons: Work, Personal, Health', () => {
    render(
      <WinInputOverlay
        open={true}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /work/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /personal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /health/i })).toBeInTheDocument();
  });

  it('clicking a category button updates selection (Work selected by default)', () => {
    render(
      <WinInputOverlay
        open={true}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const workBtn = screen.getByRole('button', { name: /work/i });
    const healthBtn = screen.getByRole('button', { name: /health/i });
    // Work is selected by default
    expect(workBtn.className).toContain('border-foreground');
    expect(healthBtn.className).not.toContain('border-foreground');
  });

  it('clicking Health then submitting calls onSubmit with (title, health)', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <WinInputOverlay
        open={true}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />
    );
    await user.click(screen.getByRole('button', { name: /health/i }));
    const input = screen.getByRole('textbox');
    await user.type(input, 'Run 5k');
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('Run 5k', 'health');
  });
});
