/**
 * Fallback per-km toll rates — used ONLY when no TollGuru key is configured.
 *
 * These are ROUGH estimates: average motorcycle-class motorway toll per km,
 * multiplied by an assumed motorway share of the route through that country.
 * Real tolls depend on the exact plazas crossed — always labeled
 * "rough estimate" in the UI.
 *
 * Rates compiled from operator price lists (autostrade.it, hac.hr,
 * putevi-srbije.rs, ASFiNAG…), motorcycle class where one exists.
 */
export const TOLL_RATES_AS_OF = "2026-06 (rough estimate — verify)";

/** Share of a country's route distance assumed to be tolled motorway. */
export const ASSUMED_MOTORWAY_SHARE = 0.8;

export type TollRate = {
  eurPerKm: number;
  note: string;
};

/**
 * Countries absent from this table are treated as toll-free per-km
 * (they may still need a vignette — see data/vignettes.ts).
 */
export const tollRatesEurPerKm: Record<string, TollRate> = {
  IT: { eurPerKm: 0.055, note: "Autostrade class A; motorcycles pay the car rate (Telepass moto discounts exist)." },
  FR: { eurPerKm: 0.06, note: "Class 5 (motorcycle) — roughly 40% cheaper than cars." },
  ES: { eurPerKm: 0.055, note: "Light-vehicle rate on AP motorways; many stretches are now free." },
  PT: { eurPerKm: 0.06, note: "Class 1; electronic-only sections need a toll device or post-pay." },
  GR: { eurPerKm: 0.03, note: "Motorcycle category ~50–60% of the car rate." },
  HR: { eurPerKm: 0.032, note: "Group IA (motorcycles) ≈ 60% of the car rate (hac.hr)." },
  RS: { eurPerKm: 0.025, note: "Class IA (motorcycles) ≈ half the car rate (putevi-srbije.rs)." },
  MK: { eurPerKm: 0.015, note: "Toll plazas on A1/A2/A4; motorcycles pay the lowest class." },
  PL: { eurPerKm: 0.02, note: "Only some A1/A2/A4 sections are tolled." },
  BA: { eurPerKm: 0.02, note: "A1 sections tolled." },
  ME: { eurPerKm: 0.015, note: "Bar–Boljare motorway sections + Sozina tunnel." },
  TR: { eurPerKm: 0.02, note: "HGS electronic toll; motorcycles class 1." },
};
