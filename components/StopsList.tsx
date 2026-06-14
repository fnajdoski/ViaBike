"use client";

import type { MessageKey } from "@/lib/i18n/en";
import type { PlannedStop } from "@/lib/types";
import { useFormat, useT } from "@/state/locale";
import { useRideCost } from "@/state/store";

function StopRow({ stop }: { stop: PlannedStop }) {
  const t = useT();
  const icon = stop.type === "fuel" ? "⛽" : "☕";
  const color = stop.type === "fuel" ? "text-fuel" : "text-rest";
  const name =
    stop.poi?.name ??
    (stop.status === "none"
      ? t("stops.noPoi")
      : stop.type === "fuel"
        ? t("stops.fuelUnnamed")
        : t("stops.restUnnamed"));
  return (
    <li className="flex items-start gap-3 rounded-md bg-panel2 px-3 py-2">
      <span className={`${color} text-sm`}>{stop.status === "none" ? "⚠️" : icon}</span>
      <div className="min-w-0">
        <p className="truncate text-xs">
          <span className="tile-number mr-2 text-mute">{t("stops.km", { km: Math.round(stop.atKm) })}</span>
          {name}
        </p>
        <p className="text-[10px] text-mute">
          {stop.poi && <>{t("stops.detour", { km: stop.poi.offRouteKm.toFixed(1) })} · </>}
          {t("stops.targetWas", { km: Math.round(stop.targetKm) })}
          {stop.combinedWithFuel && <> · {t("stops.doublesFuel")}</>}
          {stop.noteKey && <> · {t(stop.noteKey as MessageKey)}</>}
        </p>
      </div>
    </li>
  );
}

export default function StopsList() {
  const fuelStops = useRideCost((s) => s.fuelStops);
  const restStops = useRideCost((s) => s.restStops);
  const restIntervalKm = useRideCost((s) => s.restIntervalKm);
  const restMode = useRideCost((s) => s.restMode);
  const status = useRideCost((s) => s.status);
  const t = useT();
  const fmt = useFormat();
  if (status !== "done") return null;

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="panel p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-fuel">
          ⛽ {t("stops.fuelTitle")}{" "}
          <span className="text-mute normal-case tracking-normal">{t("stops.fuelSub")}</span>
        </h3>
        {fuelStops.length === 0 ? (
          <p className="text-xs text-mute">{t("stops.fuelNone")}</p>
        ) : (
          <ul className="flex flex-col gap-1.5">{fuelStops.map((s, i) => <StopRow key={i} stop={s} />)}</ul>
        )}
      </div>
      <div className="panel p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-rest">
          ☕ {t("stops.restTitle")}{" "}
          {restMode !== "none" && (
            <span className="text-mute normal-case tracking-normal">
              {t("stops.restEvery", { km: fmt.num(Math.round(restIntervalKm ?? 0)) })}
            </span>
          )}
        </h3>
        {restMode === "none" ? (
          <p className="text-xs text-mute">{t("stops.restOff")}</p>
        ) : restStops.length === 0 ? (
          <p className="text-xs text-mute">{t("stops.restNone")}</p>
        ) : (
          <ul className="flex flex-col gap-1.5">{restStops.map((s, i) => <StopRow key={i} stop={s} />)}</ul>
        )}
        <p className="mt-2 text-[10px] text-mute">{t("stops.recommendOnly")}</p>
      </div>
    </section>
  );
}
