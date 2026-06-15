/**
 * English message catalog — the source of truth. Other locales are typed
 * against `keyof typeof en`, so a missing translation is a compile error.
 * Values may contain {placeholders} filled by the t() formatter.
 */
export const en = {
  "app.subtitle": "Motorcycle trip cost & rest-stop planner",
  "intro.tagline": "Plan the ride. Know the cost.",

  "lang.label": "Language",
  "lang.en": "English",
  "lang.mk": "Македонски",

  "unit.l": "L",
  "unit.lper100": "L/100km",
  "unit.km": "km",

  "picker.step1": "Step 1",
  "picker.title": "PICK YOUR BIKE",
  "picker.intro":
    "Range and costs are computed from your specific bike — tank size and a real-world consumption figure, not the brochure number.",
  "picker.search": "Search brand or model…",
  "picker.rangeSuffix": "km range",
  "picker.noMatch": "No match — adding a bike is a one-line edit in data/bikes.ts.",

  "hero.solo": "Solo",
  "hero.loaded": "Loaded — luggage + passenger (+10%)",
  "hero.changeBike": "Change bike",
  "hero.figures": "Figures: {note}",

  "stat.tank": "Tank",
  "stat.consumption": "Consumption",
  "stat.range": "Range",
  "stat.distance": "Distance",
  "stat.estTime": "Est. time",
  "stat.estCost": "Est. cost",
  "stat.tankSub": "{liters} L usable (90%)",
  "stat.consLoaded": "loaded +10%",
  "stat.consSolo": "solo",
  "stat.rangeSub": "on usable tank",
  "stat.timeSub": "riding time, no stops",
  "stat.costSub": "estimate — see breakdown",

  "planner.route": "Route",
  "planner.loadDemo": "Load demo: Skopje → Milano → Zürich",
  "planner.start": "Start — type a place…",
  "planner.destination": "Destination",
  "planner.via": "Via",
  "planner.searchPlace": "Search place",
  "planner.noMatches": "No matches",
  "loc.use": "Use my location",
  "loc.locating": "Locating…",
  "loc.myLocation": "My location",
  "loc.denied": "Location access denied — type a place instead",
  "loc.error": "Couldn't get your location — type a place instead",
  "planner.addWaypoint": "+ Add waypoint",
  "planner.restStops": "Rest stops",
  "planner.byDistance": "By distance",
  "planner.byTime": "By time",
  "planner.noStops": "No stops",
  "planner.custom": "custom",
  "planner.restNote":
    "Stops are only recommended within ≤ 2 km of the route — no far deroutings. Fuel stops are planned separately from your range (refuel at 85%).",
  "planner.noStopsNote":
    "Rest stops are off — you'll still get fuel stops based on your range (those keep you from running dry).",
  "planner.planTrip": "Plan trip",
  "planner.planning": "Planning…",
  "planner.offlineDisabled": "Planning a new route needs a connection — you're offline.",
  "planner.lastSaved": "Last plan saved {date}",
  "planner.lastSavedSub": "re-plan for current prices",
  "planner.replan": "Re-plan",
  "planner.openInMaps": "Open in Google Maps",
  "export.gpx": "Download GPX",
  "export.includeFuel": "Include fuel stops",
  "export.includeRest": "Include rest stops",
  "export.capped":
    "Google Maps fits ~{max} stops per link — included your route + {fuelInc}/{fuelTot} fuel and {restInc}/{restTot} rest stops. Download the GPX for every stop.",
  "planner.savedTrips": "Saved trips",
  "planner.tripName": "Trip name…",
  "planner.save": "Save",

  "planStep.starting": "Starting…",
  "planStep.routing": "Routing…",
  "planStep.findingStops": "Finding fuel stations & rest stops along the route…",
  "planStep.costs": "Calculating costs…",

  "error.noBike": "Pick a bike first.",
  "error.needTwoPoints": "Set at least a start and a destination (search or click the map).",

  "map.hint": "Click the map to drop waypoints · drag markers to adjust",

  "stops.fuelTitle": "Fuel stops",
  "stops.fuelSub": "(refuel at 85% of range)",
  "stops.restTitle": "Rest stops",
  "stops.restEvery": "(every ~{km} km)",
  "stops.fuelNone": "None needed — the whole trip fits in one tank. 🎉",
  "stops.restNone": "Trip is shorter than one rest interval.",
  "stops.restOff": "Rest stops are off for this trip — fuel stops below are based on your range.",
  "stops.recommendOnly": "Recommendations only — v1 never reorders your route around stops.",
  "stops.km": "km {km}",
  "stops.noPoi": "No POI found here",
  "stops.fuelUnnamed": "Fuel station (unnamed)",
  "stops.restUnnamed": "Rest stop (unnamed)",
  "stops.detour": "detour {km} km",
  "stops.targetWas": "target was km {km}",
  "stops.doublesFuel": "doubles as the fuel stop",

  "stopNote.fuelFallbackEarly":
    "No station near the ideal point — stopping earlier (better early than stranded).",
  "stopNote.fuelNone": "No station found within the detour limit — plan this refuel manually.",
  "stopNote.restCombined": "Combined with the fuel stop here.",
  "stopNote.restNone": "No rest POI found within the detour limit around this point.",

  "cost.title": "TRIP COST",
  "cost.estimate": "estimate",
  "cost.fuelHeading": "Fuel — priced per country",
  "cost.fuelTotal": "Fuel total",
  "cost.pricesLine": "Prices {date} · source: {source}.",
  "cost.crosscheckAgree": "TollGuru cross-check: {amount} — agrees within 25%.",
  "cost.crosscheckOff": "TollGuru cross-check: {amount} — large discrepancy, double-check consumption/prices.",
  "cost.tollsHeading": "Tolls — motorcycle class",
  "cost.tollsNone": "No tolled roads on this route.",
  "cost.tollsTotal": "Tolls total",
  "cost.tollsTollguru": "Exact plazas from TollGuru, motorcycle class.",
  "cost.tollsEstimate": "Estimated on tollway distance only ({date}) — add a TollGuru key for exact plazas.",
  "cost.vignettesHeading": "Vignettes & passes — one-off, not per trip",
  "cost.vignettesNone": "No vignette countries on this route.",
  "cost.vignetteFree": "free",
  "cost.extrasHeading": "Extras (ferries, parking, food…)",
  "cost.extraExample": "e.g. Ferry",
  "cost.add": "Add",
  "cost.disclaimer":
    "⚠️ Everything here is an estimate — verify before relying on it. Currency normalized to EUR (rates {date}); non-EUR amounts show the original where known. Vignettes are fixed-period passes, listed once — not a per-trip cost.",
  "cost.fuelDataLabel": "Fuel price data:",

  "warn.demoRouting":
    "Routing used the public OSRM demo server (no ORS key) — fine for planning, but rate-limited.",
  "warn.stopLookupFailed": "Stop lookup failed — fuel/rest markers show ideal points only.",
  "warn.fuelPriceFallback": "Fuel price lookup failed — using the built-in fallback table.",
  "warn.tollEstimate": "Tolls are a rough estimate (no TollGuru key) — verify before relying on them.",

  "offline.banner":
    "You're offline — showing saved data. Fuel & toll prices last updated {date}. Planning a new route needs a connection.",

  "install.title": "Install RideCost",
  "install.subtitle": "Add it to your device for full-screen, one-tap access.",
  "install.ios": "Add RideCost to your Home Screen — tap the Share icon, then “Add to Home Screen”.",
  "install.button": "Install",
  "install.dismiss": "Dismiss",

  "offlinePage.title": "You're offline.",
  "offlinePage.body":
    "RideCost needs a connection for live routing, fuel prices and stop lookups — reconnect and reload to plan a trip. Your saved trips and last session are still on this device.",
} as const;

export type MessageKey = keyof typeof en;
