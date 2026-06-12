"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { bikes } from "@/data/bikes";
import { rangeKm } from "@/lib/bike";
import { LOAD_FACTOR_SOLO } from "@/lib/constants";
import { useRideCost } from "@/state/store";

export default function BikePicker() {
  const selectBike = useRideCost((s) => s.selectBike);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bikes;
    return bikes.filter((b) => `${b.brand} ${b.model}`.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-mute text-sm uppercase tracking-[0.3em]">Step 1</p>
      <h1 className="wordmark-solid mt-1 text-4xl">PICK YOUR BIKE</h1>
      <p className="text-mute mt-2 max-w-xl text-sm">
        Range and costs are computed from your specific bike — tank size and a real-world
        consumption figure, not the brochure number.
      </p>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search brand or model…"
        className="panel mt-6 w-full max-w-md px-4 py-2.5 text-sm outline-none placeholder:text-mute focus:border-accent"
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((bike) => {
          // any real photo beats the silhouette, same priority as the hero
          const cardImage = bike.imageUrlSolo ?? bike.imageUrlLoaded ?? bike.imageUrl;
          const isSilhouette = cardImage === bike.imageUrl;
          return (
          <button
            key={bike.id}
            onClick={() => selectBike(bike.id)}
            className="panel group cursor-pointer p-4 text-left transition hover:border-accent/60 hover:bg-panel2"
          >
            <div className="relative h-28">
              <Image
                src={cardImage}
                alt=""
                fill
                className={`object-contain opacity-80 transition group-hover:opacity-100 ${isSilhouette ? "bike-silhouette" : ""}`}
              />
            </div>
            <p className="text-mute mt-3 text-xs uppercase tracking-widest">{bike.brand}</p>
            <p className="wordmark-solid text-lg">{bike.model}</p>
            <p className="text-mute mt-2 text-xs">
              {bike.tankLiters} L · {bike.consumptionLper100.toFixed(1)} L/100km ·{" "}
              <span className="text-ink">~{Math.round(rangeKm(bike, LOAD_FACTOR_SOLO))} km range</span>
            </p>
          </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-mute col-span-full py-10 text-center text-sm">
            No match — adding a bike is a one-line edit in <code>data/bikes.ts</code>.
          </p>
        )}
      </div>
    </div>
  );
}
