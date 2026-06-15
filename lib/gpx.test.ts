import { describe, expect, it } from "vitest";
import { buildGpx, gpxFilename, type GpxWaypoint } from "./gpx";
import type { LonLat } from "./types";

const track: LonLat[] = [
  [21.4254, 41.9981],
  [15.0, 44.0],
  [8.5417, 47.3769],
];
const waypoints: GpxWaypoint[] = [
  { lon: 21.4254, lat: 41.9981, name: "A — Skopje", kind: "waypoint" },
  { lon: 15.0, lat: 44.0, name: "Fuel: Tifon", kind: "fuel" },
  { lon: 12.0, lat: 45.5, name: "Rest: OMV & Café", kind: "rest" },
  { lon: 8.5417, lat: 47.3769, name: "B — Zürich", kind: "waypoint" },
];

describe("buildGpx", () => {
  const gpx = buildGpx({ name: "Skopje → Zürich", track, waypoints });

  it("is a GPX 1.1 document", () => {
    expect(gpx).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(gpx).toContain('<gpx version="1.1" creator="ViaBike"');
  });

  it("includes a track with every route point", () => {
    expect((gpx.match(/<trkpt /g) ?? []).length).toBe(track.length);
    expect(gpx).toContain('<trkpt lat="41.998100" lon="21.425400">');
  });

  it("includes a waypoint for every stop, with names and symbols", () => {
    expect((gpx.match(/<wpt /g) ?? []).length).toBe(waypoints.length);
    expect(gpx).toContain("<name>A — Skopje</name>");
    expect(gpx).toContain("<sym>Gas Station</sym>");
    expect(gpx).toContain("<sym>Restaurant</sym>");
  });

  it("escapes XML-special characters in names", () => {
    const x = buildGpx({ name: "T", track, waypoints: [{ lon: 1, lat: 2, name: "A & B <x>", kind: "fuel" }] });
    expect(x).toContain("A &amp; B &lt;x&gt;");
    expect(x).not.toContain("A & B <x>");
  });
});

describe("gpxFilename", () => {
  it("slugifies origin and destination", () => {
    expect(gpxFilename("Skopje, North Macedonia", "Zürich, Switzerland")).toBe("viabike-skopje-north-macedonia-zurich-switzerland.gpx");
  });
  it("falls back gracefully", () => {
    expect(gpxFilename()).toBe("viabike-trip.gpx");
  });
});
