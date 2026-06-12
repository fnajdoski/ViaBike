import { describe, expect, it } from "vitest";
import { fallbackPricesEurPerLiter, fuelPricesEurPerLiter, mergeFuelPrices } from "./fuelPrices";

describe("mergeFuelPrices", () => {
  const fallback = { IT: 1.8, CH: 1.9, MK: 1.4 };

  it("overrides fallback prices with valid JSON prices", () => {
    const merged = mergeFuelPrices({ prices: { IT: { petrol: 1.97 } } }, fallback);
    expect(merged.IT).toBe(1.97);
    expect(merged.CH).toBe(1.9); // untouched
  });

  it("adds countries the fallback table doesn't know", () => {
    const merged = mergeFuelPrices({ prices: { JP: { petrol: 1.1 } } }, fallback);
    expect(merged.JP).toBe(1.1);
  });

  it("never lets invalid entries displace a fallback price", () => {
    const merged = mergeFuelPrices(
      { prices: { IT: { petrol: 0 }, CH: { petrol: -1 }, MK: {} } },
      fallback,
    );
    expect(merged).toEqual(fallback);
  });

  it("survives a missing or empty JSON entirely", () => {
    expect(mergeFuelPrices(null, fallback)).toEqual(fallback);
    expect(mergeFuelPrices({}, fallback)).toEqual(fallback);
  });
});

describe("shipped price table", () => {
  it("covers every fallback country and is never empty", () => {
    for (const iso2 of Object.keys(fallbackPricesEurPerLiter)) {
      expect(fuelPricesEurPerLiter[iso2]).toBeGreaterThan(0);
    }
    expect(Object.keys(fuelPricesEurPerLiter).length).toBeGreaterThanOrEqual(
      Object.keys(fallbackPricesEurPerLiter).length,
    );
  });
});
