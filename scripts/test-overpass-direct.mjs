// Dev harness: build the same query app/api/pois generates and time it
// directly against Overpass. Usage: node scripts/test-overpass-direct.mjs
const WAYPOINTS = [
  [21.4254, 41.9981],
  [9.19, 45.4642],
  [8.5417, 47.3769],
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

// --- same query builder as app/api/pois/route.ts ---
const KIND_TAGS = {
  fuel: `["amenity"="fuel"]`,
  cafe: `["amenity"="cafe"]`,
  services: `["highway"="services"]`,
  rest_area: `["highway"="rest_area"]`,
};
const KIND_CAPS = { fuel: 1500, cafe: 600, services: 400, rest_area: 400 };
const CHUNK_POINTS = 4;
const radiusM = 6000;

function bboxOf(points, padKm) {
  let minLat = Infinity, minLon = Infinity, maxLat = -Infinity, maxLon = -Infinity;
  for (const [lat, lon] of points) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
  }
  const dLat = padKm / 111.32;
  const midLat = ((minLat + maxLat) / 2) * (Math.PI / 180);
  const dLon = padKm / (111.32 * Math.max(0.2, Math.cos(midLat)));
  const f = (n) => n.toFixed(3);
  return `(${f(minLat - dLat)},${f(minLon - dLon)},${f(maxLat + dLat)},${f(maxLon + dLon)})`;
}

const boxesByKind = new Map();
for (const c of corridors) {
  for (let i = 0; i < c.points.length; i += CHUNK_POINTS) {
    const chunk = c.points.slice(i === 0 ? 0 : i - 1, i + CHUNK_POINTS);
    const box = bboxOf(chunk, radiusM / 1000);
    for (const kind of c.kinds) {
      if (!boxesByKind.has(kind)) boxesByKind.set(kind, new Set());
      boxesByKind.get(kind).add(box);
    }
  }
}
const parts = [];
for (const [kind, boxes] of boxesByKind) {
  const union = [...boxes].map((box) => `nwr${KIND_TAGS[kind]}${box};`).join("");
  parts.push(`(${union})->.s_${kind};.s_${kind} out tags center ${KIND_CAPS[kind]};`);
}
const query = `[out:json][timeout:25];${parts.join("")}`;
console.log(`query length: ${query.length} chars, boxes:`, [...boxesByKind].map(([k, b]) => `${k}=${b.size}`).join(" "));

const t0 = Date.now();
const res = await fetch("https://overpass-api.de/api/interpreter", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "RideCost/0.1 (motorcycle trip planner demo)",
    Accept: "application/json",
  },
  body: `data=${encodeURIComponent(query)}`,
});
console.log(`status ${res.status} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
const text = await res.text();
try {
  const data = JSON.parse(text);
  if (data.remark) console.log("REMARK:", data.remark);
  const byKind = {};
  for (const el of data.elements ?? []) {
    const t = el.tags ?? {};
    const k = t.amenity === "fuel" ? "fuel" : t.amenity === "cafe" ? "cafe" : t.highway ?? "?";
    byKind[k] = (byKind[k] ?? 0) + 1;
  }
  console.log(`elements: ${(data.elements ?? []).length}`, byKind);
} catch {
  console.log(text.slice(0, 400));
}
