import { USABLE_FRACTION } from "./constants";
import type { Bike } from "./types";

/** Liters you can actually plan on — never the dregs. */
export function usableTankLiters(bike: Pick<Bike, "tankLiters">): number {
  return bike.tankLiters * USABLE_FRACTION;
}

/** Consumption adjusted for load (solo = 1.0, loaded = 1.1). */
export function effectiveConsumption(
  bike: Pick<Bike, "consumptionLper100">,
  loadFactor: number,
): number {
  return bike.consumptionLper100 * loadFactor;
}

/** Effective range in km on a usable tank at the given load. */
export function rangeKm(
  bike: Pick<Bike, "tankLiters" | "consumptionLper100">,
  loadFactor: number,
): number {
  return (usableTankLiters(bike) / effectiveConsumption(bike, loadFactor)) * 100;
}
