/**
 * Country lookup by coordinate — SERVER-SIDE ONLY (the boundary dataset is
 * ~800 KB). Uses Natural Earth 1:50m borders via world-atlas; precise enough
 * for fuel-cost estimates (borders can be off by a couple of km — figures
 * are labeled estimates anyway).
 */
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Geometry, Position } from "geojson";
import countriesTopo from "world-atlas/countries-50m.json";
import { countriesByNeName } from "@/data/countryCodes";
import type { CountrySegment, LonLat } from "./types";

type CountryShape = {
  iso2: string;
  bbox: [number, number, number, number]; // minLon, minLat, maxLon, maxLat
  polygons: Position[][][]; // MultiPolygon rings
};

let shapes: CountryShape[] | null = null;

function ringBounds(rings: Position[][][]): [number, number, number, number] {
  let minLon = Infinity,
    minLat = Infinity,
    maxLon = -Infinity,
    maxLat = -Infinity;
  for (const poly of rings)
    for (const ring of poly)
      for (const [lon, lat] of ring) {
        if (lon < minLon) minLon = lon;
        if (lat < minLat) minLat = lat;
        if (lon > maxLon) maxLon = lon;
        if (lat > maxLat) maxLat = lat;
      }
  return [minLon, minLat, maxLon, maxLat];
}

function loadShapes(): CountryShape[] {
  if (shapes) return shapes;
  const topo = countriesTopo as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
  const fc = feature(topo, topo.objects.countries) as FeatureCollection<Geometry, { name: string }>;
  shapes = [];
  for (const f of fc.features) {
    const meta = countriesByNeName[f.properties?.name ?? ""];
    if (!meta) continue; // only countries relevant to European trips
    const polygons: Position[][][] =
      f.geometry.type === "Polygon"
        ? [f.geometry.coordinates]
        : f.geometry.type === "MultiPolygon"
          ? f.geometry.coordinates
          : [];
    if (!polygons.length) continue;
    shapes.push({ iso2: meta.iso2, bbox: ringBounds(polygons), polygons });
  }
  return shapes;
}

/** Ray-casting point-in-ring test. */
export function pointInRing(p: LonLat, ring: Position[]): boolean {
  const [x, y] = p;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInPolygons(p: LonLat, polygons: Position[][][]): boolean {
  for (const poly of polygons) {
    if (!pointInRing(p, poly[0])) continue; // outer ring
    let inHole = false;
    for (let h = 1; h < poly.length; h++) {
      if (pointInRing(p, poly[h])) {
        inHole = true;
        break;
      }
    }
    if (!inHole) return true;
  }
  return false;
}

/** ISO2 of the country containing the point, or null if not identified. */
export function countryAtPoint(p: LonLat): string | null {
  for (const s of loadShapes()) {
    const [minLon, minLat, maxLon, maxLat] = s.bbox;
    if (p[0] < minLon || p[0] > maxLon || p[1] < minLat || p[1] > maxLat) continue;
    if (pointInPolygons(p, s.polygons)) return s.iso2;
  }
  return null;
}

/**
 * Pure aggregation of country samples into ordered segments — the km between
 * consecutive samples is attributed to the first sample's country.
 * Kept separate from the polygon lookup so it's unit-testable.
 */
export function splitByCountry(samples: { km: number; iso2: string | null }[]): CountrySegment[] {
  const segments: CountrySegment[] = [];
  for (let i = 0; i < samples.length - 1; i++) {
    const iso2 = samples[i].iso2 ?? "??";
    const km = samples[i + 1].km - samples[i].km;
    const last = segments[segments.length - 1];
    if (last && last.iso2 === iso2) last.km += km;
    else segments.push({ iso2, km });
  }
  return segments;
}
