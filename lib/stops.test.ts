import { describe, expect, it } from "vitest";
import { cumulativeKm } from "./geo";
import { planFuelStops, planFuelTargets, planRestStops, planRestTargets, timeCadenceToKm } from "./stops";
import type { LonLat, RoutePoi } from "./types";

// Straight test route along the equator: 1° lon ≈ 111.19 km, 16° ≈ 1,779 km
const coords: LonLat[] = Array.from({ length: 161 }, (_, i) => [i / 10, 0] as LonLat);
const cum = cumulativeKm(coords);
const totalKm = cum[cum.length - 1];

function station(km: number, offRouteKm = 0.5, kind: RoutePoi["kind"] = "fuel"): RoutePoi {
  return {
    id: `poi-${km}`,
    name: `Station ${km}`,
    lat: 0,
    lon: km / 111.19,
    kind,
    routeKm: km,
    offRouteKm,
  };
}

describe("planFuelTargets", () => {
  it("places refuels at 85% of range until the destination is reachable", () => {
    // 446 km range on a 1,300 km trip → refuels at 379, 758; from 758 the
    // remaining 542 km still exceeds range → 1137; then 163 km left, ok.
    const targets = planFuelTargets(1300, 446);
    expect(targets.map((t) => Math.round(t))).toEqual([379, 758, 1137]);
  });

  it("needs no stops when the trip fits in one tank", () => {
    expect(planFuelTargets(400, 446)).toEqual([]);
  });
});

describe("planFuelStops", () => {
  it("picks the nearest station to each target", () => {
    const stations = [station(100), station(370), station(390), station(745), station(1150), station(1500)];
    const stops = planFuelStops(coords, cum, 446, stations);
    expect(stops.map((s) => s.poi?.routeKm)).toEqual([370, 745, 1150, 1500]);
    expect(stops.every((s) => s.status === "found")).toBe(true);
  });

  it("falls back to the nearest station BEFORE the target when none is near it", () => {
    // big gap around the first target (379): nothing within the window,
    // nearest before is at 250
    const stations = [station(250), station(700), station(1100)];
    const stops = planFuelStops(coords, cum, 446, stations);
    expect(stops[0].status).toBe("fallback-early");
    expect(stops[0].poi?.routeKm).toBe(250);
  });

  it("rejects stations beyond the detour limit", () => {
    const stations = [station(379, 8)]; // 8 km off route > 2 km limit
    const stops = planFuelStops(coords, cum, 446, stations);
    expect(stops[0].status).toBe("none");
  });

  it("measures the next target from the chosen station, not the theoretical point", () => {
    const stations = [station(300), station(640), station(1000), station(1400)];
    const stops = planFuelStops(coords, cum, 446, stations);
    // after stopping at 300, next target is 300 + 379 = 679 → station 640
    expect(stops[1].poi?.routeKm).toBe(640);
  });
});

describe("rest stops", () => {
  it("targets every interval, skipping the run-in to the destination", () => {
    const targets = planRestTargets(500, 150);
    expect(targets).toEqual([150, 300, 450]);
  });

  it("converts a time cadence using the route average speed", () => {
    // 800 km in 600 min → 80 km/h → 1.5 h ≈ 120 km
    expect(timeCadenceToKm(1.5, 800, 600)).toBeCloseTo(120);
  });

  it("merges a rest target into a nearby fuel stop", () => {
    const stations = [station(370), station(745), station(1150)];
    const fuelStops = planFuelStops(coords, cum, 446, stations);
    const rest = planRestStops(coords, cum, 150, stations, fuelStops);
    const at450 = rest.find((r) => r.targetKm === 450);
    expect(at450).toBeDefined();
    // 450 is 80 km from the 370 fuel stop — NOT merged (> 35 km)
    expect(at450!.combinedWithFuel).toBeFalsy();
    const at750 = rest.find((r) => r.targetKm === 750);
    expect(at750!.combinedWithFuel).toBe(true);
    expect(at750!.atKm).toBe(745);
  });

  it("prefers cafés/services within the window and flags gaps", () => {
    const cafe = station(140, 0.3, "cafe");
    const rest = planRestStops(coords, cum, 150, [cafe], []);
    expect(rest[0].poi?.id).toBe(cafe.id);
    expect(rest[1].status).toBe("none");
  });
});

describe("acceptance scenario maths (R1300GSA loaded)", () => {
  it("spaces refuels at ~380 km on a Skopje→Milano→Zurich-length trip", () => {
    // 446 km loaded range → targets every 379 km on a ~1,700 km route
    const targets = planFuelTargets(1700, 446.3);
    expect(targets.length).toBe(4);
    const gaps = targets.map((t, i) => t - (targets[i - 1] ?? 0));
    for (const g of gaps) expect(g).toBeCloseTo(379.4, 0);
    expect(totalKm).toBeGreaterThan(1700); // sanity: test route is long enough
  });
});
