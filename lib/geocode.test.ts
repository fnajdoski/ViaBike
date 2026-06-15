import { describe, expect, it } from "vitest";
import { reverseLabel } from "./geocode";

describe("reverseLabel", () => {
  it("uses the ready-made label (ORS/Pelias)", () => {
    expect(reverseLabel({ label: "Skopje, North Macedonia", name: "Skopje" })).toBe("Skopje, North Macedonia");
  });

  it("assembles parts when there's no label (Photon)", () => {
    expect(reverseLabel({ name: "Centar", city: "Skopje", state: "Greater Skopje", country: "North Macedonia" })).toBe(
      "Centar, Greater Skopje, North Macedonia",
    );
  });

  it("falls back to locality when there's no name", () => {
    expect(reverseLabel({ city: "Milano", country: "Italy" })).toBe("Milano, Italy");
  });

  it("doesn't repeat region when it equals the primary name", () => {
    expect(reverseLabel({ name: "Zürich", state: "Zürich", country: "Switzerland" })).toBe("Zürich, Switzerland");
  });

  it("returns null when nothing usable is present", () => {
    expect(reverseLabel({})).toBeNull();
    expect(reverseLabel(null)).toBeNull();
    expect(reverseLabel({ name: "   " })).toBeNull();
  });
});
