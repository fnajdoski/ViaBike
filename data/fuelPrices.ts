/**
 * Per-country fuel prices — unleaded 95 / gasoline, EUR per liter.
 *
 * Live data lives in data/fuelPrices.json, refreshed every two weeks by
 * scripts/update-fuel-prices.ts (GitHub Action) from the OpenVan.camp public
 * fuel API (CC BY 4.0). The hardcoded fallback table below fills any country
 * the feed misses and keeps the app working if the JSON is ever broken —
 * a failed refresh can never produce empty prices.
 *
 * The UI must always show FUEL_PRICES_AS_OF and label figures "estimate".
 */
import priceData from "./fuelPrices.json";

/** Last-resort table (estimates compiled 2026-06) — only used per-country
 * when the refreshed JSON has no entry for that country. */
export const fallbackPricesEurPerLiter: Record<string, number> = {
  AL: 1.8,
  AT: 1.55,
  BA: 1.3,
  BE: 1.75,
  BG: 1.3,
  CH: 1.9, // priced in CHF locally
  CZ: 1.45,
  DE: 1.75,
  DK: 1.85,
  EE: 1.65,
  ES: 1.55,
  FI: 1.85,
  FR: 1.8,
  GB: 1.65,
  GR: 1.85,
  HR: 1.5,
  HU: 1.5,
  IE: 1.75,
  IT: 1.8,
  LI: 1.9,
  LT: 1.55,
  LU: 1.55,
  LV: 1.65,
  MD: 1.25,
  ME: 1.45,
  MK: 1.4,
  NL: 1.95,
  NO: 1.85,
  PL: 1.4,
  PT: 1.7,
  RO: 1.45,
  RS: 1.6,
  SE: 1.7,
  SI: 1.52,
  SK: 1.55,
  TR: 1.3,
  UA: 1.3,
  XK: 1.35,
};

type FuelPricesJson = {
  _lastUpdated?: string;
  _source?: string;
  prices?: Record<string, { petrol?: number | null }>;
};

/**
 * Merge refreshed JSON prices over the fallback table. Pure — unit-tested.
 * Invalid entries (missing/zero/negative) never displace a fallback price.
 */
export function mergeFuelPrices(
  json: FuelPricesJson | null | undefined,
  fallback: Record<string, number>,
): Record<string, number> {
  const merged = { ...fallback };
  for (const [iso2, entry] of Object.entries(json?.prices ?? {})) {
    const petrol = entry?.petrol;
    if (typeof petrol === "number" && petrol > 0) merged[iso2] = petrol;
  }
  return merged;
}

export const fuelPricesEurPerLiter = mergeFuelPrices(priceData as FuelPricesJson, fallbackPricesEurPerLiter);

export const FUEL_PRICES_AS_OF = `${(priceData as FuelPricesJson)._lastUpdated ?? "2026-06"} (estimate — verify before relying on it)`;

export const FUEL_PRICES_SOURCE =
  (priceData as FuelPricesJson)._source ?? "builtin fallback table";

/** Average used when a country is missing from both the feed and the table. */
export const FUEL_PRICE_DEFAULT_EUR = 1.65;
