"use client";

import { useMemo, useState } from "react";
import { bikes } from "@/data/bikes";
import { rangeKm } from "@/lib/bike";
import { LOAD_FACTOR_SOLO } from "@/lib/constants";
import { useFormat, useT } from "@/state/locale";
import { useRideCost } from "@/state/store";
import BikeArt from "./BikeArt";

export default function BikePicker() {
  const selectBike = useRideCost((s) => s.selectBike);
  const t = useT();
  const fmt = useFormat();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bikes;
    return bikes.filter((b) => `${b.brand} ${b.model}`.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-mute text-sm uppercase tracking-[0.3em]">{t("picker.step1")}</p>
      <h1 className="wordmark-solid mt-1 text-4xl">{t("picker.title")}</h1>
      <p className="text-mute mt-2 max-w-xl text-sm">{t("picker.intro")}</p>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("picker.search")}
        className="panel mt-6 w-full max-w-md px-4 py-2.5 text-sm outline-none placeholder:text-mute focus:border-accent"
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((bike) => {
          return (
          <button
            key={bike.id}
            onClick={() => selectBike(bike.id)}
            className="panel group cursor-pointer p-4 text-left transition hover:border-accent/60 hover:bg-panel2"
          >
            {/* gallery shows the solo state; real photo wins, else category art */}
            <div className="relative h-28 opacity-80 transition group-hover:opacity-100">
              <BikeArt bike={bike} loaded={false} sizes="(max-width: 1024px) 45vw, 240px" />
            </div>
            <p className="text-mute mt-3 text-xs uppercase tracking-widest">{bike.brand}</p>
            <p className="wordmark-solid text-lg">{bike.model}</p>
            <p className="text-mute mt-2 text-xs">
              {fmt.num(bike.tankLiters)} {t("unit.l")} · {bike.consumptionLper100.toFixed(1)} {t("unit.lper100")} ·{" "}
              <span className="text-ink">~{fmt.num(Math.round(rangeKm(bike, LOAD_FACTOR_SOLO)))} {t("picker.rangeSuffix")}</span>
            </p>
          </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-mute col-span-full py-10 text-center text-sm">{t("picker.noMatch")}</p>
        )}
      </div>
    </div>
  );
}
