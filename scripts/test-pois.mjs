// Dev harness: replicates lib/planTrip.ts corridor building against the local
// /api/pois endpoint for the acceptance route, without driving the UI.
// Usage: node scripts/test-pois.mjs
const WAYPOINTS = [
  [21.4254, 41.9981], // Skopje
  [9.19, 45.4642], // Milano
  [8.5417, 47.3769], // Zurich
];

const R = 6371.0088;
const rad = (d) => (d * Math.PI) / 180;
const hav = (a, b) => {
  const s =
    Math.sin(rad(b[1] - a[1]) / 2) ** 2 +
    Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(rad(b[0] - a[0]) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

const coordStr = WAYPOINTS.map(([lon, lat]) => `${lon},${lat}`).join(";");
const osrm = await fetch(
  `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`,
  { headers: { "User-Agent": "RideCost/0.1 (dev test)" } },
).then((r) => r.json());
const coords = osrm.routes[0].geometry.coordinates;
const cum = [0];
for (let i = 1; i < coords.length; i++) cum[i] = cum[i - 1] + hav(coords[i - 1], coords[i]);
const totalKm = cum[cum.length - 1];
console.log(`route: ${Math.round(totalKm)} km, ${coords.length} vertices`);

function pointAtKm(km) {
  if (km <= 0) return coords[0];
  if (km >= totalKm) return coords[coords.length - 1];
  let lo = 0, hi = cum.length - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= km) lo = mid;
    else hi = mid;
  }
  const t = (km - cum[lo]) / (cum[hi] - cum[lo] || 1);
  return [coords[lo][0] + (coords[hi][0] - coords[lo][0]) * t, coords[lo][1] + (coords[hi][1] - coords[lo][1]) * t];
}
const corridor = (from, to, step) => {
  const pts = [];
  for (let km = Math.max(0, from); km <= Math.min(totalKm, to); km += step) {
    const p = pointAtKm(km);
    pts.push([p[1], p[0]]);
  }
  return pts;
};

// fuel targets: range 446, refuel at 0.85
const rangeKm = 446;
const fuelTargets = [];
let last = 0;
while (totalKm - last > rangeKm) {
  last += rangeKm * 0.85;
  fuelTargets.push(last);
}
const restTargets = [];
for (let km = 150; km < totalKm - 30; km += 150) restTargets.push(km);

const corridors = [
  ...fuelTargets.map((t) => ({ points: corridor(t - 90, t + 50, 10), kinds: ["fuel"] })),
  ...restTargets.map((t) => ({ points: corridor(t - 20, t + 20, 8), kinds: ["fuel", "cafe", "services", "rest_area"] })),
];

console.log(`corridors: ${corridors.length}, fuel targets at`, fuelTargets.map(Math.round));
const t0 = Date.now();
const res = await fetch("http://localhost:3000/api/pois", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ corridors, radiusM: 6000 }),
});
const data = await res.json();
console.log(`status ${res.status} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
if (data.error) console.log("ERROR:", data.error);
else {
  const byKind = {};
  for (const p of data.pois) byKind[p.kind] = (byKind[p.kind] ?? 0) + 1;
  console.log(`pois: ${data.pois.length}`, byKind, data.cached ? "(cached)" : "");
}
