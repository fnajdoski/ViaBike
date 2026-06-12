import { NextResponse } from "next/server";
import { toEur } from "@/data/currencyRates";
import { encodePolyline } from "@/lib/geo";
import type { LonLat } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * TollGuru proxy — exact motorcycle-class tolls for the route polyline.
 * Without a TOLLGURU_API_KEY this returns { available: false } and the client
 * falls back to the built-in per-country estimate table.
 *
 * NOTE: written against the TollGuru v2 docs
 * (https://tollguru.com/developers/docs); response mapping is defensive since
 * it could not be exercised without a key — treat as experimental.
 */
export async function POST(req: Request) {
  const key = process.env.TOLLGURU_API_KEY;
  if (!key) return NextResponse.json({ available: false, reason: "no TOLLGURU_API_KEY configured" });

  let coordinates: LonLat[];
  try {
    const body = await req.json();
    coordinates = body.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) throw new Error("bad coordinates");
  } catch {
    return NextResponse.json({ error: "Body must be { coordinates: [lon,lat][] }" }, { status: 400 });
  }

  try {
    const res = await fetch(
      "https://apis.tollguru.com/toll/v2/complete-polyline-from-mapping-service",
      {
        method: "POST",
        headers: { "x-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "osrm",
          polyline: encodePolyline(coordinates),
          vehicle: { type: "2AxlesMoto" }, // motorcycle class
          units: { currency: "EUR" },
        }),
      },
    );
    if (!res.ok) {
      return NextResponse.json({ available: false, reason: `TollGuru ${res.status}` });
    }
    const data = await res.json();
    const route = data?.route ?? {};
    const tolls = (route.tolls ?? []).map((t: Record<string, unknown>) => {
      const currency = String(t.currency ?? "EUR");
      const raw = Number(t.tagCost ?? t.cashCost ?? t.licensePlateCost ?? 0);
      return {
        name: String(t.name ?? "Toll"),
        country: String(t.country ?? ""),
        road: String(t.road ?? ""),
        costEur: toEur(raw, currency) ?? raw,
        originalCost: `${raw} ${currency}`,
        paymentMethods: t.tagPriCat ? String(t.tagPriCat) : undefined,
      };
    });
    const fuelEstimate = route.costs?.fuel != null ? Number(route.costs.fuel) : null;
    return NextResponse.json({ available: true, tolls, fuelEstimateEur: fuelEstimate });
  } catch (err) {
    return NextResponse.json({ available: false, reason: String(err) });
  }
}
