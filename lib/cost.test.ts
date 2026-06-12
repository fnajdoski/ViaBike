import { describe, expect, it } from "vitest";
import { aggregateByCountry, buildCostBreakdown, fuelBreakdown, tollEstimate, vignetteItems } from "./cost";
import { splitByCountry } from "./countries";
import type { CountrySegment } from "./types";

// Roughly the acceptance-test corridor: Skopje → Milano → Zurich
const segments: CountrySegment[] = [
  { iso2: "MK", km: 170 },
  { iso2: "RS", km: 380 },
  { iso2: "HR", km: 300 },
  { iso2: "SI", km: 110 },
  { iso2: "IT", km: 480 },
  { iso2: "CH", km: 200 },
];

describe("aggregateByCountry", () => {
  it("merges repeated countries preserving route order", () => {
    const segs = [
      { iso2: "IT", km: 100 },
      { iso2: "CH", km: 50 },
      { iso2: "IT", km: 30 },
    ];
    expect(aggregateByCountry(segs)).toEqual([
      { iso2: "IT", km: 130 },
      { iso2: "CH", km: 50 },
    ]);
  });
});

describe("splitByCountry", () => {
  it("attributes inter-sample distance to the leading sample's country", () => {
    const samples = [
      { km: 0, iso2: "MK" },
      { km: 10, iso2: "MK" },
      { km: 20, iso2: "RS" },
      { km: 30, iso2: null },
      { km: 40, iso2: "RS" },
    ];
    expect(splitByCountry(samples)).toEqual([
      { iso2: "MK", km: 20 },
      { iso2: "RS", km: 10 },
      { iso2: "??", km: 10 },
    ]);
  });
});

describe("fuelBreakdown", () => {
  it("prices each country separately — never one blended price", () => {
    const fuel = fuelBreakdown(segments, 6.05, { MK: 1.4, RS: 1.6, HR: 1.5, SI: 1.52, IT: 1.8, CH: 1.9 });
    expect(fuel).toHaveLength(6);
    const it = fuel.find((f) => f.iso2 === "IT")!;
    expect(it.liters).toBeCloseTo((480 / 100) * 6.05, 3);
    expect(it.costEur).toBeCloseTo(it.liters * 1.8, 3);
    const total = fuel.reduce((a, f) => a + f.costEur, 0);
    expect(total).toBeGreaterThan(150);
    expect(total).toBeLessThan(200);
  });
});

describe("tollEstimate", () => {
  it("estimates per-km tolls only for toll-charging countries", () => {
    const tolls = tollEstimate(segments);
    const isos = tolls.map((t) => t.iso2);
    expect(isos).toContain("IT");
    expect(isos).toContain("RS");
    expect(isos).not.toContain("CH"); // vignette country, no per-km tolls
    expect(isos).not.toContain("SI"); // vignette country
  });
});

describe("vignetteItems", () => {
  it("flags Switzerland's vignette as a one-off and Slovenia's weekly pass", () => {
    const items = vignetteItems(segments);
    const ch = items.find((i) => i.iso2 === "CH")!;
    expect(ch.priceEur).toBeCloseTo(42);
    expect(ch.originalPrice).toContain("CHF");
    const si = items.find((i) => i.iso2 === "SI")!;
    expect(si.priceEur).toBeCloseTo(7.5);
  });

  it("reports motorcycle exemptions as zero-cost info lines", () => {
    const items = vignetteItems([{ iso2: "CZ", km: 200 }]);
    expect(items[0].priceEur).toBe(0);
    expect(items[0].label).toContain("exempt");
  });
});

describe("buildCostBreakdown", () => {
  it("totals fuel + tolls + vignettes + extras", () => {
    const b = buildCostBreakdown({
      segments,
      effectiveLper100: 6.05,
      extras: [{ id: "1", label: "Ferry", amountEur: 30 }],
    });
    expect(b.totalEur).toBeCloseTo(
      b.fuelTotalEur + b.tollsTotalEur + b.vignettesTotalEur + 30,
      5,
    );
    expect(b.tollsSource).toBe("builtin-estimate");
  });
});
