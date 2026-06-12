import { create } from "zustand";
import { getBike } from "@/data/bikes";
import { rangeKm } from "@/lib/bike";
import { LOAD_FACTOR_LOADED, LOAD_FACTOR_SOLO } from "@/lib/constants";
import { planTrip, type FuelPricesResponse, type TollGuruResult } from "@/lib/planTrip";
import type { ExtraCost, PlannedStop, RouteData, Waypoint } from "@/lib/types";

export type SavedTrip = {
  name: string;
  savedAt: string;
  bikeId: string | null;
  loaded: boolean;
  waypoints: Waypoint[];
  restMode: "distance" | "time";
  restKm: number;
  restHours: number;
  extras: ExtraCost[];
};

const TRIPS_KEY = "ridecost.trips.v1";

let counter = 0;
const uid = () => `id-${Date.now().toString(36)}-${counter++}`;

type PlanStatus = "idle" | "planning" | "done" | "error";

type RideCostState = {
  bikeId: string | null;
  loaded: boolean;
  waypoints: Waypoint[];
  restMode: "distance" | "time";
  restKm: number;
  restHours: number;
  extras: ExtraCost[];

  status: PlanStatus;
  planStep?: string;
  error?: string;
  warnings: string[];
  route?: RouteData;
  fuelStops: PlannedStop[];
  restStops: PlannedStop[];
  restIntervalKm?: number;
  prices: FuelPricesResponse | null;
  tollguru: TollGuruResult | null;

  selectBike: (id: string) => void;
  clearBike: () => void;
  setLoaded: (loaded: boolean) => void;
  addWaypoint: (wp?: Partial<Waypoint>) => void;
  updateWaypoint: (id: string, patch: Partial<Waypoint>) => void;
  removeWaypoint: (id: string) => void;
  moveWaypoint: (id: string, dir: -1 | 1) => void;
  setRestMode: (mode: "distance" | "time") => void;
  setRestKm: (km: number) => void;
  setRestHours: (h: number) => void;
  addExtra: (label: string, amountEur: number) => void;
  removeExtra: (id: string) => void;
  loadDemo: () => void;
  plan: () => Promise<void>;

  listTrips: () => SavedTrip[];
  saveTrip: (name: string) => void;
  loadTrip: (name: string) => void;
  deleteTrip: (name: string) => void;
};

const emptyResults = {
  status: "idle" as PlanStatus,
  planStep: undefined,
  error: undefined,
  warnings: [] as string[],
  route: undefined,
  fuelStops: [] as PlannedStop[],
  restStops: [] as PlannedStop[],
  restIntervalKm: undefined,
  tollguru: null,
};

function readTrips(): SavedTrip[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(TRIPS_KEY) ?? "[]") as SavedTrip[];
  } catch {
    return [];
  }
}

function writeTrips(trips: SavedTrip[]) {
  window.localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
}

