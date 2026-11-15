/**
 * Places: small built-in gazetteer used by the API (to place suppliers on the map) and by the web app
 * (plain-language labels). No network, no keys. Approximate coordinates (city centres / country centroids).
 *
 * Position precision is always reported: CITY (found in the gazetteer) or COUNTRY (country centroid).
 * The UI must say "approximate location" for COUNTRY precision.
 */
export type Precision = "CITY" | "COUNTRY";
export interface LatLng {
  lat: number;
  lng: number;
}

export const COUNTRIES: Record<string, { name: string } & LatLng> = {
  FI: { name: "Finland", lat: 64.0, lng: 26.0 }, SE: { name: "Sweden", lat: 62.0, lng: 15.0 }, NO: { name: "Norway", lat: 62.0, lng: 9.0 },
  DK: { name: "Denmark", lat: 56.0, lng: 10.0 }, EE: { name: "Estonia", lat: 58.7, lng: 25.5 }, LV: { name: "Latvia", lat: 56.9, lng: 24.6 },
  LT: { name: "Lithuania", lat: 55.3, lng: 23.9 }, PL: { name: "Poland", lat: 52.0, lng: 19.4 }, DE: { name: "Germany", lat: 51.2, lng: 10.4 },
  NL: { name: "Netherlands", lat: 52.2, lng: 5.3 }, BE: { name: "Belgium", lat: 50.6, lng: 4.7 }, FR: { name: "France", lat: 46.6, lng: 2.4 },
  GB: { name: "United Kingdom", lat: 54.0, lng: -2.5 }, IE: { name: "Ireland", lat: 53.2, lng: -8.0 }, ES: { name: "Spain", lat: 40.2, lng: -3.7 },
  PT: { name: "Portugal", lat: 39.6, lng: -8.0 }, IT: { name: "Italy", lat: 42.8, lng: 12.5 }, AT: { name: "Austria", lat: 47.6, lng: 14.1 },
  CH: { name: "Switzerland", lat: 46.8, lng: 8.2 }, CZ: { name: "Czechia", lat: 49.8, lng: 15.5 }, SK: { name: "Slovakia", lat: 48.7, lng: 19.7 },
  HU: { name: "Hungary", lat: 47.2, lng: 19.5 }, RO: { name: "Romania", lat: 45.9, lng: 25.0 }, BG: { name: "Bulgaria", lat: 42.7, lng: 25.5 },
  GR: { name: "Greece", lat: 39.1, lng: 22.9 }, TR: { name: "Turkey", lat: 39.0, lng: 35.2 }, UA: { name: "Ukraine", lat: 49.0, lng: 31.4 },
  US: { name: "United States", lat: 39.8, lng: -98.6 }, CA: { name: "Canada", lat: 56.1, lng: -106.3 }, MX: { name: "Mexico", lat: 23.6, lng: -102.5 },
  BR: { name: "Brazil", lat: -10.8, lng: -52.9 }, AR: { name: "Argentina", lat: -34.0, lng: -64.0 }, CL: { name: "Chile", lat: -35.7, lng: -71.5 },
  CN: { name: "China", lat: 35.0, lng: 103.0 }, JP: { name: "Japan", lat: 36.2, lng: 138.3 }, KR: { name: "South Korea", lat: 36.5, lng: 127.9 },
  IN: { name: "India", lat: 21.0, lng: 78.0 }, VN: { name: "Vietnam", lat: 16.0, lng: 107.8 }, TH: { name: "Thailand", lat: 15.0, lng: 101.0 },
  ID: { name: "Indonesia", lat: -2.5, lng: 118.0 }, MY: { name: "Malaysia", lat: 4.2, lng: 102.0 }, SG: { name: "Singapore", lat: 1.35, lng: 103.8 },
  AU: { name: "Australia", lat: -25.7, lng: 134.5 }, ZA: { name: "South Africa", lat: -29.0, lng: 24.0 }, EG: { name: "Egypt", lat: 26.8, lng: 30.8 },
  TW: { name: "Taiwan", lat: 23.7, lng: 121.0 }, HK: { name: "Hong Kong", lat: 22.3, lng: 114.2 }, PH: { name: "Philippines", lat: 12.9, lng: 122.0 },
  IL: { name: "Israel", lat: 31.5, lng: 34.9 }, PK: { name: "Pakistan", lat: 30.4, lng: 69.3 }, BD: { name: "Bangladesh", lat: 23.7, lng: 90.4 },
  NZ: { name: "New Zealand", lat: -41.0, lng: 172.5 }, LK: { name: "Sri Lanka", lat: 7.9, lng: 80.7 }, KH: { name: "Cambodia", lat: 12.6, lng: 104.9 },
  HR: { name: "Croatia", lat: 45.1, lng: 15.2 }, SI: { name: "Slovenia", lat: 46.1, lng: 14.8 }, LU: { name: "Luxembourg", lat: 49.8, lng: 6.1 },
  IS: { name: "Iceland", lat: 64.9, lng: -18.6 }, CY: { name: "Cyprus", lat: 35.1, lng: 33.4 }, MT: { name: "Malta", lat: 35.9, lng: 14.4 },
  RS: { name: "Serbia", lat: 44.0, lng: 21.0 }, BY: { name: "Belarus", lat: 53.7, lng: 28.0 }, KZ: { name: "Kazakhstan", lat: 48.0, lng: 67.0 },
  QA: { name: "Qatar", lat: 25.3, lng: 51.2 }, KW: { name: "Kuwait", lat: 29.3, lng: 47.5 }, OM: { name: "Oman", lat: 21.5, lng: 55.9 },
  CO: { name: "Colombia", lat: 4.6, lng: -74.1 }, PE: { name: "Peru", lat: -9.2, lng: -75.0 }, EC: { name: "Ecuador", lat: -1.4, lng: -78.4 },
  NG: { name: "Nigeria", lat: 9.1, lng: 8.7 }, KE: { name: "Kenya", lat: 0.0, lng: 37.9 }, TN: { name: "Tunisia", lat: 33.9, lng: 9.5 },
  DZ: { name: "Algeria", lat: 28.0, lng: 1.7 }, GH: { name: "Ghana", lat: 7.9, lng: -1.0 }, MM: { name: "Myanmar", lat: 21.9, lng: 96.0 },
  MA: { name: "Morocco", lat: 31.8, lng: -7.1 }, AE: { name: "United Arab Emirates", lat: 24.3, lng: 54.3 }, SA: { name: "Saudi Arabia", lat: 24.0, lng: 45.0 },
};

