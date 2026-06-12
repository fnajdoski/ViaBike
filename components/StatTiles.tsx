"use client";

import { getBike } from "@/data/bikes";
import { effectiveConsumption, rangeKm, usableTankLiters } from "@/lib/bike";
import { LOAD_FACTOR_LOADED, LOAD_FACTOR_SOLO } from "@/lib/constants";
import { fmtDuration } from "@/lib/format";
import type { CostBreakdown } from "@/lib/types";
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
  if (!bike) return null;

  const lf = loaded ? LOAD_FACTOR_LOADED : LOAD_FACTOR_SOLO;

  return (
    <section className="mx-auto grid max-w-5xl grid-cols-2 gap-3 px-6 sm:grid-cols-3 lg:grid-cols-6">
      <Tile label="Tank" value={bike.tankLiters.toString()} unit="L" sub={`${usableTankLiters(bike).toFixed(1)} L usable (90%)`} />
      <Tile
        label="Consumption"
        value={effectiveConsumption(bike, lf).toFixed(2)}
        unit="L/100km"
        sub={loaded ? "loaded +10%" : "solo"}
      />
      <Tile
        label="Range"
        value={Math.round(rangeKm(bike, lf)).toString()}
        unit="km"
        accent="var(--color-good)"
        sub="on usable tank"
      />
      <Tile
        label="Distance"
        value={route ? Math.round(route.distanceKm).toLocaleString("en-US") : "—"}
        unit={route ? "km" : undefined}
        accent="var(--color-accent)"
      />
      <Tile
        label="Est. time"
        value={route ? fmtDuration(route.durationMin) : "—"}
        accent="var(--color-accent)"
        sub={route ? "riding time, no stops" : undefined}
      />
      <Tile
        label="Est. cost"
        value={breakdown ? `€${Math.round(breakdown.totalEur)}` : "—"}
        accent="var(--color-fuel)"
        sub={breakdown ? "estimate — see breakdown" : undefined}
      />
    </section>
  );
}
