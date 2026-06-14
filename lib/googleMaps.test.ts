import { describe, expect, it } from "vitest";
import { buildGoogleMapsUrl, MAX_GMAPS_WAYPOINTS } from "./googleMaps";
import type { LonLat } from "./types";

describe("buildGoogleMapsUrl", () => {
  it("returns null for fewer than two points", () => {
    expect(buildGoogleMapsUrl([])).toBeNull();
    expect(buildGoogleMapsUrl([[9, 45]])).toBeNull();
  });

  it("uses first as origin, last as destination (lat,lng order), driving mode", () => {
    const url = buildGoogleMapsUrl([
      [21.4254, 41.9981],
      [8.5417, 47.3769],
    ])!;
    expect(url).toContain("origin=41.9981,21.4254");
    expect(url).toContain("destination=47.3769,8.5417");
    expect(url).toContain("travelmode=driving");
    expect(url).not.toContain("waypoints="); // none between A and B
  });

  it("passes intermediate points as waypoints", () => {
    const url = buildGoogleMapsUrl([
      [21.4254, 41.9981],
      [9.19, 45.4642],
      [8.5417, 47.3769],
    ])!;
    expect(url).toContain("waypoints=45.4642,9.19");
  });

  it("caps intermediate waypoints to the Google limit, keeping origin/destination", () => {
    const coords: LonLat[] = [];
    for (let i = 0; i < 20; i++) coords.push([i, i]);
    const url = buildGoogleMapsUrl(coords)!;
    const wp = new URL(url).searchParams.get("waypoints")!;
    expect(wp.split("|")).toHaveLength(MAX_GMAPS_WAYPOINTS);
    // origin/destination remain the true endpoints
    expect(url).toContain("origin=0,0");
    expect(url).toContain("destination=19,19");
  });

  it("skips malformed coordinates", () => {
    const url = buildGoogleMapsUrl([
      [21.4254, 41.9981],
      [NaN, NaN] as unknown as LonLat,
      [8.5417, 47.3769],
    ])!;
    expect(url).not.toContain("waypoints="); // the bad mid was dropped
  });
});
