# RideCost — Motorcycle Trip Cost & Rest-Stop Planner

A web app that knows your **specific bike**: total trip cost (fuel priced **per country**, motorcycle-class tolls, vignettes) plus **fuel stops from your real range** and **rest stops on your cadence** — things Google Maps and ViaMichelin can't do.

Built with Next.js (App Router) + TypeScript, Tailwind CSS, MapLibre GL, Zustand.

## Quick start

```bash
npm install
npm run dev        # → http://localhost:3000
npm test           # unit tests for range / stop / cost logic
```

**The app works with zero API keys** — it degrades gracefully:

| Service | With key | Without key (default) |
|---|---|---|
| Routing | OpenRouteService (`ORS_API_KEY`) | Public OSRM demo server, labeled "demo routing" |
| Tolls | TollGuru motorcycle class (`TOLLGURU_API_KEY`) | Built-in per-km rate table, labeled "rough estimate" |
| Map tiles | MapTiler vector (`NEXT_PUBLIC_MAPTILER_KEY`) | Free CARTO dark raster tiles |
| Fuel prices | — | `data/fuelPrices.json`, auto-refreshed biweekly from OpenVan.camp (CC BY 4.0) |
| Fuel/rest POIs | — | OpenStreetMap Overpass API (no key needed) |

Adding the **TollGuru key upgrades tolls from a per-km estimate to live, per-plaza
motorcycle-class tolls** — no schedule needed, it's computed fresh per trip. Adding the
**ORS key** noticeably speeds up cold route calculation (the OSRM demo server is shared
and rate-limited); on Vercel, set both as project Environment Variables.

To add keys: `cp .env.example .env.local`, fill in what you have, restart.

- ORS key (free): https://openrouteservice.org/dev/#/signup — 50 waypoints max per route.
- TollGuru key (free trial): https://tollguru.com/developers — note: the TollGuru proxy
  (`app/api/tolls/route.ts`) was written against their docs but **untested without a key**;
  treat it as experimental and verify the response mapping.

**Hard rule on keys:** they live in `.env.local` and are only used inside Route Handlers
(`app/api/*`). The browser only ever calls our own API routes.

## Try the acceptance scenario

1. Pick **BMW R 1300 GS Adventure** → toggle **Loaded — luggage + passenger (+10%)**.
2. Click **Load demo: Skopje → Milano → Zürich**, rest cadence **150 km**.
3. **Plan trip** (10–40 s on the free services — Overpass is the slow one).

Expected: route through Milano; fuel stops ≈ every 380 km at real stations; rest stops
≈ every 150 km with ≤ 2 km detours; per-country fuel costs (MK / RS / HR / SI / IT / CH);
Switzerland's vignette as a **one-off** line item; total in EUR with freshness notes.

### A note on the "400–450 km between refuels" expectation

The original brief expects refuels every 400–450 km from a "~500 km range". With honest
math that doesn't hold: 30 L tank × 90% usable = 27 L; at 5.5 L/100km real-world
consumption × 1.10 load factor = 6.05 L/100km → **446 km range**, and refueling at 85%
gives **≈ 379 km spacing**. The brief's 500 km figure implicitly used 100% of the tank at
the optimistic WMTC consumption — exactly the kind of planning this app exists to avoid.
Solo (no load factor) the spacing is ≈ 417 km, inside the expected band.

## How it works

```
app/api/route   → ORS (or OSRM demo) + country segmentation (point-in-polygon
                  against Natural Earth 1:50m borders, sampled every 8 km)
app/api/pois    → Overpass: per-corridor bounding boxes, exact tag matches,
                  per-kind result caps, 10-min cache, single-flight + serialized
                  upstream requests (Overpass allows ~2 slots/IP)
app/api/tolls   → TollGuru proxy (motorcycle class) or { available: false }
app/api/fuel-prices → built-in table (live source can be wired in here)
app/api/geocode → Nominatim search proxy (proper User-Agent)

lib/geo.ts      → haversine, cumulative distance, point-at-km, polyline encoder
lib/stops.ts    → fuel targets at 85% of range w/ fall-back-to-earlier-station,
                  rest cadence (km or hours), fuel/rest stop merging
lib/cost.ts     → per-country fuel, toll estimates, vignette one-offs, totals
lib/countries.ts→ point-in-polygon country lookup (server-side only)
data/*.ts       → bikes, fuel prices, vignettes, toll rates, currency rates —
                  every figure carries a source note and an "as of" date
```

