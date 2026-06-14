/** [longitude, latitude] — GeoJSON order, used everywhere in this app. */
export type LonLat = [number, number];

/** Bike body style — drives the category illustration shown for the bike. */
export type BikeCategory =
  | "sport"
  | "naked"
  | "adventure"
  | "touring"
  | "cruiser"
  | "retro"
  | "scooter"
  | "maxiscooter"
  | "small";

/** Luggage drawn on the "loaded" illustration. Defaults from category; a bike
 * may override it (e.g. a flagship tourer with integrated cases). */
export type LuggageStyle =
  | "hard-panniers"
  | "tail-bag"
  | "tank-bag"
  | "leather-saddlebags"
  | "soft-saddlebag"
  | "integrated-cases"
  | "top-box"
  | "minimal";

export type Bike = {
  id: string;
  brand: string;
  model: string;
  year?: number;
  imageUrl: string; // placeholder; swap in your own asset
  /** Photo of the bike alone — shown when the Solo toggle is active. */
  imageUrlSolo?: string;
  /** Same bike with luggage/panniers (+ pillion where natural) — shown when Loaded. */
  imageUrlLoaded?: string;
  tankLiters: number;
  consumptionLper100: number; // REAL-WORLD figure, not the brochure number
  sourceNote: string; // where the figures came from
  /** Big hero treatment: solid line over outlined line (BMW-Connected vibe). */
  wordmark: { solid: string; outline?: string };
  category: BikeCategory;
  /** Optional override of the category's default loaded-luggage style. */
  luggageStyle?: LuggageStyle;
};

export type Waypoint = {
  id: string;
  name: string;
  lonLat: LonLat | null; // null until geocoded / placed on map
};

export type RouteLeg = { distanceKm: number; durationMin: number };

export type CountrySegment = {
  iso2: string; // "??" when the country could not be determined
  km: number;
};

export type RouteData = {
  coordinates: LonLat[];
  distanceKm: number;
  durationMin: number;
  legs: RouteLeg[];
  countrySegments: CountrySegment[];
  source: "ors" | "osrm-demo";
};

export type PoiKind = "fuel" | "cafe" | "services" | "rest_area";

export type Poi = {
  id: string;
  name?: string;
  lat: number;
  lon: number;
  kind: PoiKind;
};

/** A POI annotated with its position relative to the route. */
export type RoutePoi = Poi & {
  routeKm: number; // distance along the route of the nearest route point
  offRouteKm: number; // straight-line detour distance off the route
};

export type StopStatus = "found" | "fallback-early" | "none";

export type PlannedStop = {
  type: "fuel" | "rest";
  targetKm: number; // where the cadence/range said to stop
  atKm: number; // where the recommended stop actually is
  point: LonLat;
  poi?: RoutePoi;
  status: StopStatus;
  note?: string;
  combinedWithFuel?: boolean; // rest stop that reuses a fuel stop
};

export type FuelCountryCost = {
  iso2: string;
  km: number;
  liters: number;
  pricePerLiterEur: number;
  costEur: number;
  estimate: boolean;
};

export type TollCountryCost = {
  iso2: string;
  km: number;
  costEur: number;
  note: string;
};

export type VignetteItem = {
  iso2: string;
  label: string;
  priceEur: number;
  originalPrice?: string; // e.g. "CHF 40"
  note: string;
};

export type ExtraCost = { id: string; label: string; amountEur: number };

export type CostBreakdown = {
  fuel: FuelCountryCost[];
  fuelTotalEur: number;
  tolls: TollCountryCost[];
  tollsTotalEur: number;
  tollsSource: "tollguru" | "builtin-estimate";
  vignettes: VignetteItem[];
  vignettesTotalEur: number;
  extrasTotalEur: number;
  totalEur: number;
};
