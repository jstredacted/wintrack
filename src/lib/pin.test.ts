import { describe, it, expect } from 'vitest';
import { hashPin } from '@/lib/pin';

describe('hashPin', () => {
  it('returns a 64-character lowercase hex string', async () => {
    const result = await hashPin('1234');
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic (same input produces same output)', async () => {
    const first = await hashPin('1234');
    const second = await hashPin('1234');
    expect(first).toBe(second);
  });

  it('produces different hashes for different inputs', async () => {
    const hash1 = await hashPin('1234');
    const hash2 = await hashPin('5678');
    expect(hash1).not.toBe(hash2);
  });

  it('uses crypto.subtle.digest (SHA-256)', async () => {
    // Known SHA-256 of '1234' — verifies we're using the correct algorithm
    const result = await hashPin('1234');
    expect(result).toBe(
      '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
    );
  });
});
