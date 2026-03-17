// Wise fee constants (USD -> PHP)
// Source: https://wise.com/us/compare/wise-usd-to-php
export const WISE_FLAT_FEE = 1.02;
export const WISE_VARIABLE_RATE = 0.0057;

// PayPal spread on exchange rate
// Source: https://wise.com/us/compare/paypal-exchange-rate
export const PAYPAL_SPREAD_PERCENT = 0.03;

const PHP_FORMATTER = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPHP(amount: number): string {
  return PHP_FORMATTER.format(amount);
}

export function formatUSD(amount: number): string {
  return USD_FORMATTER.format(amount);
}

/**
 * Calculate net PHP received via Wise transfer.
 * Wise fee: flat fee + variable percentage of transfer amount.
 */
export function calculateWiseNetPHP(
  usdAmount: number,
  rate: number
): { fee: number; netUSD: number; netPHP: number } {
  const fee = WISE_FLAT_FEE + usdAmount * WISE_VARIABLE_RATE;
  const netUSD = usdAmount - fee;
  const netPHP = Math.round(netUSD * rate * 100) / 100;
  return { fee, netUSD, netPHP };
}

/**
 * Calculate net PHP received via PayPal transfer.
 * PayPal applies a spread (markup) on the mid-market exchange rate.
 */
export function calculatePayPalNetPHP(
  usdAmount: number,
  rate: number
): { fee: number; effectiveRate: number; netPHP: number } {
  const effectiveRate = rate * (1 - PAYPAL_SPREAD_PERCENT);
  const netPHP = Math.round(usdAmount * effectiveRate * 100) / 100;
  const fee = usdAmount * rate - netPHP;
  return { fee, effectiveRate, netPHP };
}