const C = (name: string, country: string, lat: number, lng: number) => ({ name, country, lat, lng });
export const CITIES = [
  C("Helsinki", "FI", 60.17, 24.94), C("Vantaa", "FI", 60.29, 25.04), C("Espoo", "FI", 60.21, 24.66), C("Tampere", "FI", 61.5, 23.76),
  C("Turku", "FI", 60.45, 22.27), C("Oulu", "FI", 65.01, 25.47), C("Kuopio", "FI", 62.89, 27.68), C("Vaasa", "FI", 63.1, 21.62),
  C("Porvoo", "FI", 60.39, 25.66), C("Kouvola", "FI", 60.87, 26.7), C("Hamina", "FI", 60.57, 27.2), C("Kajaani", "FI", 64.22, 27.73),
  C("Stockholm", "SE", 59.33, 18.07), C("Gothenburg", "SE", 57.71, 11.97), C("Molndal", "SE", 57.66, 12.01), C("Karlstad", "SE", 59.38, 13.5),
  C("Malmo", "SE", 55.6, 13.0), C("Jonkoping", "SE", 57.78, 14.16), C("Vaxjo", "SE", 56.88, 14.81),
  C("Copenhagen", "DK", 55.68, 12.57), C("Ballerup", "DK", 55.73, 12.36), C("Aarhus", "DK", 56.16, 10.2), C("Oslo", "NO", 59.91, 10.75),
  C("Tallinn", "EE", 59.44, 24.75), C("Riga", "LV", 56.95, 24.11), C("Vilnius", "LT", 54.69, 25.28),
  C("Gdansk", "PL", 54.35, 18.65), C("Warsaw", "PL", 52.23, 21.01), C("Lodz", "PL", 51.76, 19.46),
  C("Berlin", "DE", 52.52, 13.4), C("Hamburg", "DE", 53.55, 9.99), C("Dusseldorf", "DE", 51.23, 6.78), C("Duisburg", "DE", 51.43, 6.76),
  C("Munich", "DE", 48.14, 11.58), C("Frankfurt", "DE", 50.11, 8.68), C("Cologne", "DE", 50.94, 6.96), C("Mainz", "DE", 50.0, 8.27),
  C("Rotterdam", "NL", 51.92, 4.48), C("Amsterdam", "NL", 52.37, 4.9), C("Antwerp", "BE", 51.22, 4.4), C("Brussels", "BE", 50.85, 4.35),
  C("Paris", "FR", 48.86, 2.35), C("Lyon", "FR", 45.76, 4.84), C("London", "GB", 51.51, -0.13), C("Madrid", "ES", 40.42, -3.7),
  C("Barcelona", "ES", 41.39, 2.17), C("Milan", "IT", 45.46, 9.19), C("Vienna", "AT", 48.21, 16.37), C("Zurich", "CH", 47.37, 8.54),
  C("Prague", "CZ", 50.08, 14.44), C("Istanbul", "TR", 41.01, 28.98),
  C("Shanghai", "CN", 31.23, 121.47), C("Shenzhen", "CN", 22.54, 114.06), C("Ningbo", "CN", 29.87, 121.55), C("Singapore", "SG", 1.35, 103.82),
  C("Mumbai", "IN", 19.08, 72.88), C("Tokyo", "JP", 35.68, 139.69), C("Seoul", "KR", 37.57, 126.98), C("New York", "US", 40.71, -74.0),
  C("Los Angeles", "US", 34.05, -118.24), C("Chicago", "US", 41.88, -87.63), C("Sao Paulo", "BR", -23.55, -46.63), C("Dubai", "AE", 25.2, 55.27),
  C("Johannesburg", "ZA", -26.2, 28.05), C("Sydney", "AU", -33.87, 151.21),
];

