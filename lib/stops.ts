import {
  FUEL_WINDOW_KM,
  MAX_DETOUR_KM,
  REFUEL_AT_FRACTION,
  REST_NEAR_FUEL_KM,
  REST_WINDOW_KM,
  SKIP_REST_NEAR_END_KM,
} from "./constants";
import { pointAtKm } from "./geo";
import type { LonLat, PlannedStop, RoutePoi } from "./types";

/**
 * Plain fuel targets, ignoring station availability: refuel at 85% of range
 * until the destination is reachable on the current tank.
 */
export function planFuelTargets(
  totalKm: number,
  rangeKm: number,
  refuelAtFraction = REFUEL_AT_FRACTION,
): number[] {
  const targets: number[] = [];
  let lastFuelKm = 0;
  // guard: a range this small means bad input; avoid an endless loop
  if (rangeKm < 30) return targets;
  while (totalKm - lastFuelKm > rangeKm) {
    lastFuelKm += rangeKm * refuelAtFraction;
    targets.push(lastFuelKm);
  }
  return targets;
}

/** Rest targets at a fixed cadence, skipping the run-in to the destination. */
export function planRestTargets(totalKm: number, intervalKm: number): number[] {
  const targets: number[] = [];
  if (intervalKm < 10) return targets;
  for (let km = intervalKm; km < totalKm - SKIP_REST_NEAR_END_KM; km += intervalKm) {
    targets.push(km);
  }
  return targets;
}

/** Convert a time cadence to a distance cadence using the route's average speed. */
export function timeCadenceToKm(hours: number, totalKm: number, durationMin: number): number {
  if (durationMin <= 0) return hours * 80; // assume 80 km/h if duration unknown
  const avgKmh = totalKm / (durationMin / 60);
  return hours * avgKmh;
}

function onRoute(p: RoutePoi, maxDetourKm: number): boolean {
  return p.offRouteKm <= maxDetourKm;
}

/**
 * Plan fuel stops along a route. Each refuel is targeted at 85% of range from
 * the last refuel; we pick the nearest usable station to that target. If none
 * exists near the target, we fall back to the nearest one BEFORE it — better
 * early than stranded. The next target is measured from the station actually
 * chosen, not from the theoretical target.
 */
export function planFuelStops(
  coords: LonLat[],
  cum: number[],
  rangeKm: number,
  stations: RoutePoi[],
  opts: { maxDetourKm?: number; windowKm?: number } = {},
): PlannedStop[] {
  const maxDetourKm = opts.maxDetourKm ?? MAX_DETOUR_KM;
  const windowKm = opts.windowKm ?? FUEL_WINDOW_KM;
  const totalKm = cum[cum.length - 1];
  const stops: PlannedStop[] = [];
  if (rangeKm < 30) return stops;

  const usable = stations
    .filter((s) => s.kind === "fuel" && onRoute(s, maxDetourKm))
    .sort((a, b) => a.routeKm - b.routeKm);

  let lastFuelKm = 0;
  let guard = 0;
  while (totalKm - lastFuelKm > rangeKm && guard++ < 100) {
    const targetKm = lastFuelKm + rangeKm * REFUEL_AT_FRACTION;

    // 1) nearest station to the target within the window
    let chosen: RoutePoi | undefined;
    let bestScore = Infinity;
    for (const s of usable) {
      const delta = Math.abs(s.routeKm - targetKm);
      if (delta > windowKm) continue;
      if (s.routeKm > lastFuelKm + rangeKm) continue; // can't reach it
      if (s.routeKm <= lastFuelKm + 20) continue; // pointless micro-hop
      const score = delta + s.offRouteKm * 5; // small bias toward on-route stations
      if (score < bestScore) {
        bestScore = score;
        chosen = s;
      }
    }

    let status: PlannedStop["status"] = "found";
    let note: string | undefined;

    // 2) fall back to the nearest station BEFORE the target
    if (!chosen) {
      for (const s of usable) {
        if (s.routeKm <= lastFuelKm + 20 || s.routeKm >= targetKm) continue;
        if (!chosen || s.routeKm > chosen.routeKm) chosen = s;
      }
      if (chosen) {
        status = "fallback-early";
        note = "No station near the ideal point — stopping earlier (better early than stranded).";
      }
    }

    if (chosen) {
      stops.push({
        type: "fuel",
        targetKm,
        atKm: chosen.routeKm,
        point: [chosen.lon, chosen.lat],
        poi: chosen,
        status,
        note,
      });
      lastFuelKm = chosen.routeKm;
    } else {
      stops.push({
        type: "fuel",
        targetKm,
        atKm: targetKm,
        point: pointAtKm(coords, cum, targetKm),
        status: "none",
        note: "No station found within the detour limit — plan this refuel manually.",
      });
      lastFuelKm = targetKm;
    }
  }
  return stops;
}

/**
 * Match rest targets to POIs. A rest target close to a planned fuel stop is
 * merged into it (one stop doing double duty). v1 only recommends — it never
 * reorders the route.
 */
export function planRestStops(
  coords: LonLat[],
  cum: number[],
  intervalKm: number,
  pois: RoutePoi[],
  fuelStops: PlannedStop[],
  opts: { maxDetourKm?: number; windowKm?: number } = {},
): PlannedStop[] {
  const maxDetourKm = opts.maxDetourKm ?? MAX_DETOUR_KM;
  const windowKm = opts.windowKm ?? REST_WINDOW_KM;
  const totalKm = cum[cum.length - 1];
  const targets = planRestTargets(totalKm, intervalKm);
  const usable = pois.filter((p) => onRoute(p, maxDetourKm));

  return targets.map((targetKm): PlannedStop => {
    // merge with a nearby fuel stop first
    const nearbyFuel = fuelStops.find(
      (f) => f.status !== "none" && Math.abs(f.atKm - targetKm) <= REST_NEAR_FUEL_KM,
    );
    if (nearbyFuel) {
      return {
        type: "rest",
        targetKm,
        atKm: nearbyFuel.atKm,
        point: nearbyFuel.point,
        poi: nearbyFuel.poi,
        status: "found",
        combinedWithFuel: true,
        note: "Combined with the fuel stop here.",
      };
    }

    let chosen: RoutePoi | undefined;
    let bestScore = Infinity;
    for (const p of usable) {
      const delta = Math.abs(p.routeKm - targetKm);
      if (delta > windowKm) continue;
      // prefer fuel stations slightly: they reliably have toilets/coffee
      const score = delta + p.offRouteKm * 5 - (p.kind === "fuel" ? 3 : 0);
      if (score < bestScore) {
        bestScore = score;
        chosen = p;
      }
    }

    if (chosen) {
      return {
        type: "rest",
        targetKm,
        atKm: chosen.routeKm,
        point: [chosen.lon, chosen.lat],
        poi: chosen,
        status: "found",
      };
    }
    return {
      type: "rest",
      targetKm,
      atKm: targetKm,
      point: pointAtKm(coords, cum, targetKm),
      status: "none",
      note: "No rest POI found within the detour limit around this point.",
    };
  });
}
