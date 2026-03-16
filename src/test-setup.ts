import '@testing-library/jest-dom';

// Node 22 provides crypto.subtle via globalThis, but jsdom may not expose it.
// Polyfill if missing so tests that use crypto.subtle (e.g. hashPin) work.
if (!globalThis.crypto?.subtle) {
  const { webcrypto } = await import('node:crypto');
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
}

// jsdom does not implement window.matchMedia — provide a stub so tests that
// spy on it (e.g. useTheme) don't throw "vi.spyOn() can only spy on a function"
if (typeof window.matchMedia === "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
