"use client";

import { getBike } from "@/data/bikes";
import { effectiveConsumption, rangeKm, usableTankLiters } from "@/lib/bike";
import { LOAD_FACTOR_LOADED, LOAD_FACTOR_SOLO } from "@/lib/constants";
import type { CostBreakdown } from "@/lib/types";
import { useFormat, useT } from "@/state/locale";
import { useRideCost } from "@/state/store";

function Tile(props: { label: string; value: string; unit?: string; accent?: string; sub?: string }) {
  return (
    <div className="panel relative overflow-hidden p-4">
      <div
        className="absolute inset-x-0 top-0 h-0.5 opacity-70"
        style={{ background: props.accent ?? "var(--color-line)" }}
      />
      <p className="text-mute text-[10px] uppercase tracking-[0.18em]">{props.label}</p>
      <p className="tile-number mt-1.5 text-2xl leading-none">
        {props.value}
        {props.unit && <span className="text-mute ml-1 text-xs font-normal">{props.unit}</span>}
      </p>
      {props.sub && <p className="text-mute mt-1 text-[10px]">{props.sub}</p>}
    </div>
  );
}

export default function StatTiles({ breakdown }: { breakdown: CostBreakdown | null }) {
  const bikeId = useRideCost((s) => s.bikeId);
  const loaded = useRideCost((s) => s.loaded);
  const route = useRideCost((s) => s.route);
  const bike = bikeId ? getBike(bikeId) : undefined;
  const t = useT();
  const fmt = useFormat();
  if (!bike) return null;

  const lf = loaded ? LOAD_FACTOR_LOADED : LOAD_FACTOR_SOLO;

  return (
    <section className="mx-auto grid max-w-5xl grid-cols-2 gap-3 px-6 sm:grid-cols-3 lg:grid-cols-6">
      <Tile
        label={t("stat.tank")}
        value={fmt.num(bike.tankLiters)}
        unit={t("unit.l")}
        sub={t("stat.tankSub", { liters: usableTankLiters(bike).toFixed(1) })}
      />
      <Tile
        label={t("stat.consumption")}
        value={effectiveConsumption(bike, lf).toFixed(2)}
        unit={t("unit.lper100")}
        sub={loaded ? t("stat.consLoaded") : t("stat.consSolo")}
      />
      <Tile
        label={t("stat.range")}
        value={fmt.num(Math.round(rangeKm(bike, lf)))}
        unit={t("unit.km")}
        accent="var(--color-good)"
        sub={t("stat.rangeSub")}
      />
      <Tile
        label={t("stat.distance")}
        value={route ? fmt.num(Math.round(route.distanceKm)) : "—"}
        unit={route ? t("unit.km") : undefined}
        accent="var(--color-accent)"
      />
      <Tile
        label={t("stat.estTime")}
        value={route ? fmt.duration(route.durationMin) : "—"}
        accent="var(--color-accent)"
        sub={route ? t("stat.timeSub") : undefined}
      />
      <Tile
        label={t("stat.estCost")}
        value={breakdown ? fmt.eur(Math.round(breakdown.totalEur)) : "—"}
        accent="var(--color-fuel)"
        sub={breakdown ? t("stat.costSub") : undefined}
      />
    </section>
  );
}
