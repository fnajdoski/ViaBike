"use client";

import { useT } from "@/state/locale";

// Navigation fallback served by the service worker when the network is down.
// RideCost needs live routing/prices, so there's nothing to plan offline —
// this just explains that, themed and localized to match the app.
export default function Offline() {
  const t = useT();
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div className="panel max-w-sm p-8">
        <p className="wordmark-solid text-2xl tracking-[0.2em]">
          RIDE<span className="text-accent">COST</span>
        </p>
        <p className="mt-4 text-sm text-ink">{t("offlinePage.title")}</p>
        <p className="mt-2 text-xs text-mute">{t("offlinePage.body")}</p>
      </div>
    </div>
  );
}
