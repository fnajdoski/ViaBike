import { NextResponse } from "next/server";
import type { Suggestion } from "@/lib/autocomplete";

export const dynamic = "force-dynamic";

/**
 * Address autocomplete proxy. Primary: OpenRouteService geocode/autocomplete
 * (Pelias) via the server-side ORS key. Fallback (keyless): Photon, which is
 * purpose-built for search-as-you-type. Nominatim is intentionally NOT used
 * here — its policy forbids per-keystroke queries.
 *
 * Always resolves to { results: Suggestion[] } — never throws to the client.
 */

type GeoFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: Record<string, unknown>;
};

function dedupeJoin(parts: (unknown | undefined)[], exclude: string): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const s = typeof p === "string" ? p.trim() : "";
    if (!s || s === exclude || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out.join(", ");
}

function toSuggestion(f: GeoFeature, primaryKeys: string[], detailKeys: string[]): Suggestion | null {
  const c = f.geometry?.coordinates;
  if (!c || typeof c[0] !== "number" || typeof c[1] !== "number") return null;
  const props = f.properties ?? {};
  const name =
    (primaryKeys.map((k) => props[k]).find((v) => typeof v === "string" && v) as string | undefined) ?? "";
  if (!name) return null;
  return {
    name,
    detail: dedupeJoin(
      detailKeys.map((k) => props[k]),
      name,
    ),
    lon: c[0],
    lat: c[1],
  };
}

async function fromOrs(q: string, key: string): Promise<Suggestion[]> {
  const url =
    `https://api.openrouteservice.org/geocode/autocomplete?api_key=${key}` +
    `&text=${encodeURIComponent(q)}&size=5`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`ORS ${res.status}`);
  const data = (await res.json()) as { features?: GeoFeature[] };
  return (data.features ?? [])
    .map((f) => toSuggestion(f, ["name", "label"], ["locality", "region", "country"]))
    .filter((s): s is Suggestion => s !== null);
}

async function fromPhoton(q: string): Promise<Suggestion[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lang=en`;
  const res = await fetch(url, {
    headers: { "User-Agent": "RideCost/0.1 (motorcycle trip planner)" },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const data = (await res.json()) as { features?: GeoFeature[] };
  return (data.features ?? [])
    .map((f) => toSuggestion(f, ["name"], ["city", "state", "country"]))
    .filter((s): s is Suggestion => s !== null);
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) return NextResponse.json({ results: [] });

  const key = process.env.ORS_API_KEY;
  if (key) {
    try {
      return NextResponse.json({ results: await fromOrs(q, key), source: "ors" });
    } catch {
      /* fall through to Photon */
    }
  }
  try {
    return NextResponse.json({ results: await fromPhoton(q), source: "photon" });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
