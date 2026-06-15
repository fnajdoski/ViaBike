import type { LonLat } from "./types";

/** Google Maps "dir" URL API supports ~9 intermediate waypoints. */
export const MAX_GMAPS_WAYPOINTS = 9;

/**
 * Build a Google Maps directions URL from planned waypoints (origin = first,
 * destination = last, the rest as intermediate waypoints). On phones this
 * deep-links into the Maps app; on desktop it opens Maps in the browser.
 *
 * Google recomputes its own route between the points (no motorcycle mode in
 * the URL API → travelmode=driving), so it won't be byte-identical to our
 * line, but it follows the same trip. If there are more than 9 intermediate
 * points we evenly sample them (keeping the user's explicit order, origin and
 * destination) rather than passing the whole polyline.
 */
export function buildGoogleMapsUrl(coords: LonLat[]): string | null {
  const pts = coords.filter(
    (c): c is LonLat => Array.isArray(c) && Number.isFinite(c[0]) && Number.isFinite(c[1]),
  );
  if (pts.length < 2) return null;

  const origin = pts[0];
  const destination = pts[pts.length - 1];
  let mids = pts.slice(1, -1);

  if (mids.length > MAX_GMAPS_WAYPOINTS) {
    const step = (mids.length - 1) / (MAX_GMAPS_WAYPOINTS - 1);
    const sampled: LonLat[] = [];
    for (let i = 0; i < MAX_GMAPS_WAYPOINTS; i++) sampled.push(mids[Math.round(i * step)]);
    mids = sampled;
  }

  const fmt = ([lon, lat]: LonLat) => `${lat},${lon}`;
  let url =
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${fmt(origin)}&destination=${fmt(destination)}&travelmode=driving`;
  if (mids.length) url += `&waypoints=${mids.map(fmt).join("|")}`;
  return url;
}

/** Google Maps free links practically cap the URL at this length. */
export const MAX_GMAPS_URL_CHARS = 2048;

export type ExportPoint = { lon: number; lat: number; routeKm: number; name?: string };

export type GoogleMapsExport = {
  url: string | null;
  fuel: { included: number; total: number };
  rest: { included: number; total: number };
  /** true when some enabled stops didn't fit and were dropped. */
  capped: boolean;
};

/** Pick `n` items evenly across `arr`, preserving order (n>=len → all). */
export function evenlySpaced<T>(arr: T[], n: number): T[] {
  if (n >= arr.length) return arr.slice();
  if (n <= 0) return [];
  if (n === 1) return [arr[Math.floor(arr.length / 2)]];
  const out: T[] = [];
  const seen = new Set<number>();
  for (let i = 0; i < n; i++) {
    const idx = Math.round((i * (arr.length - 1)) / (n - 1));
    if (!seen.has(idx)) {
      seen.add(idx);
      out.push(arr[idx]);
    }
  }
  return out;
}

/**
 * Build a Google Maps directions URL that includes the planned stops, in
 * priority order until Google's practical limits are hit:
 *   1. explicit waypoints (origin, vias, destination) — always;
 *   2. fuel stops (all if they fit);
 *   3. rest stops (evenly-spaced subset of whatever room is left).
 * Everything is ordered by distance-along-route; the URL is kept within the
 * ~9-waypoint and 2,048-char limits (rest trimmed first, then fuel).
 */
export function buildGoogleMapsExport(args: {
  waypoints: ExportPoint[];
  fuel: ExportPoint[];
  rest: ExportPoint[];
  includeFuel: boolean;
  includeRest: boolean;
  maxWaypoints?: number;
  maxUrlChars?: number;
}): GoogleMapsExport {
  const maxWaypoints = args.maxWaypoints ?? MAX_GMAPS_WAYPOINTS;
  const maxUrlChars = args.maxUrlChars ?? MAX_GMAPS_URL_CHARS;
  const wpts = args.waypoints.slice().sort((a, b) => a.routeKm - b.routeKm);
  const fuelAll = args.includeFuel ? args.fuel.slice().sort((a, b) => a.routeKm - b.routeKm) : [];
  const restAll = args.includeRest ? args.rest.slice().sort((a, b) => a.routeKm - b.routeKm) : [];
  const empty: GoogleMapsExport = {
    url: null,
    fuel: { included: 0, total: fuelAll.length },
    rest: { included: 0, total: restAll.length },
    capped: false,
  };
  if (wpts.length < 2) return empty;

  const origin = wpts[0];
  const destination = wpts[wpts.length - 1];
  const vias = wpts.slice(1, -1); // explicit intermediate, always kept

  const order = (pts: ExportPoint[]): LonLat[] =>
    pts
      .slice()
      .sort((a, b) => a.routeKm - b.routeKm)
      .map((p): LonLat => [p.lon, p.lat]);

  // Build with a given count of fuel/rest and check it fits both limits.
  const attempt = (nFuel: number, nRest: number) => {
    const fuelSel = evenlySpaced(fuelAll, nFuel);
    const restSel = evenlySpaced(restAll, nRest);
    const intermediates = [...vias, ...fuelSel, ...restSel];
    const coords = [
      [origin.lon, origin.lat] as LonLat,
      ...order(intermediates),
      [destination.lon, destination.lat] as LonLat,
    ];
    const url = buildGoogleMapsUrl(coords);
    return { url, fuelSel, restSel, intermediates };
  };

  const slots = Math.max(0, maxWaypoints - vias.length);
  let nFuel = Math.min(fuelAll.length, slots);
  let nRest = Math.min(restAll.length, Math.max(0, slots - nFuel));

  let res = attempt(nFuel, nRest);
  // enforce the URL char cap: trim rest first, then fuel
  while (res.url && res.url.length > maxUrlChars && (nRest > 0 || nFuel > 0)) {
    if (nRest > 0) nRest--;
    else nFuel--;
    res = attempt(nFuel, nRest);
  }

  return {
    url: res.url,
    fuel: { included: res.fuelSel.length, total: fuelAll.length },
    rest: { included: res.restSel.length, total: restAll.length },
    capped: res.fuelSel.length < fuelAll.length || res.restSel.length < restAll.length,
  };
}
