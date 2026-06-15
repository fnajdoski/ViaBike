"use client";

import { useMemo, useState } from "react";
import { cumulativeKm, nearestOnRoute } from "@/lib/geo";
import { buildGpx, gpxFilename, type GpxWaypoint } from "@/lib/gpx";
import { buildGoogleMapsExport, type ExportPoint } from "@/lib/googleMaps";
import { useT } from "@/state/locale";
import { useRideCost } from "@/state/store";

export default function ExportBar() {
  const status = useRideCost((s) => s.status);
  const route = useRideCost((s) => s.route);
  const waypoints = useRideCost((s) => s.waypoints);
  const fuelStops = useRideCost((s) => s.fuelStops);
  const restStops = useRideCost((s) => s.restStops);
  const bikeId = useRideCost((s) => s.bikeId);
  const t = useT();
  const [includeFuel, setIncludeFuel] = useState(true);
  const [includeRest, setIncludeRest] = useState(true);

  // Build export points (with along-route distance) from the in-memory plan.
  const data = useMemo(() => {
    if (!route || route.coordinates.length < 2) return null;
    const coords = route.coordinates;
    const cum = cumulativeKm(coords);

    const explicit = waypoints.filter((w) => w.lonLat);
    const wpPoints: ExportPoint[] = explicit.map((w) => ({
      lon: w.lonLat![0],
      lat: w.lonLat![1],
      routeKm: nearestOnRoute(coords, cum, w.lonLat!).routeKm,
      name: w.name,
    }));
    if (wpPoints.length < 2) return null;

    const fuel: ExportPoint[] = fuelStops.map((s) => ({
      lon: s.point[0],
      lat: s.point[1],
      routeKm: s.atKm,
      name: s.poi?.name,
    }));
    // skip rest stops that just reuse a fuel stop (same location)
    const rest: ExportPoint[] = restStops
      .filter((s) => !s.combinedWithFuel)
      .map((s) => ({ lon: s.point[0], lat: s.point[1], routeKm: s.atKm, name: s.poi?.name }));

    const gmaps = buildGoogleMapsExport({ waypoints: wpPoints, fuel, rest, includeFuel, includeRest });

    // GPX waypoints — every point, named with a letter / kind prefix
    const gpxWpts: GpxWaypoint[] = [
      ...explicit.map((w, i): GpxWaypoint => ({
        lon: w.lonLat![0],
        lat: w.lonLat![1],
        name: `${String.fromCharCode(65 + i)} — ${w.name || `${w.lonLat![1].toFixed(3)}, ${w.lonLat![0].toFixed(3)}`}`,
        kind: "waypoint",
      })),
      ...fuelStops.map((s): GpxWaypoint => ({
        lon: s.point[0],
        lat: s.point[1],
        name: `Fuel: ${s.poi?.name ?? `km ${Math.round(s.atKm)}`}`,
        kind: "fuel",
      })),
      ...restStops
        .filter((s) => !s.combinedWithFuel)
        .map((s): GpxWaypoint => ({
          lon: s.point[0],
          lat: s.point[1],
          name: `Rest: ${s.poi?.name ?? `km ${Math.round(s.atKm)}`}`,
          kind: "rest",
        })),
    ];
    const tripName = `${explicit[0].name || "Start"} → ${explicit[explicit.length - 1].name || "End"}`;
    return { gmaps, gpxWpts, tripName, track: coords, first: explicit[0].name, last: explicit[explicit.length - 1].name };
  }, [route, waypoints, fuelStops, restStops, includeFuel, includeRest]);

  if (status !== "done" || !data) return null;

  function downloadGpx() {
    if (!data) return;
    const xml = buildGpx({ name: data.tripName, track: data.track, waypoints: data.gpxWpts });
    const blob = new Blob([xml], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = gpxFilename(data.first, data.last);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const { gmaps } = data;

  return (
    <div className="panel flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        {gmaps.url && (
          <a
            href={gmaps.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-night transition hover:brightness-110"
          >
            🧭 {t("planner.openInMaps")} ↗
          </a>
        )}
        <button
          onClick={downloadGpx}
          className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent/60"
        >
          ⤓ {t("export.gpx")}
        </button>

        <label className="ml-1 flex cursor-pointer items-center gap-1.5 text-xs text-mute">
          <input type="checkbox" checked={includeFuel} onChange={(e) => setIncludeFuel(e.target.checked)} className="accent-fuel" />
          {t("export.includeFuel")}
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-mute">
          <input type="checkbox" checked={includeRest} onChange={(e) => setIncludeRest(e.target.checked)} className="accent-rest" />
          {t("export.includeRest")}
        </label>
      </div>

      {gmaps.capped && (
        <p className="text-[10px] leading-relaxed text-mute">
          {t("export.capped", {
            max: 9,
            fuelInc: gmaps.fuel.included,
            fuelTot: gmaps.fuel.total,
            restInc: gmaps.rest.included,
            restTot: gmaps.rest.total,
          })}
        </p>
      )}
    </div>
  );
}
