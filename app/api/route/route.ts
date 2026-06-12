import { NextResponse } from "next/server";
import { countryAtPoint, splitByCountry } from "@/lib/countries";
import { cumulativeKm, sampleEveryKm } from "@/lib/geo";
import type { LonLat, RouteData, RouteLeg } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Step between country-lookup samples along the route. */
const COUNTRY_SAMPLE_KM = 8;

type OrsGeoJson = {
  features: {
    geometry: { coordinates: LonLat[] };
    properties: {
      summary: { distance: number; duration: number };
      segments: { distance: number; duration: number }[];
    };
  }[];
};

type OsrmResponse = {
  code: string;
  routes: {
    geometry: { coordinates: LonLat[] };
    distance: number;
    duration: number;
    legs: { distance: number; duration: number }[];
  }[];
};

async function routeViaOrs(coordinates: LonLat[], key: string) {
  const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
    method: "POST",
    headers: { Authorization: key, "Content-Type": "application/json" },
    body: JSON.stringify({ coordinates }),
  });
  if (!res.ok) throw new Error(`ORS ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as OrsGeoJson;
  const feat = data.features?.[0];
  if (!feat) throw new Error("ORS returned no route");
  return {
    coordinates: feat.geometry.coordinates,
    distanceKm: feat.properties.summary.distance / 1000,
    durationMin: feat.properties.summary.duration / 60,
    legs: feat.properties.segments.map(
      (s): RouteLeg => ({ distanceKm: s.distance / 1000, durationMin: s.duration / 60 }),
    ),
    source: "ors" as const,
  };
}

async function routeViaOsrmDemo(coordinates: LonLat[]) {
  const coordStr = coordinates.map(([lon, lat]) => `${lon},${lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson&steps=false`;
  const res = await fetch(url, { headers: { "User-Agent": "RideCost/0.1 (trip planner demo)" } });
  if (!res.ok) throw new Error(`OSRM demo ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as OsrmResponse;
  const route = data.routes?.[0];
  if (data.code !== "Ok" || !route) throw new Error(`OSRM demo: ${data.code}`);
  return {
    coordinates: route.geometry.coordinates,
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
    legs: route.legs.map(
      (l): RouteLeg => ({ distanceKm: l.distance / 1000, durationMin: l.duration / 60 }),
    ),
    source: "osrm-demo" as const,
  };
}

export async function POST(req: Request) {
  let coordinates: LonLat[];
  try {
    const body = await req.json();
    coordinates = body.coordinates;
    if (
      !Array.isArray(coordinates) ||
      coordinates.length < 2 ||
      coordinates.some((c) => !Array.isArray(c) || c.length !== 2 || c.some((n) => typeof n !== "number"))
    ) {
      throw new Error("bad coordinates");
    }
  } catch {
    return NextResponse.json({ error: "Body must be { coordinates: [lon,lat][] } with ≥ 2 points" }, { status: 400 });
  }
  if (coordinates.length > 50) {
    return NextResponse.json({ error: "Max 50 waypoints (OpenRouteService limit)" }, { status: 400 });
  }

  const orsKey = process.env.ORS_API_KEY;
  let base;
  try {
    base = orsKey ? await routeViaOrs(coordinates, orsKey) : await routeViaOsrmDemo(coordinates);
  } catch (err) {
    // ORS configured but failing → degrade to the demo router rather than dying
    if (orsKey) {
      try {
        base = await routeViaOsrmDemo(coordinates);
      } catch {
        return NextResponse.json({ error: String(err) }, { status: 502 });
      }
    } else {
      return NextResponse.json({ error: String(err) }, { status: 502 });
    }
  }

  const cum = cumulativeKm(base.coordinates);
  const samples = sampleEveryKm(base.coordinates, cum, COUNTRY_SAMPLE_KM).map((s) => ({
    km: s.km,
    iso2: countryAtPoint(s.point),
  }));

  const payload: RouteData = { ...base, countrySegments: splitByCountry(samples) };
  return NextResponse.json(payload);
}
