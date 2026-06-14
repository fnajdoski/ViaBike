import { describe, expect, it } from "vitest";
import { tollwaySegments } from "./tolls";
import type { LonLat } from "./types";

// A straight east-west line along lat 45; 1° lon ≈ 78.6 km at this latitude.
const coords: LonLat[] = Array.from({ length: 11 }, (_, i) => [i, 45] as LonLat);
// countries by longitude: <5 = "AA", >=5 = "BB"
const countryAt = (p: LonLat) => (p[0] < 5 ? "AA" : "BB");

describe("tollwaySegments", () => {
  it("charges nothing when no range is a tollway (the Ohrid→Bar bug)", () => {
    expect(tollwaySegments(coords, [[0, 10, 0]], countryAt)).toEqual([]);
    expect(tollwaySegments(coords, [], countryAt)).toEqual([]);
  });

  it("sums only tollway ranges and buckets by country", () => {
    // tollway over coords 0..4 (all in AA), free elsewhere
    const segs = tollwaySegments(coords, [[0, 4, 1], [4, 10, 0]], countryAt);
    expect(segs).toHaveLength(1);
    expect(segs[0].iso2).toBe("AA");
    expect(segs[0].km).toBeGreaterThan(0);
  });

  it("splits a tollway that crosses a border into per-country distance", () => {
    const segs = tollwaySegments(coords, [[0, 10, 1]], countryAt);
    const isos = segs.map((s) => s.iso2);
    expect(isos).toContain("AA");
    expect(isos).toContain("BB");
    const total = segs.reduce((a, s) => a + s.km, 0);
    expect(total).toBeGreaterThan(700); // ~786 km across 10°
  });

  it("treats value ≥ 1 as tolled", () => {
    const segs = tollwaySegments(coords, [[0, 2, 2]], countryAt);
    expect(segs[0].iso2).toBe("AA");
  });
});
