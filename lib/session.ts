/**
 * Last-session persistence — planning INPUTS only (tiny, well under 1 KB),
 * plus an optional compact result SUMMARY. Never stores route geometry.
 *
 * All reads are defensive: missing / corrupt / old-version data parses to
 * null so the app falls back to a clean start. Pure (serialize/parse) helpers
 * are unit-tested; the storage wrappers just guard `window` + try/catch.
 */
import type { ExtraCost, Waypoint } from "./types";

export const SESSION_KEY = "ridecost:lastSession";
export const RESULT_KEY = "ridecost:lastResult";
export const SESSION_VERSION = 1;

export type SessionInputs = {
  bikeId: string | null;
  loaded: boolean;
  waypoints: Waypoint[];
  restMode: "distance" | "time";
  restKm: number;
  restHours: number;
  extras: ExtraCost[];
};

/** Compact, geometry-free summary of the last computed plan. */
export type LastResultSummary = {
  savedAt: string; // ISO date
  totalEur: number | null;
  distanceKm: number | null;
  bikeId: string | null;
};

type Stored<T> = T & { version: number };

export function serializeSession(inputs: SessionInputs): string {
  return JSON.stringify({ version: SESSION_VERSION, ...inputs });
}

export function parseSession(raw: string | null | undefined): SessionInputs | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<Stored<SessionInputs>>;
    if (!data || data.version !== SESSION_VERSION) return null;
    if (data.restMode !== "distance" && data.restMode !== "time") return null;
    if (!Array.isArray(data.waypoints)) return null;

    const waypoints: Waypoint[] = data.waypoints
      .filter((w): w is Waypoint => !!w && typeof w.id === "string" && typeof w.name === "string")
      .map((w) => ({
        id: w.id,
        name: w.name,
        lonLat:
          Array.isArray(w.lonLat) &&
          w.lonLat.length === 2 &&
          typeof w.lonLat[0] === "number" &&
          typeof w.lonLat[1] === "number"
            ? [w.lonLat[0], w.lonLat[1]]
            : null,
      }));
    if (waypoints.length < 2) return null;

    const extras: ExtraCost[] = Array.isArray(data.extras)
      ? data.extras.filter(
          (e): e is ExtraCost =>
            !!e &&
            typeof e.id === "string" &&
            typeof e.label === "string" &&
            typeof e.amountEur === "number",
        )
      : [];

    return {
      bikeId: typeof data.bikeId === "string" ? data.bikeId : null,
      loaded: data.loaded === true,
      waypoints,
      restMode: data.restMode,
      restKm: typeof data.restKm === "number" && data.restKm > 0 ? data.restKm : 150,
      restHours: typeof data.restHours === "number" && data.restHours > 0 ? data.restHours : 1.5,
      extras,
    };
  } catch {
    return null;
  }
}

export function serializeResult(summary: LastResultSummary): string {
  return JSON.stringify({ version: SESSION_VERSION, ...summary });
}

export function parseResult(raw: string | null | undefined): LastResultSummary | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<Stored<LastResultSummary>>;
    if (!data || data.version !== SESSION_VERSION) return null;
    if (typeof data.savedAt !== "string") return null;
    return {
      savedAt: data.savedAt,
      totalEur: typeof data.totalEur === "number" ? data.totalEur : null,
      distanceKm: typeof data.distanceKm === "number" ? data.distanceKm : null,
      bikeId: typeof data.bikeId === "string" ? data.bikeId : null,
    };
  } catch {
    return null;
  }
}

// ——— storage wrappers (client-only) ———

export function loadSession(): SessionInputs | null {
  if (typeof window === "undefined") return null;
  try {
    return parseSession(window.localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function saveSession(inputs: SessionInputs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SESSION_KEY, serializeSession(inputs));
  } catch {
    /* private mode / quota — last session just won't persist */
  }
}

export function loadResult(): LastResultSummary | null {
  if (typeof window === "undefined") return null;
  try {
    return parseResult(window.localStorage.getItem(RESULT_KEY));
  } catch {
    return null;
  }
}

export function saveResult(summary: LastResultSummary): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RESULT_KEY, serializeResult(summary));
  } catch {
    /* ignore */
  }
}
