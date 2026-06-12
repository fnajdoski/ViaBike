/**
 * Currency conversion table — units of local currency per 1 EUR.
 *
 * ESTIMATES as of the date below; the UI shows everything normalized to EUR
 * with a "rates as of" freshness note. Swap in a live FX source later.
 */
export const CURRENCY_RATES_AS_OF = "2026-06 (estimate)";

export const perEur: Record<string, number> = {
  EUR: 1,
  CHF: 0.94,
  MKD: 61.5,
  RSD: 117,
  HUF: 400,
  CZK: 25,
  PLN: 4.3,
  RON: 5.0,
  BGN: 1.9558,
  BAM: 1.9558,
  GBP: 0.85,
  NOK: 11.5,
  SEK: 11.2,
  DKK: 7.46,
  TRY: 47,
  ALL: 99,
  UAH: 48,
  MDL: 19.5,
};

/** Convert an amount in `currency` to EUR; returns null for unknown currencies. */
export function toEur(amount: number, currency: string): number | null {
  const rate = perEur[currency.toUpperCase()];
  if (!rate) return null;
  return amount / rate;
}
