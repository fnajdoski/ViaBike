/** Never plan on the dregs — only 90% of the tank counts as usable. */
export const USABLE_FRACTION = 0.9;

/** Plan each refuel at 85% of effective range — arrive with a reserve. */
export const REFUEL_AT_FRACTION = 0.85;

/** Max one-way detour off the route for a recommended stop. */
export const MAX_DETOUR_KM = 2;

/** Luggage + passenger consumption penalty. Single constant — easy to tune. */
export const LOAD_FACTOR_LOADED = 1.1;
export const LOAD_FACTOR_SOLO = 1.0;

/** How far around a fuel target we accept a station (km along the route). */
export const FUEL_WINDOW_KM = 45;

/** How far around a rest target we accept a rest POI (km along the route). */
export const REST_WINDOW_KM = 20;

/** A rest stop within this distance of a fuel stop merges into it. */
export const REST_NEAR_FUEL_KM = 35;

/** Don't suggest a rest stop within this distance of the destination. */
export const SKIP_REST_NEAR_END_KM = 30;
