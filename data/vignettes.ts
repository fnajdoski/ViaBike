/**
 * Vignette knowledge table — MOTORCYCLE-specific.
 *
 * A vignette is a FIXED-PERIOD PASS, not a per-trip cost. The UI must show
 * these as one-off line items ("10-day pass — not per trip") so totals
 * aren't misleading.
 *
 * Prices live in data/vignettes.json (with _lastUpdated). There is no
 * reliable free structured feed for vignettes, so a 6-month GitHub Action
 * opens a reminder issue to review the JSON against the official portals
 * named in each note. VERIFY before travel.
 */
import vignetteData from "./vignettes.json";

export type VignetteInfo = {
  iso2: string;
  country: string;
  required: boolean; // for MOTORCYCLES specifically
  /** Cheapest pass that covers a single trip, motorcycle category. */
  shortestPassLabel?: string;
  shortestPassPriceEur?: number;
  originalPrice?: string;
  note: string;
};

export const VIGNETTES_AS_OF = `${vignetteData._lastUpdated} (verify before travel)`;

export const vignettes: VignetteInfo[] = vignetteData.vignettes;

export function vignetteFor(iso2: string): VignetteInfo | undefined {
  return vignettes.find((v) => v.iso2 === iso2);
}
