import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PinScreen from './PinScreen';

function getInput() {
  return screen.getByLabelText('PIN input') as HTMLInputElement;
}

function typeDigits(input: HTMLInputElement, value: string) {
  // Simulate typing into the uncontrolled input
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('PinScreen', () => {
  it('renders the heading', () => {
    render(<PinScreen onUnlock={vi.fn()} />);
    expect(screen.getByText('Enter your PIN')).toBeInTheDocument();
  });

  it('calls onUnlock when 4 digits are typed', async () => {
    const onUnlock = vi.fn().mockResolvedValue(true);
    render(<PinScreen onUnlock={onUnlock} />);

    const input = getInput();
    typeDigits(input, '1234');

    await waitFor(() => {
      expect(onUnlock).toHaveBeenCalledWith('1234');
    });
  });

  it('triggers error state on wrong PIN', async () => {
    const onUnlock = vi.fn().mockResolvedValue(false);
    render(<PinScreen onUnlock={onUnlock} />);

    const input = getInput();
    typeDigits(input, '1234');

    await waitFor(() => {
      expect(onUnlock).toHaveBeenCalledWith('1234');
    });

    // Dots should be in error state (destructive)
    await waitFor(() => {
      const status = screen.getByRole('status');
      const dots = Array.from(status.children);
      dots.forEach((dot) => {
        expect(dot).toHaveClass('bg-destructive');
      });
    });
  });

  it('supports backspace to remove last digit', () => {
    render(<PinScreen onUnlock={vi.fn()} />);

    const input = getInput();
    typeDigits(input, '12');

    // Should have 2 filled dots
    const status = screen.getByRole('status');
    let filled = Array.from(status.children).filter((d) => d.classList.contains('bg-foreground'));
    expect(filled).toHaveLength(2);

    // Simulate backspace — value goes from "12" to "1"
    typeDigits(input, '1');

    filled = Array.from(status.children).filter((d) => d.classList.contains('bg-foreground'));
    expect(filled).toHaveLength(1);
  });

  it('ignores non-digit keys via input filtering', () => {
    render(<PinScreen onUnlock={vi.fn()} />);

    const input = getInput();
    typeDigits(input, 'abc');

    const status = screen.getByRole('status');
    const filled = Array.from(status.children).filter((d) => d.classList.contains('bg-foreground'));
    expect(filled).toHaveLength(0);
  });
});
