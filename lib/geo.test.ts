import { describe, expect, it } from "vitest";
import { cumulativeKm, encodePolyline, haversineKm, nearestOnRoute, pointAtKm } from "./geo";
import type { LonLat } from "./types";

describe("haversineKm", () => {
  it("matches a known distance (Skopje → Zurich ≈ 1,173 km great-circle)", () => {
    const skopje: LonLat = [21.4254, 41.9981];
    const zurich: LonLat = [8.5417, 47.3769];
    expect(haversineKm(skopje, zurich)).toBeGreaterThan(1150);
    expect(haversineKm(skopje, zurich)).toBeLessThan(1200);
  });

  it("is zero for identical points", () => {
    expect(haversineKm([10, 50], [10, 50])).toBe(0);
  });
});

describe("cumulativeKm / pointAtKm", () => {
  // 1° of longitude at the equator ≈ 111.19 km
  const line: LonLat[] = [
    [0, 0],
    [1, 0],
    [2, 0],
  ];
  const cum = cumulativeKm(line);

  it("accumulates monotonically", () => {
    expect(cum[0]).toBe(0);
    expect(cum[1]).toBeCloseTo(111.19, 0);
    expect(cum[2]).toBeCloseTo(222.39, 0);
  });

  it("interpolates between vertices", () => {
    const mid = pointAtKm(line, cum, cum[2] / 2);
    expect(mid[0]).toBeCloseTo(1, 1);
    expect(mid[1]).toBeCloseTo(0, 5);
  });

  it("clamps beyond the ends", () => {
    expect(pointAtKm(line, cum, -5)).toEqual([0, 0]);
    expect(pointAtKm(line, cum, 9999)).toEqual([2, 0]);
  });
});

describe("nearestOnRoute", () => {
  it("finds the closest vertex and its off-route distance", () => {
    const line: LonLat[] = [
      [0, 0],
      [1, 0],
      [2, 0],
    ];
    const cum = cumulativeKm(line);
    const { routeKm, offRouteKm } = nearestOnRoute(line, cum, [1.001, 0.01]);
    expect(routeKm).toBeCloseTo(cum[1], 0);
    expect(offRouteKm).toBeLessThan(2);
  });
});

describe("encodePolyline", () => {
  it("matches the canonical Google example", () => {
    // https://developers.google.com/maps/documentation/utilities/polylinealgorithm
    const coords: LonLat[] = [
      [-120.2, 38.5],
      [-120.95, 40.7],
      [-126.453, 43.252],
    ];
    expect(encodePolyline(coords)).toBe("_p~iF~ps|U_ulLnnqC_mqNvxq`@");
  });
});
