import '@testing-library/jest-dom';

// jsdom does not implement window.matchMedia — provide a stub so tests that
// spy on it (e.g. useTheme) don't throw "vi.spyOn() can only spy on a function"
if (typeof window.matchMedia === "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