export const useRideCost = create<RideCostState>((set, get) => ({
  bikeId: null,
  loaded: false,
  waypoints: [
    { id: "wp-a", name: "", lonLat: null },
    { id: "wp-b", name: "", lonLat: null },
  ],
  restMode: "distance",
  restKm: 150,
  restHours: 1.5,
  extras: [],
  prices: null,
  ...emptyResults,

  selectBike: (id) => set({ bikeId: id, ...emptyResults }),
  clearBike: () => set({ bikeId: null, ...emptyResults }),
  setLoaded: (loaded) => set({ loaded, ...emptyResults }),

  addWaypoint: (wp) =>
    set((s) => ({
      waypoints: [...s.waypoints, { id: uid(), name: wp?.name ?? "", lonLat: wp?.lonLat ?? null }],
      ...emptyResults,
    })),
  updateWaypoint: (id, patch) =>
    set((s) => ({
      waypoints: s.waypoints.map((w) => (w.id === id ? { ...w, ...patch } : w)),
      ...emptyResults,
    })),
  removeWaypoint: (id) =>
    set((s) =>
      s.waypoints.length <= 2
        ? s
        : { ...s, waypoints: s.waypoints.filter((w) => w.id !== id), ...emptyResults },
    ),
  moveWaypoint: (id, dir) =>
    set((s) => {
      const i = s.waypoints.findIndex((w) => w.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= s.waypoints.length) return s;
      const next = [...s.waypoints];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...s, waypoints: next, ...emptyResults };
    }),

  setRestMode: (restMode) => set({ restMode, ...emptyResults }),
  setRestKm: (restKm) => set({ restKm, ...emptyResults }),
  setRestHours: (restHours) => set({ restHours, ...emptyResults }),

  addExtra: (label, amountEur) =>
    set((s) => ({ extras: [...s.extras, { id: uid(), label, amountEur }] })),
  removeExtra: (id) => set((s) => ({ extras: s.extras.filter((e) => e.id !== id) })),

  loadDemo: () =>
    set({
      // The acceptance-test scenario: Skopje → Milano → Zurich, loaded, rest every 150 km
      bikeId: get().bikeId ?? "bmw-r1300gs-adventure",
      loaded: true,
      restMode: "distance",
      restKm: 150,
      waypoints: [
        { id: uid(), name: "Skopje, North Macedonia", lonLat: [21.4254, 41.9981] },
        { id: uid(), name: "Milano, Italy", lonLat: [9.19, 45.4642] },
        { id: uid(), name: "Zürich, Switzerland", lonLat: [8.5417, 47.3769] },
      ],
      ...emptyResults,
    }),

  plan: async () => {
    const s = get();
    const bike = s.bikeId ? getBike(s.bikeId) : undefined;
    if (!bike) {
      set({ status: "error", error: "Pick a bike first." });
      return;
    }
    const coords = s.waypoints.filter((w) => w.lonLat).map((w) => w.lonLat!);
    if (coords.length < 2) {
      set({ status: "error", error: "Set at least a start and a destination (search or click the map)." });
      return;
    }
    set({ status: "planning", planStep: "Starting…", error: undefined, warnings: [] });
    try {
      const loadFactor = s.loaded ? LOAD_FACTOR_LOADED : LOAD_FACTOR_SOLO;
      const result = await planTrip({
        coords,
        rangeKm: rangeKm(bike, loadFactor),
        restMode: s.restMode,
        restKm: s.restKm,
        restHours: s.restHours,
        onProgress: (planStep) => set({ planStep }),
      });
      set({
        status: "done",
        planStep: undefined,
        route: result.route,
        fuelStops: result.fuelStops,
        restStops: result.restStops,
        restIntervalKm: result.restIntervalKm,
        prices: result.prices,
        tollguru: result.tollguru,
        warnings: result.warnings,
      });
    } catch (err) {
      set({ status: "error", planStep: undefined, error: String(err) });
    }
  },

  listTrips: () => readTrips(),
  saveTrip: (name) => {
    const s = get();
    const trip: SavedTrip = {
      name,
      savedAt: new Date().toISOString(),
      bikeId: s.bikeId,
      loaded: s.loaded,
      waypoints: s.waypoints,
      restMode: s.restMode,
      restKm: s.restKm,
      restHours: s.restHours,
      extras: s.extras,
    };
    writeTrips([...readTrips().filter((t) => t.name !== name), trip]);
    set({}); // poke subscribers so trip lists re-render
  },
  loadTrip: (name) => {
    const trip = readTrips().find((t) => t.name === name);
    if (!trip) return;
    set({
      bikeId: trip.bikeId,
      loaded: trip.loaded,
      waypoints: trip.waypoints,
      restMode: trip.restMode,
      restKm: trip.restKm,
      restHours: trip.restHours,
      extras: trip.extras,
      ...emptyResults,
    });
  },
  deleteTrip: (name) => {
    writeTrips(readTrips().filter((t) => t.name !== name));
    set({});
  },
}));
