"use client";

import { useT } from "@/state/locale";

/** A glowing planned-route line that the animated intro draws; here it's static. */
export const INTRO_ROUTE_D = "M40,120 C150,44 250,168 360,98 S540,72 582,116";

/**
 * Motion-free intro overlay — themed (bg matches the app/manifest background so
 * there's no splash flash). Used for the SSR/first paint, the reduced-motion
 * "static beat", and as the lazy-load fallback while Motion's chunk loads.
 */
export default function StaticIntro() {
  const t = useT();
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-night">
      <div className="hero-grid pointer-events-none absolute inset-0" />
      <div className="relative px-6 text-center">
        <svg
          viewBox="0 0 620 170"
          className="mx-auto mb-2 w-[min(80vw,420px)]"
          fill="none"
          aria-hidden
          style={{ filter: "drop-shadow(0 0 7px var(--color-accent))" }}
        >
          <path d={INTRO_ROUTE_D} stroke="var(--color-accent)" strokeWidth={5} strokeLinecap="round" />
        </svg>
        <h1 className="wordmark-solid text-5xl tracking-[0.12em] sm:text-7xl">
          VIA<span className="text-accent">BIKE</span>
        </h1>
        <p className="text-mute mt-4 text-[11px] uppercase tracking-[0.35em]">{t("intro.tagline")}</p>
      </div>
    </div>
  );
}
