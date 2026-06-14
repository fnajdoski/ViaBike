"use client";

import { useEffect, useMemo } from "react";
import BikeHero from "@/components/BikeHero";
import BikePicker from "@/components/BikePicker";
import CostPanel from "@/components/CostPanel";
import MapView from "@/components/MapView";
import PlannerPanel from "@/components/PlannerPanel";
import StatTiles from "@/components/StatTiles";
import StopsList from "@/components/StopsList";
import ThemeToggle from "@/components/ThemeToggle";
import { getBike } from "@/data/bikes";
import { effectiveConsumption } from "@/lib/bike";
import { LOAD_FACTOR_LOADED, LOAD_FACTOR_SOLO } from "@/lib/constants";
import { buildCostBreakdown } from "@/lib/cost";
import { buildGoogleMapsUrl } from "@/lib/googleMaps";
import { saveResult } from "@/lib/session";
import { useT } from "@/state/locale";
import { useRideCost } from "@/state/store";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import OfflineBanner from "@/components/OfflineBanner";

export default function Home() {
  const bikeId = useRideCost((s) => s.bikeId);
  const loaded = useRideCost((s) => s.loaded);
  const route = useRideCost((s) => s.route);
  const prices = useRideCost((s) => s.prices);
  const tollguru = useRideCost((s) => s.tollguru);
  const extras = useRideCost((s) => s.extras);
  const status = useRideCost((s) => s.status);
  const waypoints = useRideCost((s) => s.waypoints);
  const t = useT();

  const bike = bikeId ? getBike(bikeId) : undefined;

  const gmapsUrl = useMemo(
    () => buildGoogleMapsUrl(waypoints.filter((w) => w.lonLat).map((w) => w.lonLat!)),
    [waypoints],
  );

  const breakdown = useMemo(() => {
    if (!bike || !route) return null;
    return buildCostBreakdown({
      segments: route.countrySegments,
      tollSegments: route.tollwaySegments,
      effectiveLper100: effectiveConsumption(bike, loaded ? LOAD_FACTOR_LOADED : LOAD_FACTOR_SOLO),
      prices: prices?.prices,
      tollsOverride:
        tollguru?.available && tollguru.tolls
          ? {
              source: "tollguru",
              tolls: tollguru.tolls.map((t) => ({
                iso2: t.country || "—",
                km: 0,
                costEur: t.costEur,
                note: `${t.name} ${t.road}`.trim(),
              })),
            }
          : null,
      extras,
    });
  }, [bike, route, loaded, prices, tollguru, extras]);

  // Cache a compact, geometry-free summary of the last computed plan so a
  // returning user sees "last plan saved …" instead of a blank slate.
  useEffect(() => {
    if (status === "done" && breakdown && route) {
      saveResult({
        savedAt: new Date().toISOString(),
        totalEur: breakdown.totalEur,
        distanceKm: route.distanceKm,
        bikeId,
      });
    }
  }, [status, breakdown, route, bikeId]);

  return (
    <div className="min-h-screen pb-16">
      <header className="flex items-center justify-between px-6 py-4">
        <p className="wordmark-solid text-lg tracking-[0.2em]">
          RIDE<span className="text-accent">COST</span>
        </p>
        <span className="flex items-center gap-2 sm:gap-3">
          <p className="hidden text-[10px] uppercase tracking-[0.25em] text-mute lg:block">
            {t("app.subtitle")}
          </p>
          <LanguageSwitcher />
          <ThemeToggle />
        </span>
      </header>

      <OfflineBanner />

      {!bike ? (
        <BikePicker />
      ) : (
        <main className="flex flex-col gap-6">
          <BikeHero />
          <StatTiles breakdown={breakdown} />
          <div className="mx-auto grid w-full max-w-7xl gap-4 px-6 lg:grid-cols-[380px_1fr]">
            <PlannerPanel />
            <MapView />
          </div>
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6">
            {status === "done" && gmapsUrl && (
              <a
                href={gmapsUrl}
                target="_blank"
                rel="noreferrer"
                className="panel inline-flex w-fit items-center gap-2 self-start px-4 py-2 text-sm font-semibold text-accent transition hover:border-accent/60"
              >
                🧭 {t("planner.openInMaps")} ↗
              </a>
            )}
            <StopsList />
            <CostPanel breakdown={breakdown} />
          </div>
        </main>
      )}
    </div>
  );
}
