/**
 * Refresh data/fuelPrices.json from the OpenVan.camp public fuel API.
 *
 * Data source: OpenVan.camp (CC BY 4.0) — https://openvan.camp/en/developers
 * Free, no registration, 134 countries, weekly from the EU Oil Bulletin and
 * official government sources. Prices arrive in LOCAL currency per liter
 * (or gallon); we normalize everything to EUR per liter using OpenVan's
 * EUR-based currency rates.
 *
 * Safety: the file is only rewritten when the fetch succeeds AND covers a
 * sane number of countries — a failed run leaves the last-good JSON alone.
 *
 * Run: node scripts/update-fuel-prices.ts   (Node 24+, type stripping)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_FILE = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "fuelPrices.json");
const PRICES_URL = "https://openvan.camp/api/fuel/prices?source=ridecost.vercel.app";
const RATES_URL = "https://openvan.camp/api/currency/rates";
const MIN_COUNTRIES = 50; // sanity floor — never ship a near-empty table
const LITERS_PER_US_GALLON = 3.78541;

type OpenVanCountry = {
  currency: string;
  unit: string;
  prices: { gasoline: number | null };
};

async function getJson(url: string): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    headers: { "User-Agent": "RideCost fuel-price updater (https://ridecost.vercel.app)" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json() as Promise<Record<string, unknown>>;
}

async function main() {
  const [pricesRes, ratesRes] = await Promise.all([getJson(PRICES_URL), getJson(RATES_URL)]);
  if (!pricesRes.success) throw new Error("fuel API returned success: false");
  const rates = (ratesRes as { rates: Record<string, number> }).rates;
  if (!rates?.EUR) throw new Error("currency API returned no EUR-based rates");

  const data = (pricesRes as unknown as { data: Record<string, OpenVanCountry> }).data;
  const prices: Record<string, { petrol: number }> = {};
  const skipped: string[] = [];

  for (const [iso2, entry] of Object.entries(data)) {
    const gasoline = entry?.prices?.gasoline;
    const rate = rates[entry?.currency];
    if (typeof gasoline !== "number" || gasoline <= 0 || !rate || rate <= 0) {
      skipped.push(iso2);
      continue;
    }
    let perLiterLocal = gasoline;
    if (entry.unit === "gallon") perLiterLocal = gasoline / LITERS_PER_US_GALLON;
    const eur = perLiterLocal / rate;
    if (eur < 0.2 || eur > 5) {
      // implausible after conversion — bad rate or unit; keep the fallback
      skipped.push(iso2);
      continue;
    }
    prices[iso2] = { petrol: Math.round(eur * 1000) / 1000 };
  }

  const count = Object.keys(prices).length;
  if (count < MIN_COUNTRIES) {
    throw new Error(`only ${count} usable countries (< ${MIN_COUNTRIES}) — keeping last-good file`);
  }

  const meta = (pricesRes as unknown as { meta?: { updated_at?: string } }).meta;
  const out = {
    _lastUpdated: new Date().toISOString().slice(0, 10),
    _sourceUpdatedAt: meta?.updated_at ?? null,
    _source: "OpenVan.camp public fuel API (CC BY 4.0) — https://openvan.camp/en/developers — normalized to EUR/liter (petrol/gasoline 95)",
    prices,
  };

  let previous = "";
  try {
    previous = readFileSync(OUT_FILE, "utf8");
  } catch {
    /* first run */
  }
  const next = JSON.stringify(out, null, 2) + "\n";
  // ignore the date stamps when deciding whether anything actually changed
  const stripStamps = (s: string) => s.replace(/"_lastUpdated[^\n]*\n/g, "").replace(/"_sourceUpdatedAt[^\n]*\n/g, "");
  if (stripStamps(previous) === stripStamps(next)) {
    console.log(`no price changes (${count} countries) — file untouched`);
    return;
  }
  writeFileSync(OUT_FILE, next);
  console.log(`wrote ${count} countries to data/fuelPrices.json (skipped: ${skipped.join(",") || "none"})`);
}

main().catch((err) => {
  console.error("update-fuel-prices FAILED — last-good file left in place:", err.message ?? err);
  process.exit(1);
});
