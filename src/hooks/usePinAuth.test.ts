import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePinStore } from '@/stores/pinStore';

// Mock supabase
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockUpsert = vi.fn(() => ({ error: null }));
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  upsert: mockUpsert,
}));

vi.mock('@/lib/supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

vi.mock('@/lib/env', () => ({
  USER_ID: '00000000-0000-0000-0000-000000000001',
}));

// Import after mocks
const { usePinAuth } = await import('@/hooks/usePinAuth');

describe('usePinAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePinStore.setState({ gateState: 'loading', blurred: false });
    // Clear sessionStorage
    try { sessionStorage.clear(); } catch {}
  });

  describe('initializeGate', () => {
    it('keeps gateState "unlocked" when sessionStorage flag is set', async () => {
      sessionStorage.setItem('wintrack-session', '1');
      usePinStore.setState({ gateState: 'unlocked' });

      const { initializeGate } = usePinAuth();
      await initializeGate();

      expect(usePinStore.getState().gateState).toBe('unlocked');
      // Should not have queried supabase
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('sets gateState to "setup" when no pin_hash exists in DB', async () => {
      mockSingle.mockResolvedValueOnce({ data: { pin_hash: null }, error: null });

      const { initializeGate } = usePinAuth();
      await initializeGate();

      expect(usePinStore.getState().gateState).toBe('setup');
    });

    it('sets gateState to "locked" when pin_hash exists and session not unlocked', async () => {
      mockSingle.mockResolvedValueOnce({ data: { pin_hash: 'abc123' }, error: null });

      const { initializeGate } = usePinAuth();
      await initializeGate();

      expect(usePinStore.getState().gateState).toBe('locked');
    });

    it('sets gateState to "locked" on fetch error (fail closed)', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'network error' } });

      const { initializeGate } = usePinAuth();
      await initializeGate();

      expect(usePinStore.getState().gateState).toBe('locked');
    });
  });

  describe('verify', () => {
    it('returns true when hash matches stored pin_hash', async () => {
      // First initialize with a known hash (SHA-256 of '1234')
      const knownHash = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';
      mockSingle.mockResolvedValueOnce({ data: { pin_hash: knownHash }, error: null });

      const { initializeGate, verify } = usePinAuth();
      await initializeGate();

      const result = await verify('1234');
      expect(result).toBe(true);
    });

    it('returns false when hash does not match', async () => {
      const knownHash = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';
      mockSingle.mockResolvedValueOnce({ data: { pin_hash: knownHash }, error: null });

      const { initializeGate, verify } = usePinAuth();
      await initializeGate();

      const result = await verify('5678');
      expect(result).toBe(false);
    });
  });

  describe('setup', () => {
    it('upserts pin_hash to user_settings and marks unlocked', async () => {
      const { setup } = usePinAuth();
      await setup('1234');

      expect(mockFrom).toHaveBeenCalledWith('user_settings');
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: '00000000-0000-0000-0000-000000000001',
          pin_hash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
        })
      );
      expect(usePinStore.getState().gateState).toBe('unlocked');
    });
  });
});
