"use client";

import { useEffect, useState } from "react";
import { useFormat, useT } from "@/state/locale";
import { useRideCost, type SavedTrip } from "@/state/store";

export default function SavedTrips() {
  const [name, setName] = useState("");
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const { listTrips, saveTrip, loadTrip, deleteTrip } = useRideCost.getState();
  const t = useT();
  const fmt = useFormat();

  // localStorage is client-only — read after mount to avoid hydration mismatch
  useEffect(() => setTrips(listTrips()), [listTrips]);
  const refresh = () => setTrips(listTrips());

  return (
    <div>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-mute">{t("planner.savedTrips")}</h2>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("planner.tripName")}
          className="w-full rounded-md border border-line bg-panel2 px-3 py-1.5 text-xs outline-none placeholder:text-mute focus:border-accent"
        />
        <button
          onClick={() => {
            if (!name.trim()) return;
            saveTrip(name.trim());
            setName("");
            refresh();
          }}
          className="shrink-0 cursor-pointer rounded-md border border-line px-3 py-1.5 text-xs text-mute transition hover:text-ink"
        >
          {t("planner.save")}
        </button>
      </div>
      {trips.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {trips.map((trip) => (
            <li key={trip.name} className="flex items-center justify-between rounded-md bg-panel2 px-3 py-1.5 text-xs">
              <button onClick={() => loadTrip(trip.name)} className="cursor-pointer text-left hover:text-accent">
                {trip.name}
                <span className="ml-2 text-[10px] text-mute">{fmt.date(trip.savedAt)}</span>
              </button>
              <button
                onClick={() => {
                  deleteTrip(trip.name);
                  refresh();
                }}
                className="cursor-pointer text-mute hover:text-warn"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
