import { REST_WINDOW_KM } from "./constants";
import { cumulativeKm, nearestOnRoute, pointAtKm, sampleEveryKm } from "./geo";
import { planFuelStops, planFuelTargets, planRestStops, planRestTargets, timeCadenceToKm } from "./stops";
import type { LonLat, PlannedStop, PoiKind, RouteData, RoutePoi } from "./types";

export type FuelPricesResponse = {
  source: string;
  asOf: string;
  estimate: boolean;
  prices: Record<string, number>;
};

export type TollGuruToll = {
  name: string;
  country: string;
  road: string;
  costEur: number;
  originalCost: string;
};

export type TollGuruResult = {
  available: boolean;
  tolls?: TollGuruToll[];
  fuelEstimateEur?: number | null;
  reason?: string;
};

export type PlanResult = {
  route: RouteData;
  fuelStops: PlannedStop[];
  restStops: PlannedStop[];
  restIntervalKm: number;
  prices: FuelPricesResponse | null;
  tollguru: TollGuruResult;
  warnings: string[];
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `${url} → ${res.status}`);
  return data as T;
}

/** Sample a slice of the route as [lat, lon] pairs for an Overpass corridor. */
function corridorPoints(
  coords: LonLat[],
  cum: number[],
  fromKm: number,
  toKm: number,
  stepKm: number,
): [number, number][] {
  const out: [number, number][] = [];
  for (let km = Math.max(0, fromKm); km <= toKm; km += stepKm) {
    const p = pointAtKm(coords, cum, km);
    out.push([p[1], p[0]]);
  }
  return out;
}

/**
 * The full planning pipeline: route → POI corridors → fuel/rest stops →
 * prices → tolls. Degrades gracefully — a failed POI or toll lookup produces
 * warnings, never a dead screen.
 */
export async function planTrip(args: {
  coords: LonLat[];
  rangeKm: number;
  restMode: "distance" | "time";
  restKm: number;
  restHours: number;
  onProgress?: (step: string) => void;
}): Promise<PlanResult> {
  const progress = args.onProgress ?? (() => {});
  const warnings: string[] = [];
  progress("Routing…");
  const route = await postJson<RouteData>("/api/route", { coordinates: args.coords });
  if (route.source === "osrm-demo") {
    warnings.push("Routing used the public OSRM demo server (no ORS key) — fine for planning, but rate-limited.");
  }

  const coords = route.coordinates;
  const cum = cumulativeKm(coords);
  const totalKm = cum[cum.length - 1];

  const restIntervalKm =
    args.restMode === "time"
      ? timeCadenceToKm(args.restHours, route.distanceKm, route.durationMin)
      : args.restKm;

  // One corridor along the whole route for fuel stations, plus a small
  // corridor around each rest target for cafés / services / rest areas.
  // Targeted regions, not the whole route: Overpass around-chain cost scales
  // with chain length, so sparse points (10 km) + a wide radius (6 km) keep
  // the query cheap; the 2 km detour filter happens client-side anyway.
  const restKinds: PoiKind[] = ["fuel", "cafe", "services", "rest_area"];
  const corridors = [
    // fuel: a generous window before each naive refuel target ("before" beats
    // "after" — the planner falls back to earlier stations)
    ...planFuelTargets(totalKm, args.rangeKm).map((t) => ({
      points: corridorPoints(coords, cum, t - 90, Math.min(totalKm, t + 50), 10),
      kinds: ["fuel" as PoiKind],
    })),
    ...planRestTargets(totalKm, restIntervalKm).map((t) => ({
      points: corridorPoints(coords, cum, t - REST_WINDOW_KM, Math.min(totalKm, t + REST_WINDOW_KM), 8),
      kinds: restKinds,
    })),
  ].filter((c) => c.points.length > 0);

  progress("Finding fuel stations & rest stops along the route…");
  let routePois: RoutePoi[] = [];
  try {
    const { pois } = await postJson<{ pois: { id: string; name?: string; lat: number; lon: number; kind: PoiKind }[] }>(
      "/api/pois",
      { corridors, radiusM: 6000 },
    );
    routePois = pois.map((p) => ({ ...p, ...nearestOnRoute(coords, cum, [p.lon, p.lat]) }));
  } catch (err) {
    warnings.push(`Stop lookup failed (${String(err)}) — fuel/rest markers show ideal points only.`);
  }

  const fuelStops = planFuelStops(coords, cum, args.rangeKm, routePois);
  const restStops = planRestStops(coords, cum, restIntervalKm, routePois, fuelStops);

  progress("Calculating costs…");
  const [prices, tollguru] = await Promise.all([
    fetch("/api/fuel-prices")
      .then((r) => r.json() as Promise<FuelPricesResponse>)
      .catch(() => {
        warnings.push("Fuel price lookup failed — using the built-in fallback table.");
        return null;
      }),
    postJson<TollGuruResult>("/api/tolls", {
      coordinates: sampleEveryKm(coords, cum, 1).map((s) => s.point),
    }).catch(() => ({ available: false, reason: "request failed" }) as TollGuruResult),
  ]);

  if (!tollguru.available) {
    warnings.push("Tolls are a rough built-in estimate (no TollGuru key) — verify before relying on them.");
  }

  return { route, fuelStops, restStops, restIntervalKm, prices, tollguru, warnings };
}
