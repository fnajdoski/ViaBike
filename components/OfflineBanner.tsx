"use client";

import { FUEL_PRICES_UPDATED } from "@/data/fuelPrices";
import { useOnline } from "@/lib/useOnline";
import { useFormat, useT } from "@/state/locale";

/** Slim banner shown only when offline: explains saved data is being shown and
 * that planning a new route needs a connection. */
export default function OfflineBanner() {
  const online = useOnline();
  const t = useT();
  const fmt = useFormat();
  if (online) return null;
  return (
    <div className="mx-auto max-w-7xl px-6 pt-3">
      <p className="rounded-lg border border-warn/40 bg-warn/10 px-4 py-2 text-xs text-ink" role="status">
        ⚠️ {t("offline.banner", { date: fmt.date(FUEL_PRICES_UPDATED) })}
      </p>
    </div>
  );
}
