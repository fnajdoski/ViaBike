"use client";

import { useEffect } from "react";
import { loadSession, saveSession, serializeSession, type SessionInputs } from "@/lib/session";
import { useRideCost } from "@/state/store";

/**
 * Restores the last session's planning inputs on load (never auto-plans) and
 * persists inputs back, debounced. Storage touches happen only here — on
 * mount and on input change — never inside the routing/POI/cost path.
 * Renders nothing.
 */
export default function SessionManager() {
  useEffect(() => {
    const restored = loadSession();
    if (restored) useRideCost.getState().hydrateInputs(restored);

    const snapshot = (s: ReturnType<typeof useRideCost.getState>): SessionInputs => ({
      bikeId: s.bikeId,
      loaded: s.loaded,
      waypoints: s.waypoints,
      restMode: s.restMode,
      restKm: s.restKm,
      restHours: s.restHours,
      extras: s.extras,
    });

    let last = serializeSession(snapshot(useRideCost.getState()));
    let timer: ReturnType<typeof setTimeout> | undefined;

    const unsub = useRideCost.subscribe((state) => {
      const serialized = serializeSession(snapshot(state));
      if (serialized === last) return; // result-only change — skip
      last = serialized;
      clearTimeout(timer);
      timer = setTimeout(() => saveSession(snapshot(useRideCost.getState())), 300);
    });

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  return null;
}
