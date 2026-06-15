import { describe, expect, it } from "vitest";
import {
  buildGoogleMapsExport,
  buildGoogleMapsUrl,
  evenlySpaced,
  MAX_GMAPS_WAYPOINTS,
  type ExportPoint,
} from "./googleMaps";
import type { LonLat } from "./types";

describe("buildGoogleMapsUrl", () => {
  it("returns null for fewer than two points", () => {
    expect(buildGoogleMapsUrl([])).toBeNull();
    expect(buildGoogleMapsUrl([[9, 45]])).toBeNull();
  });

  it("uses first as origin, last as destination (lat,lng order), driving mode", () => {
    const url = buildGoogleMapsUrl([
      [21.4254, 41.9981],
      [8.5417, 47.3769],
    ])!;
    expect(url).toContain("origin=41.9981,21.4254");
    expect(url).toContain("destination=47.3769,8.5417");
    expect(url).toContain("travelmode=driving");
    expect(url).not.toContain("waypoints="); // none between A and B
  });

  it("passes intermediate points as waypoints", () => {
    const url = buildGoogleMapsUrl([
      [21.4254, 41.9981],
      [9.19, 45.4642],
      [8.5417, 47.3769],
    ])!;
    expect(url).toContain("waypoints=45.4642,9.19");
  });

  it("caps intermediate waypoints to the Google limit, keeping origin/destination", () => {
    const coords: LonLat[] = [];
    for (let i = 0; i < 20; i++) coords.push([i, i]);
    const url = buildGoogleMapsUrl(coords)!;
    const wp = new URL(url).searchParams.get("waypoints")!;
    expect(wp.split("|")).toHaveLength(MAX_GMAPS_WAYPOINTS);
    // origin/destination remain the true endpoints
    expect(url).toContain("origin=0,0");
    expect(url).toContain("destination=19,19");
  });

  it("skips malformed coordinates", () => {
    const url = buildGoogleMapsUrl([
      [21.4254, 41.9981],
      [NaN, NaN] as unknown as LonLat,
      [8.5417, 47.3769],
    ])!;
    expect(url).not.toContain("waypoints="); // the bad mid was dropped
  });
});

describe("evenlySpaced", () => {
  it("returns all when n >= length", () => {
    expect(evenlySpaced([1, 2, 3], 5)).toEqual([1, 2, 3]);
  });
  it("keeps first and last and spreads the middle", () => {
    expect(evenlySpaced([1, 2, 3, 4, 5, 6, 7, 8, 9], 3)).toEqual([1, 5, 9]);
  });
  it("handles 0 and 1", () => {
    expect(evenlySpaced([1, 2, 3], 0)).toEqual([]);
    expect(evenlySpaced([1, 2, 3, 4], 1)).toEqual([3]);
  });
});

describe("buildGoogleMapsExport", () => {
  const wp = (routeKm: number, lon = routeKm / 100, lat = 45): ExportPoint => ({ lon, lat, routeKm });
  const ab = { waypoints: [wp(0), wp(1700)], includeFuel: true, includeRest: true };

  it("returns null url with fewer than two waypoints", () => {
    expect(buildGoogleMapsExport({ ...ab, waypoints: [wp(0)], fuel: [], rest: [] }).url).toBeNull();
  });

  it("always includes explicit vias even with many stops", () => {
    const res = buildGoogleMapsExport({
      waypoints: [wp(0), wp(800), wp(1700)], // A, via, B
      fuel: Array.from({ length: 4 }, (_, i) => wp(300 + i * 300)),
      rest: Array.from({ length: 12 }, (_, i) => wp(100 + i * 120)),
      includeFuel: true,
      includeRest: true,
    });
    // via at 800 must appear in the url
    expect(res.url).toContain("waypoints=");
    expect(res.url).toContain("45,8"); // lon 8 = routeKm 800/100
    // never exceeds the waypoint cap
    const wpParam = new URL(res.url!).searchParams.get("waypoints")!;
    expect(wpParam.split("|").length).toBeLessThanOrEqual(MAX_GMAPS_WAYPOINTS);
  });

  it("prioritizes fuel over rest and evenly-samples rest to fill remaining slots", () => {
    const res = buildGoogleMapsExport({
      waypoints: [wp(0), wp(1700)],
      fuel: [wp(400), wp(800), wp(1200)],
      rest: Array.from({ length: 10 }, (_, i) => wp(150 + i * 150)),
      includeFuel: true,
      includeRest: true,
    });
    expect(res.fuel.included).toBe(3); // all fuel fits
    expect(res.fuel.total).toBe(3);
    expect(res.rest.included).toBe(MAX_GMAPS_WAYPOINTS - 3); // remaining slots
    expect(res.rest.total).toBe(10);
    expect(res.capped).toBe(true);
  });

  it("respects the toggles", () => {
    const res = buildGoogleMapsExport({
      waypoints: [wp(0), wp(1700)],
      fuel: [wp(400), wp(800)],
      rest: [wp(600)],
      includeFuel: false,
      includeRest: true,
    });
    expect(res.fuel.included).toBe(0);
    expect(res.fuel.total).toBe(0); // disabled → not counted
    expect(res.rest.included).toBe(1);
    expect(res.capped).toBe(false);
  });

  it("keeps the URL under the char cap, trimming rest first", () => {
    const res = buildGoogleMapsExport({
      waypoints: [wp(0), wp(1700)],
      fuel: [wp(800)],
      rest: Array.from({ length: 8 }, (_, i) => wp(200 + i * 150)),
      includeFuel: true,
      includeRest: true,
      maxUrlChars: 220, // force aggressive trimming
    });
    expect(res.url!.length).toBeLessThanOrEqual(220);
    expect(res.fuel.included).toBe(1); // fuel survives, rest trimmed
  });
});
