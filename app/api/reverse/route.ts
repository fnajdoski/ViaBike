import { NextResponse } from "next/server";
import { reverseLabel } from "@/lib/geocode";

export const dynamic = "force-dynamic";

/**
 * Reverse geocode lat/lon → a readable place name. Primary: OpenRouteService
 * reverse (Pelias) via the server-side ORS key; fallback (keyless): Photon
 * reverse. Always resolves to { name: string | null } — the client falls back
 * to a generic "My location" label when name is null.
 */
type GeoFeature = { properties?: Record<string, unknown> };

async function fromOrs(lat: number, lon: number, key: string): Promise<string | null> {
  const url =
    `https://api.openrouteservice.org/geocode/reverse?api_key=${key}` +
    `&point.lat=${lat}&point.lon=${lon}&size=1`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`ORS ${res.status}`);
  const data = (await res.json()) as { features?: GeoFeature[] };
  return reverseLabel(data.features?.[0]?.properties);
}

async function fromPhoton(lat: number, lon: number): Promise<string | null> {
  const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}&lang=en`;
  const res = await fetch(url, {
    headers: { "User-Agent": "RideCost/0.1 (motorcycle trip planner)" },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const data = (await res.json()) as { features?: GeoFeature[] };
  return reverseLabel(data.features?.[0]?.properties);
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const lat = Number(sp.get("lat"));
  const lon = Number(sp.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "lat and lon required" }, { status: 400 });
  }

  const key = process.env.ORS_API_KEY;
  if (key) {
    try {
      return NextResponse.json({ name: await fromOrs(lat, lon, key) });
    } catch {
      /* fall through to Photon */
    }
  }
  try {
    return NextResponse.json({ name: await fromPhoton(lat, lon) });
  } catch {
    return NextResponse.json({ name: null });
  }
}
