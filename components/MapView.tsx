"use client";

import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";
import { fmtKm } from "@/lib/format";
import { useRideCost } from "@/state/store";
import { useTheme, type Theme } from "@/state/theme";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

// CARTO light_all is the Positron raster flavor; dark_all the dark matter one
function rasterStyle(theme: Theme): maplibregl.StyleSpecification {
  const flavor = theme === "dark" ? "dark_all" : "light_all";
  return {
    version: 8,
    sources: {
      carto: {
        type: "raster",
        tiles: ["a", "b", "c", "d"].map(
          (s) => `https://${s}.basemaps.cartocdn.com/${flavor}/{z}/{x}/{y}@2x.png`,
        ),
        tileSize: 256,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>',
      },
    },
    layers: [{ id: "carto", type: "raster", source: "carto" }],
  };
}

function styleFor(theme: Theme): string | maplibregl.StyleSpecification {
  return MAPTILER_KEY
    ? `https://api.maptiler.com/maps/dataviz${theme === "dark" ? "-dark" : ""}/style.json?key=${MAPTILER_KEY}`
    : rasterStyle(theme);
}

/** Route line casing: dark halo on dark tiles, white halo on light tiles. */
const CASING: Record<Theme, string> = { dark: "#0a0d12", light: "#ffffff" };
const ROUTE_BLUE: Record<Theme, string> = { dark: "#3aa0ff", light: "#0d6fd1" };

function chip(className: string, text: string, title?: string): HTMLElement {
  const el = document.createElement("div");
  el.className = `marker-chip ${className}`;
  el.textContent = text;
  if (title) el.title = title;
  return el;
}

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const styleReadyRef = useRef(false);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const waypoints = useRideCost((s) => s.waypoints);
  const fuelStops = useRideCost((s) => s.fuelStops);
  const restStops = useRideCost((s) => s.restStops);
  const route = useRideCost((s) => s.route);
  const theme = useTheme((s) => s.theme);

  // init per theme — tiles + line colors are baked into the style, so the
  // simplest correct theme swap is a rebuild (markers/route re-sync on load)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleFor(theme),
      center: [13.5, 45.5],
      zoom: 4.4,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => {
      styleReadyRef.current = true;
      map.addSource("route", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "route-casing",
        type: "line",
        source: "route",
        paint: { "line-color": CASING[theme], "line-width": 7, "line-opacity": 0.7 },
        layout: { "line-cap": "round", "line-join": "round" },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        paint: { "line-color": ROUTE_BLUE[theme], "line-width": 3.5 },
        layout: { "line-cap": "round", "line-join": "round" },
      });
      syncRoute();
      syncMarkers();
    });
    map.on("click", (e) => {
      // clicks on markers don't reach here (markers stop propagation)
      const s = useRideCost.getState();
      const empty = s.waypoints.find((w) => !w.lonLat);
      const lonLat: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const name = `${e.lngLat.lat.toFixed(4)}, ${e.lngLat.lng.toFixed(4)}`;
      if (empty) s.updateWaypoint(empty.id, { lonLat, name });
      else s.addWaypoint({ lonLat, name });
    });
    mapRef.current = map;

    // MapLibre needs a concrete size and won't auto-grow — repaint whenever the
    // container's height changes (planner column growing, window resize, theme
    // toggle, panel-height changes). Covers the desktop stretch-to-column case.
    const ro = new ResizeObserver(() => map.resize());
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      for (const m of markersRef.current) m.remove();
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      styleReadyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  function syncRoute() {
    const map = mapRef.current;
    if (!map || !styleReadyRef.current) return;
    const src = map.getSource("route") as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    src.setData(
      route
        ? { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: route.coordinates } }
        : { type: "FeatureCollection", features: [] },
    );
    if (route) {
      const bounds = route.coordinates.reduce(
        (b, c) => b.extend(c as [number, number]),
        new maplibregl.LngLatBounds(route.coordinates[0] as [number, number], route.coordinates[0] as [number, number]),
      );
      map.fitBounds(bounds, { padding: 60, duration: 700 });
    }
  }

  function syncMarkers() {
    const map = mapRef.current;
    if (!map) return;
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    waypoints.forEach((wp, i) => {
      if (!wp.lonLat) return;
      const letter = String.fromCharCode(65 + (i % 26));
      const marker = new maplibregl.Marker({
        element: chip("marker-wp", letter, wp.name || `Waypoint ${letter}`),
        draggable: true,
      })
        .setLngLat(wp.lonLat)
        .addTo(map);
      marker.on("dragend", () => {
        const p = marker.getLngLat();
        useRideCost.getState().updateWaypoint(wp.id, {
          lonLat: [p.lng, p.lat],
          name: `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`,
        });
      });
      markersRef.current.push(marker);
    });

    for (const stop of fuelStops) {
      const popup = new maplibregl.Popup({ offset: 14 }).setText(
        `⛽ ${stop.poi?.name ?? "Fuel stop"} — km ${Math.round(stop.atKm)}` +
          (stop.poi ? ` (${stop.poi.offRouteKm.toFixed(1)} km off route)` : "") +
          (stop.note ? ` · ${stop.note}` : ""),
      );
      const marker = new maplibregl.Marker({
        element: chip("marker-fuel", stop.status === "none" ? "?" : "⛽", `Fuel · ${fmtKm(stop.atKm)}`),
      })
        .setLngLat(stop.point)
        .setPopup(popup)
        .addTo(map);
      markersRef.current.push(marker);
    }

    for (const stop of restStops) {
      if (stop.combinedWithFuel) continue; // the fuel marker already covers it
      const popup = new maplibregl.Popup({ offset: 12 }).setText(
        `☕ ${stop.poi?.name ?? "Rest stop"} — km ${Math.round(stop.atKm)}` + (stop.note ? ` · ${stop.note}` : ""),
      );
      const marker = new maplibregl.Marker({
        element: chip("marker-rest", stop.status === "none" ? "?" : "☕", `Rest · ${fmtKm(stop.atKm)}`),
      })
        .setLngLat(stop.point)
        .setPopup(popup)
        .addTo(map);
      markersRef.current.push(marker);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(syncRoute, [route]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(syncMarkers, [waypoints, fuelStops, restStops]);

  return (
    // mobile keeps a fixed height; at lg the panel stretches to the grid row
    // (driven by the taller planner column) so there's no white strip below.
    <div className="panel relative h-[460px] overflow-hidden lg:h-full">
      <div ref={containerRef} className="h-full w-full" />
      <p className="text-mute absolute bottom-2 left-2 z-10 rounded bg-night/70 px-2 py-1 text-[10px]">
        Click the map to drop waypoints · drag markers to adjust
      </p>
    </div>
  );
}
