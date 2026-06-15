/** Shared geocoder helpers (pure, testable). */

export type GeoProps = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === "string" && v.trim() ? v.trim() : "");

/**
 * Best readable place name from a geocoder feature's properties, for reverse
 * geocoding. Pelias/ORS provide a ready `label`; Photon/others give parts we
 * assemble ("Name, Region, Country"). Returns null when nothing usable is
 * present, so the caller can fall back to a generic "My location" label.
 */
export function reverseLabel(props: GeoProps | null | undefined): string | null {
  if (!props) return null;
  const label = str(props.label);
  if (label) return label;

  const name = str(props.name);
  const locality =
    str(props.city) || str(props.locality) || str(props.town) || str(props.village) || str(props.county);
  const region = str(props.state) || str(props.region);
  const country = str(props.country);

  const primary = name || locality;
  const parts = [primary, region && region !== primary ? region : "", country].filter(Boolean);
  const out = parts.join(", ");
  return out || null;
}