All range/cost/stop logic is pure functions under `lib/` with unit tests (`npm test`).

## Data honesty

Every number shown is an **estimate** and labeled as such in the UI. Bike consumption
figures are real-world owner-report averages (sources in `data/bikes.ts` — two figures
were corrected vs. the brief: the KTM 1390 SDR tank is 17.8 L not 16 L, and the 24.8 L
Africa Twin tank is the Adventure Sports variant). Vignette prices and motorcycle
exemptions (CZ/SK/RO/BG exempt; CH/AT/SI/HU required) are dated 2026-06 in
`data/vignettes.ts` — verify before travel.

## Adding a bike

One edit in [data/bikes.ts](data/bikes.ts): append an object with tank, real-world
consumption, a `sourceNote`, and a wordmark split for the hero. Bike images are
royalty-free placeholder silhouettes in `public/bikes/` — swap `imageUrl` for your
own assets (do not hotlink manufacturer press images).

## Scheduled data updates

- **Fuel prices (biweekly, automated):** `.github/workflows/update-fuel-prices.yml` runs
  `scripts/update-fuel-prices.ts` on the 1st and 15th, normalizes per-country prices to
  EUR/L, and commits `data/fuelPrices.json` only when something changed (Vercel
  auto-deploys the commit once the repo is on GitHub with the Vercel git integration).
  A failed fetch never touches the last-good file, and a builtin fallback table
  guarantees a missing country never breaks a route.
  **Fuel price data: [OpenVan.camp](https://openvan.camp/en/developers), licensed
  CC BY 4.0** — weekly from the EU Oil Bulletin + official government sources.
- **Vignettes (6-month manual review):** `.github/workflows/vignette-review.yml` opens a
  reminder issue each January/July to verify `data/vignettes.json` against the official
  portals — there's no reliable free structured feed for vignette prices.
- **Tolls:** no schedule needed — set `TOLLGURU_API_KEY` and tolls are computed live
  per trip (motorcycle class) instead of the per-km estimate.

## Installable app (PWA)

RideCost is an installable PWA via [Serwist](https://serwist.pages.dev/) in
*configurator mode* — the service worker is built by `@serwist/cli` after
`next build` (`npm run build` runs both), so the app keeps building on
Turbopack with no webpack config. The SW is disabled in development.

- **Caching is data-safe:** all `/api/*` calls are `NetworkOnly` (fresh fuel
  prices/routes/POIs, never stale); CARTO map tiles use StaleWhileRevalidate
  with a capped cache; the app shell is precached; `/~offline` is the
  navigation fallback.
- **Install banner** ([components/InstallBanner.tsx](components/InstallBanner.tsx)):
  Android/Chromium gets an Install button (`beforeinstallprompt`); iOS Safari
  gets Add-to-Home-Screen instructions; hidden once installed or for 14 days
  after a dismiss (per-device).
- **Last session** is restored on load ([lib/session.ts](lib/session.ts)) —
  bike, waypoints and settings, never an auto-plan; a compact last-result
  summary shows "saved {date} — re-plan for current prices".
- **Icons:** the set (192 / 512 / 512-maskable / 180 apple-touch) is generated
  from one source mark by [scripts/generate-icons.mjs](scripts/generate-icons.mjs)
  with `sharp`. To use your own brand icon, edit the SVG in that script (or drop
  replacement PNGs at the same `public/` paths) and run `node scripts/generate-icons.mjs`.

## Exporting a planned trip

After planning, two exports are built **client-side from the in-memory plan** (no
extra API calls):

- **Open in Google Maps** — a directions URL including your stops, in priority
  order (explicit waypoints always, then fuel, then an evenly-spaced subset of
  rest stops) within Google's ~9-waypoint / 2,048-char free-link limits. Toggles
  let you include/exclude fuel and rest; a note shows what was capped. On phones
  it deep-links into the Google Maps app (`travelmode=driving`).
- **Download GPX** — a GPX 1.1 file with the full route track **and a waypoint for
  every stop** (no limit), named after the trip. Imports into **BMW Connected,
  Calimoto, OsmAnd, and Garmin** (and most other nav apps that accept GPX).

## Roadmap (post-v1)

- Live FX rates behind the same pattern as fuel prices.
- Auth + server-side saved trips (Supabase/Clerk) — state is already centralized in
  one Zustand store, and trips serialize to plain JSON (`localStorage` today).
- Drag-to-reorder waypoints on the map (list reorder buttons exist today).
