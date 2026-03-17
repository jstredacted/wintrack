import { describe, it, expect } from "vitest";
import {
  formatPHP,
  formatUSD,
  calculateWiseNetPHP,
  calculatePayPalNetPHP,
  WISE_FLAT_FEE,
  WISE_VARIABLE_RATE,
  PAYPAL_SPREAD_PERCENT,
} from "./currency";

describe("formatPHP", () => {
  it("formats a positive amount with peso sign and commas", () => {
    const result = formatPHP(45000);
    expect(result).toContain("45,000.00");
  });

  it("formats zero", () => {
    const result = formatPHP(0);
    expect(result).toContain("0.00");
  });

  it("formats a negative amount", () => {
    const result = formatPHP(-1500.5);
    expect(result).toContain("1,500.50");
  });
});

describe("formatUSD", () => {
  it("formats a positive amount with dollar sign and commas", () => {
    const result = formatUSD(1000);
    expect(result).toContain("$");
    expect(result).toContain("1,000.00");
  });
});

describe("calculateWiseNetPHP", () => {
  it("calculates correct net PHP for a standard transfer", () => {
    const result = calculateWiseNetPHP(1000, 56.5);
    // fee = 1.02 + (1000 * 0.0057) = 1.02 + 5.70 = 6.72
    expect(result.fee).toBeCloseTo(6.72, 2);
    // netUSD = 1000 - 6.72 = 993.28
    expect(result.netUSD).toBeCloseTo(993.28, 2);
    // netPHP = 993.28 * 56.5 = 56,120.32
    expect(result.netPHP).toBeCloseTo(56120.32, 2);
  });

  it("handles zero amount", () => {
    const result = calculateWiseNetPHP(0, 56.5);
    // fee = 1.02 + 0 = 1.02, netUSD = -1.02, netPHP = -1.02 * 56.5
    expect(result.fee).toBeCloseTo(1.02, 2);
    expect(result.netUSD).toBeCloseTo(-1.02, 2);
  });

  it("exports fee constants", () => {
    expect(WISE_FLAT_FEE).toBe(1.02);
    expect(WISE_VARIABLE_RATE).toBe(0.0057);
  });
});

describe("calculatePayPalNetPHP", () => {
  it("calculates correct net PHP for a standard transfer", () => {
    const result = calculatePayPalNetPHP(1000, 56.5);
    // effectiveRate = 56.5 * (1 - 0.03) = 56.5 * 0.97 = 54.805
    expect(result.effectiveRate).toBeCloseTo(54.805, 3);
    // netPHP = 1000 * 54.805 = 54,805.00
    expect(result.netPHP).toBeCloseTo(54805.0, 2);
  });

  it("exports spread constant", () => {
    expect(PAYPAL_SPREAD_PERCENT).toBe(0.03);
  });
});
