import type { Metadata } from "next";

export const metadata: Metadata = { title: "Offline — RideCost" };

// Navigation fallback served by the service worker when the network is down.
// RideCost needs live routing/prices, so there's nothing to plan offline —
// this just explains that, themed to match the app.
export default function Offline() {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div className="panel max-w-sm p-8">
        <p className="wordmark-solid text-2xl tracking-[0.2em]">
          RIDE<span className="text-accent">COST</span>
        </p>
        <p className="mt-4 text-sm text-ink">You&rsquo;re offline.</p>
        <p className="mt-2 text-xs text-mute">
          RideCost needs a connection for live routing, fuel prices and stop lookups — reconnect
          and reload to plan a trip. Your saved trips and last session are still on this device.
        </p>
      </div>
    </div>
  );
}
