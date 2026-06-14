import { describe, expect, it } from "vitest";
import { bikes } from "@/data/bikes";
import { DEFAULT_LUGGAGE, luggageFor, resolveBikeImage } from "./bikeArt";
import type { Bike, BikeCategory } from "./types";

const ALL: BikeCategory[] = [
  "sport",
  "naked",
  "adventure",
  "touring",
  "cruiser",
  "retro",
  "scooter",
  "maxiscooter",
  "small",
];

function bike(p: Partial<Bike>): Bike {
  return {
    id: "x",
    brand: "B",
    model: "M",
    imageUrl: "/bikes/naked.svg",
    tankLiters: 15,
    consumptionLper100: 5,
    sourceNote: "",
    wordmark: { solid: "X" },
    category: "naked",
    ...p,
  };
}

describe("DEFAULT_LUGGAGE", () => {
  it("maps every category to a luggage style", () => {
    for (const c of ALL) expect(DEFAULT_LUGGAGE[c]).toBeTruthy();
  });

  it("matches the spec's per-type luggage", () => {
    expect(DEFAULT_LUGGAGE.adventure).toBe("hard-panniers");
    expect(DEFAULT_LUGGAGE.sport).toBe("tail-bag");
    expect(DEFAULT_LUGGAGE.naked).toBe("tank-bag");
    expect(DEFAULT_LUGGAGE.cruiser).toBe("leather-saddlebags");
    expect(DEFAULT_LUGGAGE.retro).toBe("soft-saddlebag");
    expect(DEFAULT_LUGGAGE.scooter).toBe("top-box");
    expect(DEFAULT_LUGGAGE.small).toBe("minimal");
  });
});

describe("luggageFor", () => {
  it("uses the category default", () => {
    expect(luggageFor({ category: "adventure" })).toBe("hard-panniers");
  });
  it("honors a per-bike override", () => {
    expect(luggageFor({ category: "touring", luggageStyle: "integrated-cases" })).toBe("integrated-cases");
  });
});

describe("resolveBikeImage", () => {
  it("prefers the matching photo, then the other photo", () => {
    const b = bike({ imageUrlSolo: "/s.png", imageUrlLoaded: "/l.png" });
    expect(resolveBikeImage(b, false)).toEqual({ kind: "photo", src: "/s.png" });
    expect(resolveBikeImage(b, true)).toEqual({ kind: "photo", src: "/l.png" });
    // only a loaded photo → used in both states
    const lo = bike({ imageUrlLoaded: "/l.png" });
    expect(resolveBikeImage(lo, false)).toEqual({ kind: "photo", src: "/l.png" });
  });

  it("falls back to category art with luggage driven by the toggle", () => {
    const b = bike({ category: "adventure" });
    expect(resolveBikeImage(b, false)).toEqual({ kind: "art", category: "adventure", luggage: null });
    expect(resolveBikeImage(b, true)).toEqual({ kind: "art", category: "adventure", luggage: "hard-panniers" });
  });

  it("keeps the R 1300 GS Adventure's real photos (don't-touch guarantee)", () => {
    const gsa = bikes.find((b) => b.id === "bmw-r1300gs-adventure")!;
    expect(resolveBikeImage(gsa, false).kind).toBe("photo");
    expect(resolveBikeImage(gsa, true)).toMatchObject({ kind: "photo" });
  });
});

describe("bike database categories", () => {
  it("every bike has a valid category", () => {
    for (const b of bikes) expect(ALL).toContain(b.category);
  });
});
