import { FUEL_PRICE_DEFAULT_EUR, fuelPricesEurPerLiter } from "@/data/fuelPrices";
import { ASSUMED_MOTORWAY_SHARE, tollRatesEurPerKm } from "@/data/tollRates";
import { vignettes } from "@/data/vignettes";
import type {
  CostBreakdown,
  CountrySegment,
  ExtraCost,
  FuelCountryCost,
  TollCountryCost,
  VignetteItem,
} from "./types";

/** Collapse raw route segments into one entry per country, in route order. */
export function aggregateByCountry(segments: CountrySegment[]): CountrySegment[] {
  const order: string[] = [];
  const km: Record<string, number> = {};
  for (const s of segments) {
    if (!(s.iso2 in km)) {
      km[s.iso2] = 0;
      order.push(s.iso2);
    }
    km[s.iso2] += s.km;
  }
  return order.map((iso2) => ({ iso2, km: km[iso2] }));
}

/**
 * Per-country fuel cost: liters = km / 100 * effective consumption,
 * priced with that country's price — never one blended price.
 */
export function fuelBreakdown(
  segments: CountrySegment[],
  effectiveLper100: number,
  prices: Record<string, number> = fuelPricesEurPerLiter,
): FuelCountryCost[] {
  return aggregateByCountry(segments)
    .filter((s) => s.km > 0.5)
    .map((s) => {
      const liters = (s.km / 100) * effectiveLper100;
      const known = s.iso2 in prices;
      const pricePerLiterEur = known ? prices[s.iso2] : FUEL_PRICE_DEFAULT_EUR;
      return {
        iso2: s.iso2,
        km: s.km,
        liters,
        pricePerLiterEur,
        costEur: liters * pricePerLiterEur,
        estimate: true, // fallback table prices are always estimates
      };
    });
}

/** Rough per-country toll estimate — only used when TollGuru is unavailable. */
export function tollEstimate(segments: CountrySegment[]): TollCountryCost[] {
  return aggregateByCountry(segments)
    .map((s) => {
      const rate = tollRatesEurPerKm[s.iso2];
      if (!rate || s.km < 1) return null;
      return {
        iso2: s.iso2,
        km: s.km,
        costEur: s.km * ASSUMED_MOTORWAY_SHARE * rate.eurPerKm,
        note: rate.note,
      };
    })
    .filter((t): t is TollCountryCost => t !== null);
}

/**
 * Vignette line items for the countries crossed. These are FIXED-PERIOD
 * PASSES — shown as one-off items, clearly not a per-trip cost.
 * Countries where motorcycles are exempt produce a zero-cost info line.
 */
export function vignetteItems(segments: CountrySegment[]): VignetteItem[] {
  const crossed = new Set(aggregateByCountry(segments).map((s) => s.iso2));
  const items: VignetteItem[] = [];
  for (const v of vignettes) {
    if (!crossed.has(v.iso2)) continue;
    if (v.required) {
      items.push({
        iso2: v.iso2,
        label: `${v.country} — ${v.shortestPassLabel}`,
        priceEur: v.shortestPassPriceEur ?? 0,
        originalPrice: v.originalPrice,
        note: v.note,
      });
    } else {
      items.push({
        iso2: v.iso2,
        label: `${v.country} — motorcycles exempt`,
        priceEur: 0,
        note: v.note,
      });
    }
  }
  return items;
}

export function buildCostBreakdown(args: {
  segments: CountrySegment[];
  effectiveLper100: number;
  prices?: Record<string, number>;
  tollsOverride?: { tolls: TollCountryCost[]; source: "tollguru" } | null;
  extras?: ExtraCost[];
}): CostBreakdown {
  const fuel = fuelBreakdown(args.segments, args.effectiveLper100, args.prices);
  const tolls = args.tollsOverride?.tolls ?? tollEstimate(args.segments);
  const vigs = vignetteItems(args.segments);
  const fuelTotalEur = fuel.reduce((a, f) => a + f.costEur, 0);
  const tollsTotalEur = tolls.reduce((a, t) => a + t.costEur, 0);
  const vignettesTotalEur = vigs.reduce((a, v) => a + v.priceEur, 0);
  const extrasTotalEur = (args.extras ?? []).reduce((a, e) => a + e.amountEur, 0);
  return {
    fuel,
    fuelTotalEur,
    tolls,
    tollsTotalEur,
    tollsSource: args.tollsOverride ? "tollguru" : "builtin-estimate",
    vignettes: vigs,
    vignettesTotalEur,
    extrasTotalEur,
    totalEur: fuelTotalEur + tollsTotalEur + vignettesTotalEur + extrasTotalEur,
  };
}
