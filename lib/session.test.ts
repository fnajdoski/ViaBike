import { describe, expect, it } from "vitest";
import {
  parseResult,
  parseSession,
  serializeResult,
  serializeSession,
  SESSION_VERSION,
  type SessionInputs,
} from "./session";

const inputs: SessionInputs = {
  bikeId: "bmw-r1300gs-adventure",
  loaded: true,
  waypoints: [
    { id: "a", name: "Skopje", lonLat: [21.4254, 41.9981] },
    { id: "b", name: "Milano", lonLat: [9.19, 45.4642] },
    { id: "c", name: "Zürich", lonLat: null },
  ],
  restMode: "distance",
  restKm: 150,
  restHours: 1.5,
  extras: [{ id: "x", label: "Ferry", amountEur: 30 }],
};

describe("session serialize/parse", () => {
  it("round-trips planning inputs", () => {
    expect(parseSession(serializeSession(inputs))).toEqual(inputs);
  });

  it("stamps the current version", () => {
    expect(JSON.parse(serializeSession(inputs)).version).toBe(SESSION_VERSION);
  });

  it("returns null for missing/empty input", () => {
    expect(parseSession(null)).toBeNull();
    expect(parseSession(undefined)).toBeNull();
    expect(parseSession("")).toBeNull();
  });

  it("returns null for corrupt JSON", () => {
    expect(parseSession("{not json")).toBeNull();
  });

  it("rejects an old/!matching version", () => {
    const stale = JSON.stringify({ ...inputs, version: 0 });
    expect(parseSession(stale)).toBeNull();
  });

  it("rejects a bad restMode or too-few waypoints", () => {
    expect(parseSession(JSON.stringify({ version: 1, ...inputs, restMode: "wat" }))).toBeNull();
    expect(
      parseSession(JSON.stringify({ version: 1, ...inputs, waypoints: [inputs.waypoints[0]] })),
    ).toBeNull();
  });

  it("drops malformed waypoint coords to null rather than crashing", () => {
    const raw = JSON.stringify({
      version: 1,
      ...inputs,
      waypoints: [
        { id: "a", name: "A", lonLat: [1, 2] },
        { id: "b", name: "B", lonLat: [99] }, // malformed → null
      ],
    });
    const parsed = parseSession(raw);
    expect(parsed?.waypoints[1].lonLat).toBeNull();
    expect(parsed?.waypoints[0].lonLat).toEqual([1, 2]);
  });

  it("falls back to sane rest defaults when values are invalid", () => {
    const raw = JSON.stringify({ version: 1, ...inputs, restKm: -5, restHours: 0 });
    const parsed = parseSession(raw);
    expect(parsed?.restKm).toBe(150);
    expect(parsed?.restHours).toBe(1.5);
  });
});

describe("result summary serialize/parse", () => {
  it("round-trips the compact summary", () => {
    const summary = { savedAt: "2026-06-13T10:00:00.000Z", totalEur: 275, distanceKm: 1731, bikeId: "x" };
    expect(parseResult(serializeResult(summary))).toEqual(summary);
  });

  it("returns null for corrupt or versionless data", () => {
    expect(parseResult("nope")).toBeNull();
    expect(parseResult(JSON.stringify({ savedAt: "x" }))).toBeNull();
  });

  it("coerces missing numeric fields to null", () => {
    const raw = JSON.stringify({ version: 1, savedAt: "2026-06-13" });
    expect(parseResult(raw)).toEqual({ savedAt: "2026-06-13", totalEur: null, distanceKm: null, bikeId: null });
  });
});