/** Lowercase, strip diacritics and punctuation so "Düsseldorf", "Dusseldorf" and "düsseldorf " match. */
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const CITY_INDEX = new Map<string, typeof CITIES>();
for (const c of CITIES) CITY_INDEX.set(norm(c.name), [...(CITY_INDEX.get(norm(c.name)) ?? []), c]);

export function lookupCity(city: string | null | undefined, country?: string | null): (LatLng & { name: string; country: string }) | null {
  if (!city) return null;
  const hits = CITY_INDEX.get(norm(city));
  if (!hits?.length) return null;
  return (country ? hits.find((h) => h.country === country.toUpperCase()) : undefined) ?? hits[0]!;
}

/** City if known, else the country centroid (precision COUNTRY), else null (not placeable). */
export function locate(city: string | null | undefined, country: string | null | undefined): (LatLng & { precision: Precision; city: string | null }) | null {
  const c = lookupCity(city, country);
  if (c) return { lat: c.lat, lng: c.lng, precision: "CITY", city: c.name };
  const k = country ? COUNTRIES[country.toUpperCase()] : undefined;
  return k ? { lat: k.lat, lng: k.lng, precision: "COUNTRY", city: null } : null;
}

export const PORTS: Record<string, { name: string } & LatLng> = {
  NLRTM: { name: "Rotterdam", lat: 51.95, lng: 4.14 }, BEANR: { name: "Antwerp", lat: 51.27, lng: 4.34 }, DEHAM: { name: "Hamburg", lat: 53.54, lng: 9.97 },
  FIHEL: { name: "Helsinki", lat: 60.16, lng: 24.96 }, FIOUL: { name: "Oulu", lat: 65.0, lng: 25.4 }, FIVAA: { name: "Vaasa", lat: 63.08, lng: 21.57 },
  FIHAM: { name: "Hamina-Kotka", lat: 60.5, lng: 27.0 }, SEGOT: { name: "Gothenburg", lat: 57.69, lng: 11.9 }, DKCPH: { name: "Copenhagen", lat: 55.7, lng: 12.6 },
  DKAAR: { name: "Aarhus", lat: 56.15, lng: 10.22 }, PLGDN: { name: "Gdansk", lat: 54.4, lng: 18.67 }, EETLL: { name: "Tallinn", lat: 59.45, lng: 24.77 },
  LVRIX: { name: "Riga", lat: 57.0, lng: 24.07 }, DEDUI: { name: "Duisburg", lat: 51.45, lng: 6.74 }, BEZEE: { name: "Zeebrugge", lat: 51.33, lng: 3.2 },
  LTKLJ: { name: "Klaipeda", lat: 55.7, lng: 21.13 }, FRLEH: { name: "Le Havre", lat: 49.5, lng: 0.1 }, GBFXT: { name: "Felixstowe", lat: 51.95, lng: 1.32 },
  ESVLC: { name: "Valencia", lat: 39.45, lng: -0.32 }, ITGOA: { name: "Genoa", lat: 44.41, lng: 8.92 }, NOOSL: { name: "Oslo", lat: 59.91, lng: 10.75 },
  IEDUB: { name: "Dublin", lat: 53.35, lng: -6.2 }, PTSIE: { name: "Sines", lat: 37.95, lng: -8.86 }, GRPIR: { name: "Piraeus", lat: 37.94, lng: 23.64 },
  TRMER: { name: "Mersin", lat: 36.8, lng: 34.65 }, ROCND: { name: "Constanta", lat: 44.17, lng: 28.65 }, SIKOP: { name: "Koper", lat: 45.55, lng: 13.73 },
  HRRJK: { name: "Rijeka", lat: 45.32, lng: 14.45 }, CNSHA: { name: "Shanghai", lat: 31.23, lng: 121.5 }, CNNGB: { name: "Ningbo", lat: 29.87, lng: 121.55 },
  SGSIN: { name: "Singapore", lat: 1.28, lng: 103.85 }, KRPUS: { name: "Busan", lat: 35.1, lng: 129.04 }, JPYOK: { name: "Yokohama", lat: 35.45, lng: 139.64 },
  INNSA: { name: "Nhava Sheva", lat: 18.95, lng: 72.95 }, AEJEA: { name: "Jebel Ali", lat: 24.99, lng: 55.06 }, USLAX: { name: "Los Angeles", lat: 33.74, lng: -118.26 },
  USNYC: { name: "New York", lat: 40.67, lng: -74.05 }, CAVAN: { name: "Vancouver", lat: 49.29, lng: -123.1 }, BRSSZ: { name: "Santos", lat: -23.95, lng: -46.33 },
  ZADUR: { name: "Durban", lat: -29.88, lng: 31.04 }, AUMEL: { name: "Melbourne", lat: -37.82, lng: 144.92 },
};

