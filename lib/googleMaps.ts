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
