import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PinScreen from './PinScreen';

describe('PinScreen', () => {
  it('renders the heading', () => {
    render(<PinScreen onUnlock={vi.fn()} />);
    expect(screen.getByText('Enter your PIN')).toBeInTheDocument();
  });

  it('calls onUnlock when 4 digits are typed', async () => {
    const onUnlock = vi.fn().mockResolvedValue(true);
    render(<PinScreen onUnlock={onUnlock} />);

    fireEvent.keyDown(document, { key: '1' });
    fireEvent.keyDown(document, { key: '2' });
    fireEvent.keyDown(document, { key: '3' });
    fireEvent.keyDown(document, { key: '4' });

    await waitFor(() => {
      expect(onUnlock).toHaveBeenCalledWith('1234');
    });
  });

  it('triggers error state on wrong PIN', async () => {
    const onUnlock = vi.fn().mockResolvedValue(false);
    render(<PinScreen onUnlock={onUnlock} />);

    fireEvent.keyDown(document, { key: '1' });
    fireEvent.keyDown(document, { key: '2' });
    fireEvent.keyDown(document, { key: '3' });
    fireEvent.keyDown(document, { key: '4' });

    await waitFor(() => {
      expect(onUnlock).toHaveBeenCalledWith('1234');
    });

    // Dots should be in error state (destructive)
    const status = screen.getByRole('status');
    const dots = Array.from(status.children);
    dots.forEach((dot) => {
      expect(dot).toHaveClass('bg-destructive');
    });
  });

  it('supports backspace to remove last digit', () => {
    render(<PinScreen onUnlock={vi.fn()} />);

    fireEvent.keyDown(document, { key: '1' });
    fireEvent.keyDown(document, { key: '2' });
    fireEvent.keyDown(document, { key: 'Backspace' });

    // Should only have 1 filled dot now
    const status = screen.getByRole('status');
    const dots = Array.from(status.children);
    const filled = dots.filter((d) => d.classList.contains('bg-foreground'));
    expect(filled).toHaveLength(1);
  });

  it('ignores non-digit non-backspace keys', () => {
    render(<PinScreen onUnlock={vi.fn()} />);

    fireEvent.keyDown(document, { key: 'a' });
    fireEvent.keyDown(document, { key: 'Enter' });

    const status = screen.getByRole('status');
    const dots = Array.from(status.children);
    const filled = dots.filter((d) => d.classList.contains('bg-foreground'));
    expect(filled).toHaveLength(0);
  });
});
