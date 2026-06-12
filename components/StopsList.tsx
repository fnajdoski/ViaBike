"use client";

import { fmtKm } from "@/lib/format";
import type { PlannedStop } from "@/lib/types";
import { useRideCost } from "@/state/store";

function StopRow({ stop }: { stop: PlannedStop }) {
  const icon = stop.type === "fuel" ? "⛽" : "☕";
  const color = stop.type === "fuel" ? "text-fuel" : "text-rest";
  return (
    <li className="flex items-start gap-3 rounded-md bg-panel2 px-3 py-2">
      <span className={`${color} text-sm`}>{stop.status === "none" ? "⚠️" : icon}</span>
      <div className="min-w-0">
        <p className="truncate text-xs">
          <span className="tile-number mr-2 text-mute">km {Math.round(stop.atKm)}</span>
          {stop.poi?.name ?? (stop.status === "none" ? "No POI found here" : stop.type === "fuel" ? "Fuel station (unnamed)" : "Rest stop (unnamed)")}
        </p>
        <p className="text-[10px] text-mute">
          {stop.poi && <>detour {stop.poi.offRouteKm.toFixed(1)} km · </>}
          target was km {Math.round(stop.targetKm)}
          {stop.combinedWithFuel && " · doubles as the fuel stop"}
          {stop.note && <> · {stop.note}</>}
        </p>
      </div>
    </li>
  );
}

export default function StopsList() {
  const fuelStops = useRideCost((s) => s.fuelStops);
  const restStops = useRideCost((s) => s.restStops);
  const restIntervalKm = useRideCost((s) => s.restIntervalKm);
  const status = useRideCost((s) => s.status);
  if (status !== "done") return null;

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="panel p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-fuel">
          ⛽ Fuel stops <span className="text-mute normal-case tracking-normal">(refuel at 85% of range)</span>
        </h3>
        {fuelStops.length === 0 ? (
          <p className="text-xs text-mute">None needed — the whole trip fits in one tank. 🎉</p>
        ) : (
          <ul className="flex flex-col gap-1.5">{fuelStops.map((s, i) => <StopRow key={i} stop={s} />)}</ul>
        )}
      </div>
      <div className="panel p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-rest">
          ☕ Rest stops{" "}
          <span className="text-mute normal-case tracking-normal">
            (every ~{Math.round(restIntervalKm ?? 0)} km)
          </span>
        </h3>
        {restStops.length === 0 ? (
          <p className="text-xs text-mute">Trip is shorter than one rest interval.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">{restStops.map((s, i) => <StopRow key={i} stop={s} />)}</ul>
        )}
        <p className="mt-2 text-[10px] text-mute">
          Recommendations only — v1 never reorders your route around stops.
        </p>
      </div>
    </section>
  );
}
