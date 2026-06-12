export function fmtKm(km: number): string {
  return `${Math.round(km).toLocaleString("en-US")} km`;
}

export function fmtEur(eur: number): string {
  return `€${eur.toFixed(eur >= 100 ? 0 : 2)}`;
}

export function fmtLiters(l: number): string {
  return `${l.toFixed(1)} L`;
}

export function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`;
}
