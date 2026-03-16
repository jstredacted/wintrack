import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PinDots } from './PinDots';

describe('PinDots', () => {
  it('renders 4 dots', () => {
    render(<PinDots digits="" error={false} onShakeEnd={() => {}} />);
    const status = screen.getByRole('status');
    const dots = status.children;
    expect(dots).toHaveLength(4);
  });

  it('fills dots matching digits length', () => {
    render(<PinDots digits="12" error={false} onShakeEnd={() => {}} />);
    const status = screen.getByRole('status');
    const dots = Array.from(status.children);

    // First two should be filled (bg-foreground), last two should be empty (border)
    expect(dots[0]).toHaveClass('bg-foreground');
    expect(dots[1]).toHaveClass('bg-foreground');
    expect(dots[2]).toHaveClass('border-2');
    expect(dots[3]).toHaveClass('border-2');
  });

  it('applies destructive styling on error', () => {
    render(<PinDots digits="1234" error={true} onShakeEnd={() => {}} />);
    const status = screen.getByRole('status');
    const dots = Array.from(status.children);

    dots.forEach((dot) => {
      expect(dot).toHaveClass('bg-destructive');
    });
  });

  it('calls onShakeEnd on animation end when error is true', () => {
    const onShakeEnd = vi.fn();
    render(<PinDots digits="1234" error={true} onShakeEnd={onShakeEnd} />);
    const status = screen.getByRole('status');

    // React onAnimationEnd listens to native 'animationend'
    act(() => {
      const event = new Event('animationend', { bubbles: true, cancelable: false });
      status.dispatchEvent(event);
    });
    expect(onShakeEnd).toHaveBeenCalledTimes(1);
  });

  it('has accessible live region', () => {
    render(<PinDots digits="12" error={false} onShakeEnd={() => {}} />);
    const live = screen.getByText('Digit 2 entered');
    expect(live).toHaveAttribute('aria-live', 'polite');
  });
});
