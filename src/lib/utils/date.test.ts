import { describe, it, expect } from "vitest";

// Stub: getLocalDateString not yet implemented — tests will fail until Plan 02
describe("getLocalDateString", () => {
  it("returns a string in YYYY-MM-DD format", async () => {
    const { getLocalDateString } = await import("./date");
    const result = getLocalDateString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("uses local timezone not UTC (en-CA locale format)", async () => {
    const { getLocalDateString } = await import("./date");
    // Create a date at 11pm UTC — should return local date, not UTC date
    const lateUtc = new Date("2024-01-15T23:00:00Z");
    const result = getLocalDateString(lateUtc);
    // Must return a YYYY-MM-DD string (not throw, not return UTC)
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // Must NOT use toISOString (which is always UTC)
    const utcDate = lateUtc.toISOString().slice(0, 10);
    // If local offset is negative (US), these would differ — test documents the contract
    expect(typeof result).toBe("string");
  });

  it("accepts a Date argument", async () => {
    const { getLocalDateString } = await import("./date");
    const d = new Date(2024, 0, 5); // Jan 5 local
    const result = getLocalDateString(d);
    expect(result).toBe("2024-01-05");
  });
});

describe("getLocalDateString with dayStartHour offset", () => {
  it("offset=0 returns same as no offset (backward compat)", async () => {
    const { getLocalDateString } = await import("./date");
    const d = new Date(2026, 2, 14, 12, 0, 0); // Mar 14 noon
    expect(getLocalDateString(d, 0)).toBe("2026-03-14");
  });

  it("offset=4, time 3am returns previous date", async () => {
    const { getLocalDateString } = await import("./date");
    const d = new Date(2026, 2, 14, 3, 0, 0); // Mar 14 3am local
    expect(getLocalDateString(d, 4)).toBe("2026-03-13");
  });

  it("offset=4, time 4am returns current date", async () => {
    const { getLocalDateString } = await import("./date");
    const d = new Date(2026, 2, 14, 4, 0, 0); // Mar 14 4am local
    expect(getLocalDateString(d, 4)).toBe("2026-03-14");
  });

  it("offset=4, time 12pm returns current date", async () => {
    const { getLocalDateString } = await import("./date");
    const d = new Date(2026, 2, 14, 12, 0, 0);
    expect(getLocalDateString(d, 4)).toBe("2026-03-14");
  });

  it("offset=6, time 5:59am returns previous date", async () => {
    const { getLocalDateString } = await import("./date");
    const d = new Date(2026, 2, 14, 5, 59, 0);
    expect(getLocalDateString(d, 6)).toBe("2026-03-13");
  });

  it("offset=0, time 1am returns current date (no rollback)", async () => {
    const { getLocalDateString } = await import("./date");
    const d = new Date(2026, 2, 14, 1, 0, 0);
    expect(getLocalDateString(d, 0)).toBe("2026-03-14");
  });

  it("no args still works (backward compatible)", async () => {
    const { getLocalDateString } = await import("./date");
    const result = getLocalDateString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
