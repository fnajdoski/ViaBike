/**
 * Pure Overpass query building for POI corridors — extracted from the API
 * route so it's unit-testable. Strategy: small padded bounding boxes hugging
 * the route (spatial-indexed, fast), exact tag matches (tag-indexed; regex
 * matches can't use the index), per-kind result caps, and the kinds split
 * into up to two independent queries so the server can run them in parallel
 * (Overpass allows ~2 slots per IP).
 */
import type { PoiKind } from "./types";

export type Corridor = {
  /** [lat, lon] pairs sampled along the route slice to search around. */
  points: [number, number][];
  kinds: PoiKind[];
};

/** Per-kind result caps — cafés in a city box would otherwise drown out fuel. */
export const KIND_CAPS: Record<PoiKind, number> = {
  fuel: 1500,
  cafe: 600,
  services: 400,
  rest_area: 400,
};

/** Consecutive corridor points per sub-box (~30–40 km of route each). */
export const CHUNK_POINTS = 4;

/** Exact tag filter per kind — exact matches use Overpass's tag index. */
export const KIND_TAGS: Record<PoiKind, string> = {
  fuel: `["amenity"="fuel"]`,
  cafe: `["amenity"="cafe"]`,
  services: `["highway"="services"]`,
  rest_area: `["highway"="rest_area"]`,
};

/**
 * Kinds grouped into independent queries of similar weight: fuel (the big
 * whole-corridor scan) alone, the rest-stop kinds together.
 */
export const KIND_GROUPS: PoiKind[][] = [["fuel"], ["cafe", "services", "rest_area"]];

/** Padded bounding box of a few consecutive corridor points. */
export function bboxOf(points: [number, number][], padKm: number): string {
  let minLat = Infinity,
    minLon = Infinity,
    maxLat = -Infinity,
    maxLon = -Infinity;
  for (const [lat, lon] of points) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
  }
  const dLat = padKm / 111.32;
  const midLat = ((minLat + maxLat) / 2) * (Math.PI / 180);
  const dLon = padKm / (111.32 * Math.max(0.2, Math.cos(midLat)));
  const f = (n: number) => n.toFixed(3);
  return `(${f(minLat - dLat)},${f(minLon - dLon)},${f(maxLat + dLat)},${f(maxLon + dLon)})`;
}

/** Chunked, deduped sub-boxes per kind across all corridors. */
export function collectBoxesByKind(
  corridors: Corridor[],
  radiusM: number,
): Map<PoiKind, Set<string>> {
  const boxesByKind = new Map<PoiKind, Set<string>>();
  for (const corridor of corridors) {
    const points = corridor.points ?? [];
    const kinds = (corridor.kinds ?? []).filter((k): k is PoiKind => k in KIND_TAGS);
    if (points.length === 0 || kinds.length === 0) continue;
    for (let i = 0; i < points.length; i += CHUNK_POINTS) {
      // overlap chunks by one point so no gap opens between boxes
      const chunk = points.slice(i === 0 ? 0 : i - 1, i + CHUNK_POINTS);
      const box = bboxOf(chunk, radiusM / 1000);
      for (const kind of kinds) {
        if (!boxesByKind.has(kind)) boxesByKind.set(kind, new Set());
        boxesByKind.get(kind)!.add(box);
      }
    }
  }
  return boxesByKind;
}

/**
 * Build up to KIND_GROUPS.length independent Overpass queries covering all
 * corridors. Identical clauses to the previous single-query version — same
 * elements come back, they just arrive in parallel.
 */
export function buildOverpassQueries(corridors: Corridor[], radiusM: number): string[] {
  const boxesByKind = collectBoxesByKind(corridors, radiusM);
  const queries: string[] = [];
  for (const group of KIND_GROUPS) {
    const parts: string[] = [];
    for (const kind of group) {
      const boxes = boxesByKind.get(kind);
      if (!boxes || boxes.size === 0) continue;
      const union = [...boxes].map((box) => `nwr${KIND_TAGS[kind]}${box};`).join("");
      parts.push(`(${union})->.s_${kind};.s_${kind} out tags center ${KIND_CAPS[kind]};`);
    }
    if (parts.length) queries.push(`[out:json][timeout:25];${parts.join("")}`);
  }
  return queries;
}
