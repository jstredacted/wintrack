import { describe, it, expect } from "vitest";
import {
  getCurrentMonth,
  getMonthLabel,
  parseMonth,
  getPrevMonth,
  getNextMonth,
  getMonthYear,
} from "./month";

describe("getCurrentMonth", () => {
  it("returns a string matching YYYY-MM pattern", () => {
    const result = getCurrentMonth();
    expect(result).toMatch(/^\d{4}-\d{2}$/);
  });
});

describe("getMonthLabel", () => {
  it("formats March 2026 correctly", () => {
    expect(getMonthLabel("2026-03")).toBe("Mar 2026");
  });

  it("formats December 2026 correctly", () => {
    expect(getMonthLabel("2026-12")).toBe("Dec 2026");
  });
});

describe("parseMonth", () => {
  it("parses a month string into a Date object", () => {
    const date = parseMonth("2026-03");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2); // 0-indexed
    expect(date.getDate()).toBe(1);
  });
});

describe("getPrevMonth", () => {
  it("returns the previous month", () => {
    expect(getPrevMonth("2026-03")).toBe("2026-02");
  });

  it("handles year rollover", () => {
    expect(getPrevMonth("2026-01")).toBe("2025-12");
  });
});

describe("getNextMonth", () => {
  it("returns the next month", () => {
    expect(getNextMonth("2026-11")).toBe("2026-12");
  });

  it("handles year rollover", () => {
    expect(getNextMonth("2026-12")).toBe("2027-01");
  });
});

describe("getMonthYear", () => {
  it("parses year and month from string", () => {
    const result = getMonthYear("2026-03");
    expect(result).toEqual({ year: 2026, month: 3 });
  });
});
