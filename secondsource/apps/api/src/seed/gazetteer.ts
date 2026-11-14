/** Small fixed gazetteer for the rule-based classifier (SEED mode). Real-world names/codes, nothing fetched. */
export interface PortEntry { name: string; locode: string; /** null = do not infer a region (country-level regions would over-match) */ region: string | null }
export const PORTS: PortEntry[] = [
  { name: "Rotterdam", locode: "NLRTM", region: "NL-ZH" },
  { name: "Antwerp", locode: "BEANR", region: "BE-VAN" },
  { name: "Hamburg", locode: "DEHAM", region: "DE-HH" },
  { name: "Helsinki", locode: "FIHEL", region: "FI-UUS" },
  { name: "Oulu", locode: "FIOUL", region: "FI-POS" },
  { name: "Gothenburg", locode: "SEGOT", region: "SE-O" },
  { name: "Copenhagen", locode: "DKCPH", region: "DK-84" },
  { name: "Gdansk", locode: "PLGDN", region: "PL-PM" },
  { name: "Tallinn", locode: "EETLL", region: "EE-37" },
];

export const SANCTION_PROGRAMMES: Array<{ pattern: RegExp; id: string }> = [
  { pattern: /\bEU\b.*\b(russia|russian)\b.*sanction|sanction.*\b(russia|russian)\b/i, id: "EU-RU" },
];

/**
 * Ports from the public data pack (table `port`, ids like TW-KAOHSIUNG) are registered at runtime so a notice about, say,
 * Kaohsiung is understood. They carry no region: a port closure does not close a whole country.
 */
let extra: PortEntry[] = [];
export function setExtraPorts(list: Array<{ id: string; name: string }>) {
  const known = new Set(PORTS.map((p) => p.name.toLowerCase()));
  extra = list.filter((p) => !known.has(p.name.toLowerCase())).map((p) => ({ name: p.name, locode: p.id, region: null }));
}
export const allPorts = (): PortEntry[] => [...PORTS, ...extra];
