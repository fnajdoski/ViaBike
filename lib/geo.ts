import type { LonLat } from "./types";

const EARTH_RADIUS_KM = 6371.0088;

function rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineKm(a: LonLat, b: LonLat): number {
  const dLat = rad(b[1] - a[1]);
  const dLon = rad(b[0] - a[0]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Cumulative distance (km) at each vertex of a polyline. cum[0] === 0. */
export function cumulativeKm(coords: LonLat[]): number[] {
  const cum = new Array<number>(coords.length);
  cum[0] = 0;
  for (let i = 1; i < coords.length; i++) {
    cum[i] = cum[i - 1] + haversineKm(coords[i - 1], coords[i]);
  }
  return cum;
}

/** Point at `km` along the route, linearly interpolated between vertices. */
export function pointAtKm(coords: LonLat[], cum: number[], km: number): LonLat {
  if (km <= 0) return coords[0];
  const total = cum[cum.length - 1];
  if (km >= total) return coords[coords.length - 1];
  // binary search for the segment containing km
  let lo = 0;
  let hi = cum.length - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= km) lo = mid;
    else hi = mid;
  }
  const segLen = cum[hi] - cum[lo];
  const t = segLen === 0 ? 0 : (km - cum[lo]) / segLen;
  return [
    coords[lo][0] + (coords[hi][0] - coords[lo][0]) * t,
    coords[lo][1] + (coords[hi][1] - coords[lo][1]) * t,
  ];
}

/**
 * Nearest route vertex to point p: its distance along the route and the
 * straight-line offset. Vertex-level precision is fine for dense route
 * geometry (vertices every few hundred meters).
 */
export function nearestOnRoute(
  coords: LonLat[],
  cum: number[],
  p: LonLat,
): { routeKm: number; offRouteKm: number } {
  let best = Infinity;
  let bestIdx = 0;
  for (let i = 0; i < coords.length; i++) {
    // cheap pre-filter on lat/lon delta (~0.1° ≈ 11 km) before haversine
    if (Math.abs(coords[i][1] - p[1]) > 0.1 || Math.abs(coords[i][0] - p[0]) > 0.2) continue;
    const d = haversineKm(coords[i], p);
    if (d < best) {
      best = d;
      bestIdx = i;
    }
  }
  if (best === Infinity) {
    // POI far from every vertex — do the full scan once
    for (let i = 0; i < coords.length; i++) {
      const d = haversineKm(coords[i], p);
      if (d < best) {
        best = d;
        bestIdx = i;
      }
    }
  }
  return { routeKm: cum[bestIdx], offRouteKm: best };
}

/** Sample points every `stepKm` along the route (always includes start & end). */
export function sampleEveryKm(
  coords: LonLat[],
  cum: number[],
  stepKm: number,
): { point: LonLat; km: number }[] {
  const total = cum[cum.length - 1];
  const out: { point: LonLat; km: number }[] = [];
  for (let km = 0; km < total; km += stepKm) {
    out.push({ point: pointAtKm(coords, cum, km), km });
  }
  out.push({ point: coords[coords.length - 1], km: total });
  return out;
}

/** Google encoded polyline (precision 5), lat/lon order — what TollGuru expects. */
export function encodePolyline(coords: LonLat[], precision = 5): string {
  const factor = 10 ** precision;
  let out = "";
  let prevLat = 0;
  let prevLon = 0;
  const encodeDiff = (diff: number) => {
    let v = diff < 0 ? ~(diff << 1) : diff << 1;
    let s = "";
    while (v >= 0x20) {
      s += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    s += String.fromCharCode(v + 63);
    return s;
  };
  for (const [lon, lat] of coords) {
    const latI = Math.round(lat * factor);
    const lonI = Math.round(lon * factor);
    out += encodeDiff(latI - prevLat) + encodeDiff(lonI - prevLon);
    prevLat = latI;
    prevLon = lonI;
  }
  return out;
}
