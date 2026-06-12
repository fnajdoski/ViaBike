/**
 * Natural Earth (world-atlas) country name → ISO2 + display metadata,
 * for the countries a European motorcycle trip can plausibly cross.
 * Both old and new Natural Earth name spellings are included where they differ.
 */
export type CountryMeta = {
  iso2: string;
  name: string;
  currency: string; // what fuel/tolls are priced in locally
  flag: string;
};

export const countriesByNeName: Record<string, CountryMeta> = {
  Albania: { iso2: "AL", name: "Albania", currency: "ALL", flag: "🇦🇱" },
  Austria: { iso2: "AT", name: "Austria", currency: "EUR", flag: "🇦🇹" },
  Belarus: { iso2: "BY", name: "Belarus", currency: "BYN", flag: "🇧🇾" },
  Belgium: { iso2: "BE", name: "Belgium", currency: "EUR", flag: "🇧🇪" },
  "Bosnia and Herz.": { iso2: "BA", name: "Bosnia and Herzegovina", currency: "BAM", flag: "🇧🇦" },
  Bulgaria: { iso2: "BG", name: "Bulgaria", currency: "BGN", flag: "🇧🇬" },
  Croatia: { iso2: "HR", name: "Croatia", currency: "EUR", flag: "🇭🇷" },
  Czechia: { iso2: "CZ", name: "Czechia", currency: "CZK", flag: "🇨🇿" },
  "Czech Rep.": { iso2: "CZ", name: "Czechia", currency: "CZK", flag: "🇨🇿" },
  Denmark: { iso2: "DK", name: "Denmark", currency: "DKK", flag: "🇩🇰" },
  Estonia: { iso2: "EE", name: "Estonia", currency: "EUR", flag: "🇪🇪" },
  Finland: { iso2: "FI", name: "Finland", currency: "EUR", flag: "🇫🇮" },
  France: { iso2: "FR", name: "France", currency: "EUR", flag: "🇫🇷" },
  Germany: { iso2: "DE", name: "Germany", currency: "EUR", flag: "🇩🇪" },
  Greece: { iso2: "GR", name: "Greece", currency: "EUR", flag: "🇬🇷" },
  Hungary: { iso2: "HU", name: "Hungary", currency: "HUF", flag: "🇭🇺" },
  Ireland: { iso2: "IE", name: "Ireland", currency: "EUR", flag: "🇮🇪" },
  Italy: { iso2: "IT", name: "Italy", currency: "EUR", flag: "🇮🇹" },
  Kosovo: { iso2: "XK", name: "Kosovo", currency: "EUR", flag: "🇽🇰" },
  Latvia: { iso2: "LV", name: "Latvia", currency: "EUR", flag: "🇱🇻" },
  Liechtenstein: { iso2: "LI", name: "Liechtenstein", currency: "CHF", flag: "🇱🇮" },
  Lithuania: { iso2: "LT", name: "Lithuania", currency: "EUR", flag: "🇱🇹" },
  Luxembourg: { iso2: "LU", name: "Luxembourg", currency: "EUR", flag: "🇱🇺" },
  Macedonia: { iso2: "MK", name: "North Macedonia", currency: "MKD", flag: "🇲🇰" },
  "North Macedonia": { iso2: "MK", name: "North Macedonia", currency: "MKD", flag: "🇲🇰" },
  Moldova: { iso2: "MD", name: "Moldova", currency: "MDL", flag: "🇲🇩" },
  Montenegro: { iso2: "ME", name: "Montenegro", currency: "EUR", flag: "🇲🇪" },
  Netherlands: { iso2: "NL", name: "Netherlands", currency: "EUR", flag: "🇳🇱" },
  Norway: { iso2: "NO", name: "Norway", currency: "NOK", flag: "🇳🇴" },
  Poland: { iso2: "PL", name: "Poland", currency: "PLN", flag: "🇵🇱" },
  Portugal: { iso2: "PT", name: "Portugal", currency: "EUR", flag: "🇵🇹" },
  Romania: { iso2: "RO", name: "Romania", currency: "RON", flag: "🇷🇴" },
  Serbia: { iso2: "RS", name: "Serbia", currency: "RSD", flag: "🇷🇸" },
  Slovakia: { iso2: "SK", name: "Slovakia", currency: "EUR", flag: "🇸🇰" },
  Slovenia: { iso2: "SI", name: "Slovenia", currency: "EUR", flag: "🇸🇮" },
  Spain: { iso2: "ES", name: "Spain", currency: "EUR", flag: "🇪🇸" },
  Sweden: { iso2: "SE", name: "Sweden", currency: "SEK", flag: "🇸🇪" },
  Switzerland: { iso2: "CH", name: "Switzerland", currency: "CHF", flag: "🇨🇭" },
  Turkey: { iso2: "TR", name: "Türkiye", currency: "TRY", flag: "🇹🇷" },
  Ukraine: { iso2: "UA", name: "Ukraine", currency: "UAH", flag: "🇺🇦" },
  "United Kingdom": { iso2: "GB", name: "United Kingdom", currency: "GBP", flag: "🇬🇧" },
};

const byIso2: Record<string, CountryMeta> = {};
for (const meta of Object.values(countriesByNeName)) byIso2[meta.iso2] = meta;

export function countryMeta(iso2: string): CountryMeta | undefined {
  return byIso2[iso2];
}

export function countryLabel(iso2: string): string {
  const m = byIso2[iso2];
  return m ? `${m.flag} ${m.name}` : iso2 === "??" ? "Unidentified" : iso2;
}
