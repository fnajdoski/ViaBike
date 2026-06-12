"use client";

import Image from "next/image";
import { getBike } from "@/data/bikes";
import { useRideCost } from "@/state/store";

export default function BikeHero() {
  const bikeId = useRideCost((s) => s.bikeId);
  const loaded = useRideCost((s) => s.loaded);
  const setLoaded = useRideCost((s) => s.setLoaded);
  const clearBike = useRideCost((s) => s.clearBike);
  const bike = bikeId ? getBike(bikeId) : undefined;
  if (!bike) return null;

  // Photo priority: any real photo beats the silhouette — a bike with only a
  // loaded photo shows it in both states until a solo shot is added.
  const heroImage = loaded
    ? (bike.imageUrlLoaded ?? bike.imageUrlSolo ?? bike.imageUrl)
    : (bike.imageUrlSolo ?? bike.imageUrlLoaded ?? bike.imageUrl);
  const isSilhouette = heroImage === bike.imageUrl;

  return (
    <section className="hero-grid relative overflow-hidden px-6 pb-4 pt-10 text-center">
      <div className="mx-auto max-w-3xl">
        <p className="text-mute text-xs uppercase tracking-[0.4em]">{bike.brand}</p>
        <h1 className="wordmark-solid mt-2 text-5xl sm:text-6xl">{bike.wordmark.solid}</h1>
        {bike.wordmark.outline && (
          <p className="wordmark-outline text-4xl sm:text-5xl">{bike.wordmark.outline}</p>
        )}

        <div className="relative mx-auto -mt-2 h-52 max-w-xl sm:h-64">
          <Image
            src={heroImage}
            alt={`${bike.brand} ${bike.model}`}
            fill
            priority
            className={`object-contain ${isSilhouette ? "bike-silhouette" : ""}`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pb-2">
          <div className="panel inline-flex overflow-hidden rounded-full p-0.5 text-xs">
            <button
              onClick={() => setLoaded(false)}
              className={`cursor-pointer rounded-full px-4 py-1.5 transition ${!loaded ? "bg-accent font-semibold text-night" : "text-mute hover:text-ink"}`}
            >
              Solo
            </button>
            <button
              onClick={() => setLoaded(true)}
              className={`cursor-pointer rounded-full px-4 py-1.5 transition ${loaded ? "bg-accent font-semibold text-night" : "text-mute hover:text-ink"}`}
            >
              Loaded — luggage + passenger (+10%)
            </button>
          </div>
          <button
            onClick={clearBike}
            className="panel cursor-pointer rounded-full px-4 py-2 text-xs text-mute transition hover:text-ink"
          >
            ⇄ Change bike
          </button>
        </div>
        <p className="text-mute mx-auto mt-2 max-w-md text-[10px] leading-snug" title={bike.sourceNote}>
          Figures: {bike.sourceNote}
        </p>
      </div>
    </section>
  );
}
