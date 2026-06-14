"use client";

import { useEffect, useRef, useState } from "react";
import { useRideCost } from "@/state/store";
import { debounce, shouldQuery, type Suggestion } from "@/lib/autocomplete";
import { loadResult, type LastResultSummary } from "@/lib/session";
import type { Waypoint } from "@/lib/types";
import SavedTrips from "./SavedTrips";

function WaypointRow({ wp, index, count }: { wp: Waypoint; index: number; count: number }) {
  const { updateWaypoint, removeWaypoint, moveWaypoint } = useRideCost.getState();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const letter = String.fromCharCode(65 + (index % 26));

  async function query(q: string) {
    try {
      setLoading(true);
      const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(data.results ?? []);
      setActive(-1);
      setOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  // one debounced fetch per row, stable across renders; cancelled on unmount
  const debouncedQuery = useRef(debounce((q: string) => query(q), 280)).current;
  useEffect(() => () => debouncedQuery.cancel(), [debouncedQuery]);

  function onChange(value: string) {
    updateWaypoint(wp.id, { name: value, lonLat: null });
    if (shouldQuery(value)) {
      debouncedQuery(value.trim());
    } else {
      debouncedQuery.cancel();
      setSuggestions([]);
      setOpen(false);
    }
  }

  function select(s: Suggestion) {
    updateWaypoint(wp.id, { name: s.name, lonLat: [s.lon, s.lat] });
    setSuggestions([]);
    setOpen(false);
    setActive(-1);
  }

  // manual fallback (magnifier / Enter with no highlight): query immediately
  function manualSearch() {
    const q = wp.name.trim();
    if (!shouldQuery(q)) return;
    debouncedQuery.cancel();
    query(q);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (open && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (active >= 0) select(suggestions[active]);
        else manualSearch();
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      manualSearch();
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <span className={`marker-chip marker-wp shrink-0 ${wp.lonLat ? "" : "opacity-40"}`}>{letter}</span>
        <input
          value={wp.name}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          placeholder={index === 0 ? "Start — type a place…" : index === count - 1 ? "Destination" : "Via"}
          className="w-full rounded-md border border-line bg-panel2 px-3 py-2 text-sm outline-none placeholder:text-mute focus:border-accent"
        />
        <button
          onClick={manualSearch}
          disabled={loading}
          title="Search place"
          className="cursor-pointer rounded-md border border-line bg-panel2 px-2.5 py-2 text-sm text-mute transition hover:text-ink disabled:opacity-50"
        >
          {loading ? "…" : "🔍"}
        </button>
        <div className="flex shrink-0 flex-col">
          <button onClick={() => moveWaypoint(wp.id, -1)} className="cursor-pointer px-1 text-[10px] text-mute hover:text-ink" title="Move up">▲</button>
          <button onClick={() => moveWaypoint(wp.id, 1)} className="cursor-pointer px-1 text-[10px] text-mute hover:text-ink" title="Move down">▼</button>
        </div>
        <button
          onClick={() => removeWaypoint(wp.id)}
          disabled={count <= 2}
          title={count <= 2 ? "A route needs at least two points" : "Remove"}
          className="shrink-0 cursor-pointer text-mute transition hover:text-warn disabled:opacity-30"
        >
          ✕
        </button>
      </div>
      {open && suggestions.length > 0 && (
        <ul className="panel absolute inset-x-10 z-30 mt-1 max-h-56 overflow-auto text-xs shadow-xl" role="listbox">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                // keep input focus so the click lands before onBlur closes us
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(s)}
                className={`block w-full cursor-pointer px-3 py-2 text-left transition ${i === active ? "bg-panel2" : "hover:bg-panel2"}`}
              >
                <span className="text-ink">{s.name}</span>
                {s.detail && <span className="text-mute"> · {s.detail}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && !loading && suggestions.length === 0 && shouldQuery(wp.name) && (
        <ul className="panel absolute inset-x-10 z-30 mt-1 text-xs shadow-xl">
          <li className="px-3 py-2 text-mute">No matches</li>
        </ul>
      )}
    </div>
  );
}

const REST_KM_PRESETS = [100, 150, 200, 300];
const REST_H_PRESETS = [1, 1.5, 2];

export default function PlannerPanel() {
  const waypoints = useRideCost((s) => s.waypoints);
  const restMode = useRideCost((s) => s.restMode);
  const restKm = useRideCost((s) => s.restKm);
  const restHours = useRideCost((s) => s.restHours);
  const status = useRideCost((s) => s.status);
  const planStep = useRideCost((s) => s.planStep);
  const error = useRideCost((s) => s.error);
  const { addWaypoint, setRestMode, setRestKm, setRestHours, plan, loadDemo } = useRideCost.getState();

  // Surface the cached last-plan summary (geometry-free) so a restored session
  // isn't a blank slate; staleness is explicit and a tap re-plans for current prices.
  const [lastResult, setLastResult] = useState<LastResultSummary | null>(null);
  useEffect(() => setLastResult(loadResult()), []);

  return (
    <div className="panel flex flex-col gap-5 p-5">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-mute">Route</h2>
          <button onClick={loadDemo} className="cursor-pointer text-xs text-accent hover:underline">
            Load demo: Skopje → Milano → Zürich
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {waypoints.map((wp, i) => (
            <WaypointRow key={wp.id} wp={wp} index={i} count={waypoints.length} />
          ))}
        </div>
        <button onClick={() => addWaypoint()} className="mt-2 cursor-pointer text-xs text-accent hover:underline">
          + Add waypoint
        </button>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-mute">Rest stops</h2>
        <div className="panel inline-flex overflow-hidden rounded-full p-0.5 text-xs">
          <button
            onClick={() => setRestMode("distance")}
            className={`cursor-pointer rounded-full px-4 py-1.5 transition ${restMode === "distance" ? "bg-rest font-semibold text-night" : "text-mute hover:text-ink"}`}
          >
            By distance
          </button>
          <button
            onClick={() => setRestMode("time")}
            className={`cursor-pointer rounded-full px-4 py-1.5 transition ${restMode === "time" ? "bg-rest font-semibold text-night" : "text-mute hover:text-ink"}`}
          >
            By time
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {restMode === "distance" ? (
            <>
              {REST_KM_PRESETS.map((km) => (
                <button
                  key={km}
                  onClick={() => setRestKm(km)}
                  className={`cursor-pointer rounded-md border px-3 py-1.5 text-xs transition ${restKm === km ? "border-rest text-rest" : "border-line text-mute hover:text-ink"}`}
                >
                  {km} km
                </button>
              ))}
              <label className="ml-1 flex items-center gap-1.5 text-xs text-mute">
                custom
                <input
                  type="number"
                  min={30}
                  value={restKm}
                  onChange={(e) => setRestKm(Math.max(30, Number(e.target.value) || 150))}
                  className="w-20 rounded-md border border-line bg-panel2 px-2 py-1.5 outline-none focus:border-rest"
                />
                km
              </label>
            </>
          ) : (
            <>
              {REST_H_PRESETS.map((h) => (
                <button
                  key={h}
                  onClick={() => setRestHours(h)}
                  className={`cursor-pointer rounded-md border px-3 py-1.5 text-xs transition ${restHours === h ? "border-rest text-rest" : "border-line text-mute hover:text-ink"}`}
                >
                  {h} h
                </button>
              ))}
              <span className="text-[10px] text-mute">converted to km via the route's average speed</span>
            </>
          )}
        </div>
        <p className="mt-2 text-[10px] text-mute">
          Stops are only recommended within ≤ 2 km of the route — no far deroutings. Fuel stops are
          planned separately from your range (refuel at 85%).
        </p>
      </div>

      <div>
        {lastResult && status === "idle" && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-md border border-line bg-panel2 px-3 py-2 text-[11px] text-mute">
            <span>
              Last plan saved {new Date(lastResult.savedAt).toLocaleDateString()}
              {lastResult.totalEur != null && ` · ~€${Math.round(lastResult.totalEur)}`}
              {lastResult.distanceKm != null && ` · ${Math.round(lastResult.distanceKm)} km`}
              <span className="block text-[10px]">re-plan for current prices</span>
            </span>
            <button
              onClick={plan}
              className="shrink-0 cursor-pointer rounded-md border border-accent px-2.5 py-1 text-[10px] font-semibold text-accent transition hover:bg-accent hover:text-night"
            >
              Re-plan
            </button>
          </div>
        )}
        <button
          onClick={plan}
          disabled={status === "planning"}
          className="w-full cursor-pointer rounded-lg bg-accent py-3 text-sm font-bold uppercase tracking-[0.15em] text-night transition hover:brightness-110 disabled:opacity-60"
        >
          {status === "planning" ? "Planning…" : "Plan trip"}
        </button>
        {status === "planning" && (
          <p className="mt-2 animate-pulse text-center text-xs text-mute">
            {planStep ?? "Planning…"}
          </p>
        )}
        {error && <p className="mt-2 text-xs text-warn">{error}</p>}
      </div>

      <SavedTrips />
    </div>
  );
}
