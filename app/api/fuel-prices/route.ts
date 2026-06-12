import { NextResponse } from "next/server";
import { FUEL_PRICES_AS_OF, FUEL_PRICES_SOURCE, fuelPricesEurPerLiter } from "@/data/fuelPrices";

export const dynamic = "force-dynamic";

/**
 * Per-country fuel prices (unleaded 95, EUR/L).
 *
 * Served from data/fuelPrices.json — refreshed every two weeks by a GitHub
 * Action from the OpenVan.camp public fuel API (CC BY 4.0), merged over a
 * builtin fallback table so no country ever comes back empty.
 */
export async function GET() {
  return NextResponse.json({
    source: FUEL_PRICES_SOURCE,
    asOf: FUEL_PRICES_AS_OF,
    estimate: true,
    prices: fuelPricesEurPerLiter,
  });
}
