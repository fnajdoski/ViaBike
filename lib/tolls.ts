import { haversineKm } from "./geo";
import type { CountrySegment, LonLat } from "./types";

/** ORS extra_info tollways value triple: [startCoordIdx, endCoordIdx, value]. */
export type TollwayValue = [number, number, number];

/**
 * Attribute tollway distance per country from ORS `extra_info: ["tollways"]`.
 *
 * ORS marks geometry coordinate ranges as tollway (value ≥ 1) or free (0).
 * We sum the real distance of only the tollway ranges and bucket it by the
 * country of each sub-segment (looked up via the injected `countryAt`, so this
 * stays pure/testable). Free roads contribute nothing → a route with no
 * tollway segments yields an empty result (€0 tolls downstream).
 */
export function tollwaySegments(
  coords: LonLat[],
  values: TollwayValue[],
  countryAt: (p: LonLat) => string | null,
): CountrySegment[] {
  const km: Record<string, number> = {};
  const order: string[] = [];
  for (const [start, end, value] of values) {
    if (value < 1) continue; // free road
    for (let i = Math.max(0, start); i < Math.min(end, coords.length - 1); i++) {
      const a = coords[i];
      const b = coords[i + 1];
      const d = haversineKm(a, b);
      if (d === 0) continue;
      // attribute to the country at the segment midpoint
      const mid: LonLat = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const iso2 = countryAt(mid) ?? "??";
      if (!(iso2 in km)) {
        km[iso2] = 0;
        order.push(iso2);
      }
      km[iso2] += d;
    }
  }
  return order.map((iso2) => ({ iso2, km: km[iso2] }));
}
