import { describe, it, expect, beforeEach, vi } from "vitest";

// Stub: useTheme not yet implemented — tests will fail until Plan 04
describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    vi.restoreAllMocks();
  });

  it("toggles .dark class on <html> when toggle() is called", async () => {
    const { renderHook, act } = await import("@testing-library/react");
    const { useTheme } = await import("./useTheme");
    const { result } = renderHook(() => useTheme());
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    act(() => result.current.toggle());
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("persists theme to localStorage on toggle", async () => {
    const { renderHook, act } = await import("@testing-library/react");
    const { useTheme } = await import("./useTheme");
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());
    expect(localStorage.getItem("wintrack-theme")).toBe("dark");
  });

  it("reads system dark preference as default when no localStorage value", async () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    document.documentElement.classList.add("dark");
    const { renderHook } = await import("@testing-library/react");
    const { useTheme } = await import("./useTheme");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
  });
});
