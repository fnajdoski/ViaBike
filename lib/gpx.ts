import type { LonLat } from "./types";

/** A GPX waypoint with a kind hint for the symbol. */
export type GpxWaypoint = { lon: number; lat: number; name: string; kind: "waypoint" | "fuel" | "rest" };

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const SYM: Record<GpxWaypoint["kind"], string> = {
  waypoint: "Flag, Blue",
  fuel: "Gas Station",
  rest: "Restaurant",
};

function slug(s: string): string {
  return (
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // strip accents
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40)
  );
}

/** Download filename like `viabike-skopje-zurich.gpx`. */
export function gpxFilename(originName?: string, destName?: string): string {
  const a = slug(originName ?? "");
  const b = slug(destName ?? "");
  const mid = a && b ? `${a}-${b}` : a || b || "trip";
  return `viabike-${mid}.gpx`;
}

/**
 * Build a GPX 1.1 document: a single track following the full route polyline,
 * plus a waypoint for every explicit/fuel/rest stop. Pure (no DOM), so it's
 * testable and works offline from the in-memory plan. Imports into BMW
 * Connected, Calimoto, OsmAnd, Garmin, etc.
 */
export function buildGpx(opts: { name: string; track: LonLat[]; waypoints: GpxWaypoint[] }): string {
  const f = (n: number) => n.toFixed(6);
  const wpts = opts.waypoints
    .map(
      (w) =>
        `  <wpt lat="${f(w.lat)}" lon="${f(w.lon)}">\n` +
        `    <name>${esc(w.name)}</name>\n` +
        `    <sym>${SYM[w.kind]}</sym>\n` +
        `    <type>${w.kind}</type>\n` +
        `  </wpt>`,
    )
    .join("\n");
  const trkpts = opts.track.map(([lon, lat]) => `      <trkpt lat="${f(lat)}" lon="${f(lon)}"></trkpt>`).join("\n");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<gpx version="1.1" creator="ViaBike" xmlns="http://www.topografix.com/GPX/1/1">\n` +
    `  <metadata><name>${esc(opts.name)}</name></metadata>\n` +
    (wpts ? wpts + "\n" : "") +
    `  <trk>\n    <name>${esc(opts.name)}</name>\n    <trkseg>\n${trkpts}\n    </trkseg>\n  </trk>\n` +
    `</gpx>\n`
  );
}
