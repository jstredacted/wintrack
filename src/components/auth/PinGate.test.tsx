import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { usePinStore } from '@/stores/pinStore';

// Mock usePinAuth — returns controllable functions
const mockInitializeGate = vi.fn();
const mockVerify = vi.fn();
const mockSetup = vi.fn();

vi.mock('@/hooks/usePinAuth', () => ({
  usePinAuth: () => ({
    initializeGate: mockInitializeGate,
    verify: mockVerify,
    setup: mockSetup,
  }),
}));

// Mock useIdleTimer — no-op in tests
vi.mock('@/hooks/useIdleTimer', () => ({
  useIdleTimer: vi.fn(),
  IDLE_TIMEOUT_MS: 900000,
}));

// Import PinGate AFTER mocks are set up
import PinGate from './PinGate';

function renderWithRouter(gateState: 'loading' | 'setup' | 'locked' | 'unlocked') {
  // Set the store state directly
  usePinStore.setState({ gateState, blurred: false });

  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<PinGate />}>
          <Route index element={<div data-testid="app-content">App Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('PinGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store
    usePinStore.setState({ gateState: 'loading', blurred: false });
  });

  it('renders blank loading screen when gateState is loading', () => {
    renderWithRouter('loading');
    // Should NOT render app content
    expect(screen.queryByTestId('app-content')).not.toBeInTheDocument();
    // Should NOT render PIN screens
    expect(screen.queryByText('Enter your PIN')).not.toBeInTheDocument();
    expect(screen.queryByText('Set your PIN')).not.toBeInTheDocument();
  });

  it('renders PinSetup when gateState is setup', () => {
    renderWithRouter('setup');
    expect(screen.getByText('Set your PIN')).toBeInTheDocument();
    expect(screen.queryByTestId('app-content')).not.toBeInTheDocument();
  });

  it('renders PinScreen when gateState is locked', () => {
    renderWithRouter('locked');
    expect(screen.getByText('Enter your PIN')).toBeInTheDocument();
    expect(screen.queryByTestId('app-content')).not.toBeInTheDocument();
  });

  it('renders Outlet content when gateState is unlocked', () => {
    renderWithRouter('unlocked');
    expect(screen.getByTestId('app-content')).toBeInTheDocument();
    expect(screen.queryByText('Enter your PIN')).not.toBeInTheDocument();
  });

  it('calls initializeGate on mount', () => {
    renderWithRouter('loading');
    expect(mockInitializeGate).toHaveBeenCalledTimes(1);
  });
});
