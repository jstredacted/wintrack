import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PinSetup from './PinSetup';

describe('PinSetup', () => {
  it('renders step 1 heading and subtitle', () => {
    render(<PinSetup onComplete={vi.fn()} />);
    expect(screen.getByText('Set your PIN')).toBeInTheDocument();
    expect(screen.getByText('Choose a 4-digit PIN')).toBeInTheDocument();
  });

  it('advances to confirm step after entering 4 digits', async () => {
    render(<PinSetup onComplete={vi.fn()} />);

    fireEvent.keyDown(document, { key: '1' });
    fireEvent.keyDown(document, { key: '2' });
    fireEvent.keyDown(document, { key: '3' });
    fireEvent.keyDown(document, { key: '4' });

    await waitFor(() => {
      expect(screen.getByText('Confirm your PIN')).toBeInTheDocument();
      expect(screen.getByText('Enter it again to confirm')).toBeInTheDocument();
    });
  });

  it('calls onComplete when PINs match', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    render(<PinSetup onComplete={onComplete} />);

    // Enter step
    fireEvent.keyDown(document, { key: '5' });
    fireEvent.keyDown(document, { key: '6' });
    fireEvent.keyDown(document, { key: '7' });
    fireEvent.keyDown(document, { key: '8' });

    await waitFor(() => {
      expect(screen.getByText('Confirm your PIN')).toBeInTheDocument();
    });

    // Confirm step — same PIN
    fireEvent.keyDown(document, { key: '5' });
    fireEvent.keyDown(document, { key: '6' });
    fireEvent.keyDown(document, { key: '7' });
    fireEvent.keyDown(document, { key: '8' });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith('5678');
    });
  });

  describe('mismatch flow', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('shows mismatch error when PINs differ and resets', async () => {
      const onComplete = vi.fn();
      render(<PinSetup onComplete={onComplete} />);

      // Enter step
      act(() => {
        fireEvent.keyDown(document, { key: '1' });
        fireEvent.keyDown(document, { key: '2' });
        fireEvent.keyDown(document, { key: '3' });
        fireEvent.keyDown(document, { key: '4' });
      });

      // Need to flush the useEffect that transitions to confirm
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(screen.getByText('Confirm your PIN')).toBeInTheDocument();

      // Confirm step — different PIN
      act(() => {
        fireEvent.keyDown(document, { key: '5' });
        fireEvent.keyDown(document, { key: '6' });
        fireEvent.keyDown(document, { key: '7' });
        fireEvent.keyDown(document, { key: '8' });
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(screen.getByText("PINs didn't match")).toBeInTheDocument();
      expect(screen.getByText("Let's try again")).toBeInTheDocument();

      // Simulate shake animation end — dispatch native event so React's onAnimationEnd fires
      act(() => {
        const status = screen.getByRole('status');
        status.dispatchEvent(new Event('animationend', { bubbles: true }));
      });

      // After 1.5s should reset to enter step
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });

      expect(screen.getByText('Set your PIN')).toBeInTheDocument();
      expect(onComplete).not.toHaveBeenCalled();
    });
  });
});
