import { NextResponse } from "next/server";
import { buildOverpassQueries, type Corridor } from "@/lib/overpass";
import type { Poi, PoiKind } from "@/lib/types";

export const dynamic = "force-dynamic";
// Overpass queries + retries can run well past Vercel's default timeout
export const maxDuration = 60;

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

/** Re-planning the same trip shouldn't hammer Overpass — cache for 10 min. */
const cache = new Map<string, { at: number; pois: Poi[] }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Identical queries share one upstream request; at most two distinct queries
 * run concurrently — Overpass allows ~2 slots/IP and queues (then penalizes)
 * anything beyond. The two kind-group queries of one plan run in parallel.
 */
const inflight = new Map<string, Promise<Poi[]>>();
const MAX_CONCURRENT = 2;
let active = 0;
const waiters: (() => void)[] = [];
async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  while (active >= MAX_CONCURRENT) {
    await new Promise<void>((r) => waiters.push(r));
  }
  active++;
  try {
    return await fn();
  } finally {
    active--;
    waiters.shift()?.();
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function classify(tags: Record<string, string>): PoiKind | null {
  if (tags.amenity === "fuel") return "fuel";
  if (tags.amenity === "cafe") return "cafe";
  if (tags.highway === "services") return "services";
  if (tags.highway === "rest_area") return "rest_area";
  return null;
}

export async function POST(req: Request) {
  let corridors: Corridor[];
  let radiusM: number;
  try {
    const body = await req.json();
    corridors = body.corridors;
    radiusM = Math.min(Math.max(Number(body.radiusM) || 2500, 200), 8000);
    if (!Array.isArray(corridors) || corridors.length === 0) throw new Error("no corridors");
  } catch {
    return NextResponse.json(
      { error: "Body must be { corridors: { points: [lat,lon][], kinds: PoiKind[] }[], radiusM? }" },
      { status: 400 },
    );
  }

  const queries = buildOverpassQueries(corridors, radiusM);
  if (!queries.length) return NextResponse.json({ pois: [] });

  try {
    const results = await Promise.all(queries.map(runQuery));
    // merge + dedupe across the parallel queries
    const seen = new Set<string>();
    const pois: Poi[] = [];
    for (const batch of results) {
      for (const poi of batch) {
        if (seen.has(poi.id)) continue;
        seen.add(poi.id);
        pois.push(poi);
      }
    }
    return NextResponse.json({ pois });
  } catch (err) {
    return NextResponse.json({ error: `All Overpass endpoints failed: ${String(err)}` }, { status: 502 });
  }
}

function runQuery(query: string): Promise<Poi[]> {
  const cached = cache.get(query);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return Promise.resolve(cached.pois);
  }
  let promise = inflight.get(query);
  if (!promise) {
    promise = withSlot(() => fetchOverpass(query)).then((pois) => {
      cache.set(query, { at: Date.now(), pois });
      if (cache.size > 20) cache.delete(cache.keys().next().value!);
      return pois;
    });
    inflight.set(query, promise);
    promise.finally(() => inflight.delete(query)).catch(() => {});
  }
  return promise;
}

async function fetchOverpass(query: string): Promise<Poi[]> {
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await sleep(5000); // 429s are transient — give the slots a breath
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            // Overpass's Apache rejects UA-less requests (406/429)
            "User-Agent": "RideCost/0.1 (motorcycle trip planner demo)",
            Accept: "application/json",
          },
          body: `data=${encodeURIComponent(query)}`,
          // Overpass queues throttled clients instead of rejecting — don't hang
          signal: AbortSignal.timeout(40_000),
        });
        if (!res.ok) {
          lastError = `Overpass ${res.status}`;
          continue;
        }
        const data = (await res.json()) as { elements: OverpassElement[]; remark?: string };
        if (data.remark?.includes("error")) {
          // Overpass reports query timeouts as HTTP 200 + remark
          lastError = `Overpass remark: ${data.remark}`;
          continue;
        }
        const seen = new Set<string>();
        const pois: Poi[] = [];
        for (const el of data.elements ?? []) {
          const tags = el.tags ?? {};
          const kind = classify(tags);
          const lat = el.lat ?? el.center?.lat;
          const lon = el.lon ?? el.center?.lon;
          if (!kind || lat === undefined || lon === undefined) continue;
          const id = `${el.type}/${el.id}`;
          if (seen.has(id)) continue;
          seen.add(id);
          pois.push({ id, name: tags.name || tags.brand || undefined, lat, lon, kind });
        }
        return pois;
      } catch (err) {
        lastError = String(err);
      }
    }
  }
  throw new Error(lastError);
}
