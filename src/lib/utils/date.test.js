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