export const REGION_NAMES: Record<string, string> = {
  "NL-ZH": "South Holland", "DE-NW": "North Rhine-Westphalia", "DE-HH": "Hamburg", "DE-RP": "Rhineland-Palatinate", "FI-UUS": "Uusimaa",
  "FI-PIR": "Pirkanmaa", "FI-POS": "North Ostrobothnia", "FI-POH": "Ostrobothnia", "FI-KYM": "Kymenlaakso", "DK-84": "Capital Region of Denmark",
  "DK-82": "Central Jutland", "BE-VAN": "Antwerp province", "SE-O": "Vastra Gotaland", "SE-S": "Varmland", "SE-F": "Jonkoping county",
  "EE-37": "Harju county", "PL-PM": "Pomerania", "PL-LD": "Lodz voivodeship", "LV-RIX": "Riga",
};

/** Plain-language label for a footprint key, e.g. PORT:NLRTM -> "Port of Rotterdam". Falls back to the raw value. */
export function placeLabel(type: string, value: string): string {
  if (type === "PORT") {
    if (PORTS[value]) return `Port of ${PORTS[value]!.name}`;
    // ports from the public data pack are "<country>-<NAME>" (spaces as "_"), e.g. TW-KAOHSIUNG
    const m = value.match(/^[A-Z]{2}-(.+)$/);
    if (m) return `Port of ${m[1]!.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")}`;
    return `Port ${value}`;
  }
  if (type === "REGION") {
    const base = REGION_NAMES[value];
    const country = COUNTRIES[value.slice(0, 2)]?.name;
    if (base) return country && !value.includes("-") ? base : `${base}${country ? `, ${country}` : ""}`;
    return COUNTRIES[value]?.name ?? value;
  }
  if (type === "SANCTION") return `${value} sanctions`;
  if (type === "PARENT") return "a shared owner";
  return value;
}

const TYPE_NOUN: Record<string, string> = {
  STRIKE: "Strike", FIRE: "Fire", RECALL: "Product recall", SANCTION: "New sanctions", INSOLVENCY: "Insolvency",
  PORT_CLOSURE: "Port closure", WEATHER: "Severe weather", CYBER: "Cyber attack", OTHER: "Disruption",
};
export const incidentTypeLabel = (type: string) => TYPE_NOUN[type] ?? "Disruption";

/** "Strike at Port of Rotterdam": plain-language headline from an incident type and its keys. */
export function incidentHeadline(type: string, keys: Array<{ type: string; value: string; state?: string }>): string {
  const real = keys.filter((k) => k.state !== "UNKNOWN" && k.value !== "?");
  const place = real.find((k) => k.type === "PORT") ?? real.find((k) => k.type === "REGION") ?? real.find((k) => k.type === "SANCTION");
  return place ? `${incidentTypeLabel(type)} at ${placeLabel(place.type, place.value)}` : incidentTypeLabel(type);
}

/** Where to pulse a disruption on the map: its port if known, else null. */
export function incidentPoint(keys: Array<{ type: string; value: string; state?: string }>): (LatLng & { label: string }) | null {
  const p = keys.find((k) => k.type === "PORT" && PORTS[k.value]);
  return p ? { ...PORTS[p.value]!, label: placeLabel("PORT", p.value) } : null;
}
