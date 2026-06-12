import { describe, expect, it } from "vitest";
import { effectiveConsumption, rangeKm, usableTankLiters } from "./bike";
import { LOAD_FACTOR_LOADED, LOAD_FACTOR_SOLO } from "./constants";

// R 1300 GS Adventure figures from data/bikes.ts
const gsa = { tankLiters: 30, consumptionLper100: 5.5 };

describe("bike derived values", () => {
  it("uses only 90% of the tank", () => {
    expect(usableTankLiters(gsa)).toBeCloseTo(27, 5);
  });

  it("applies the load factor to consumption", () => {
    expect(effectiveConsumption(gsa, LOAD_FACTOR_SOLO)).toBeCloseTo(5.5);
    expect(effectiveConsumption(gsa, LOAD_FACTOR_LOADED)).toBeCloseTo(6.05);
  });

  it("computes loaded range for the GSA at ~446 km", () => {
    // 27 usable liters / 6.05 L/100km * 100 ≈ 446 km
    expect(rangeKm(gsa, LOAD_FACTOR_LOADED)).toBeCloseTo(446.3, 0);
  });

  it("computes solo range for the GSA at ~491 km", () => {
    expect(rangeKm(gsa, LOAD_FACTOR_SOLO)).toBeCloseTo(490.9, 0);
  });
});
