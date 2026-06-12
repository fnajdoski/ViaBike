import { describe, expect, it } from "vitest";
import { bboxOf, buildOverpassQueries, collectBoxesByKind, type Corridor } from "./overpass";

const fuelCorridor: Corridor = {
  points: [
    [42.0, 21.4],
    [42.1, 21.3],
    [42.2, 21.2],
    [42.3, 21.1],
    [42.4, 21.0],
  ],
  kinds: ["fuel"],
};

const restCorridor: Corridor = {
  points: [
    [45.0, 9.0],
    [45.05, 9.1],
  ],
  kinds: ["fuel", "cafe", "services", "rest_area"],
};

describe("bboxOf", () => {
  it("pads the bounding box by the given km", () => {
    const box = bboxOf([[42.0, 21.0]], 6);
    const [s, w, n, e] = box.slice(1, -1).split(",").map(Number);
    // 6 km ≈ 0.054° latitude
    expect(n - s).toBeCloseTo((2 * 6) / 111.32, 3);
    expect(s).toBeLessThan(42.0);
    expect(n).toBeGreaterThan(42.0);
    expect(w).toBeLessThan(21.0);
    expect(e).toBeGreaterThan(21.0);
  });

  it("widens longitude padding at higher latitudes", () => {
    const equator = bboxOf([[0, 10]], 6).slice(1, -1).split(",").map(Number);
    const north = bboxOf([[60, 10]], 6).slice(1, -1).split(",").map(Number);
    expect(north[3] - north[1]).toBeGreaterThan(equator[3] - equator[1]);
  });
});

describe("collectBoxesByKind", () => {
  it("chunks corridor points into deduped boxes per kind", () => {
    const boxes = collectBoxesByKind([fuelCorridor], 6000);
    expect([...boxes.keys()]).toEqual(["fuel"]);
    // 5 points, chunks of 4 with one-point overlap → 2 boxes
    expect(boxes.get("fuel")!.size).toBe(2);
  });

  it("ignores unknown kinds and empty corridors", () => {
    const boxes = collectBoxesByKind(
      [{ points: [], kinds: ["fuel"] }, { points: [[1, 1]], kinds: ["bogus" as never] }],
      6000,
    );
    expect(boxes.size).toBe(0);
  });
});

describe("buildOverpassQueries", () => {
  it("splits kinds into two independent queries (fuel | rest kinds)", () => {
    const queries = buildOverpassQueries([fuelCorridor, restCorridor], 6000);
    expect(queries).toHaveLength(2);
    const [fuelQ, restQ] = queries;
    expect(fuelQ).toContain(`["amenity"="fuel"]`);
    expect(fuelQ).not.toContain(`["amenity"="cafe"]`);
    expect(restQ).toContain(`["amenity"="cafe"]`);
    expect(restQ).toContain(`["highway"="services"]`);
    expect(restQ).toContain(`["highway"="rest_area"]`);
    expect(restQ).not.toContain(`s_fuel`);
  });

  it("uses exact tag matches and per-kind caps", () => {
    const [fuelQ] = buildOverpassQueries([fuelCorridor], 6000);
    expect(fuelQ).toContain("out tags center 1500");
    expect(fuelQ).not.toContain("~"); // no regex filters — they bypass the tag index
  });

  it("emits a single query when only fuel corridors exist", () => {
    expect(buildOverpassQueries([fuelCorridor], 6000)).toHaveLength(1);
  });

  it("emits nothing for empty input", () => {
    expect(buildOverpassQueries([], 6000)).toEqual([]);
  });
});
