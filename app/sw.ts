/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import {
  CacheableResponsePlugin,
  ExpirationPlugin,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // injected by @serwist/next at build time
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

// module-scoped, so it shadows the DOM lib's `self` without a redeclare clash
declare const self: ServiceWorkerGlobalScope;

const runtimeCaching: RuntimeCaching[] = [
  // App data must never be stale: every same-origin /api/* call hits the
  // network. (Routing/POI/tolls are POST and uncacheable anyway; this also
  // covers the GET fuel-prices + geocode endpoints — biweekly price refresh
  // would be pointless if a cached price were ever served.)
  {
    matcher: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/api/"),
    handler: new NetworkOnly(),
  },
  // CARTO map tiles: serve fast from cache, refresh in the background, and cap
  // storage so the tile cache can't balloon.
  {
    matcher: ({ url }) => url.hostname.endsWith("basemaps.cartocdn.com"),
    handler: new StaleWhileRevalidate({
      cacheName: "carto-tiles",
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 256, maxAgeSeconds: 7 * 24 * 60 * 60 }),
      ],
    }),
  },
  // Everything else (app shell, JS/CSS, fonts, icons, RSC) — Next defaults.
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
