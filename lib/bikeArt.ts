import type { Bike, BikeCategory, LuggageStyle } from "./types";

/**
 * Default loaded-luggage style per category (per the artwork spec). A bike may
 * override via `luggageStyle` — e.g. a flagship tourer with integrated cases.
 */
export const DEFAULT_LUGGAGE: Record<BikeCategory, LuggageStyle> = {
  adventure: "hard-panniers",
  touring: "hard-panniers",
  sport: "tail-bag",
  naked: "tank-bag",
  cruiser: "leather-saddlebags",
  retro: "soft-saddlebag",
  scooter: "top-box",
  maxiscooter: "top-box",
  small: "minimal",
};

export function luggageFor(bike: Pick<Bike, "category" | "luggageStyle">): LuggageStyle {
  return bike.luggageStyle ?? DEFAULT_LUGGAGE[bike.category];
}

/**
 * Image resolution priority:
 *  1. explicit photo override (imageUrlSolo / imageUrlLoaded) — e.g. the
 *     R 1300 GS Adventure's real shots; the loaded state prefers the loaded
 *     photo and vice-versa, with the other photo as a same-bike fallback;
 *  2. the category illustration (solo vs loaded driven by the toggle);
 *  (the old generic silhouette remains only as an ultimate fallback in the UI).
 */
export type ResolvedImage =
  | { kind: "photo"; src: string }
  | { kind: "art"; category: BikeCategory; luggage: LuggageStyle | null };

export function resolveBikeImage(bike: Bike, loaded: boolean): ResolvedImage {
  const photo = loaded
    ? (bike.imageUrlLoaded ?? bike.imageUrlSolo)
    : (bike.imageUrlSolo ?? bike.imageUrlLoaded);
  if (photo) return { kind: "photo", src: photo };
  return { kind: "art", category: bike.category, luggage: loaded ? luggageFor(bike) : null };
}
