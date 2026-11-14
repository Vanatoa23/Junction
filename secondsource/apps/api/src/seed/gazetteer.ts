/** Small fixed gazetteer for the rule-based classifier (SEED mode). Real-world names/codes, nothing fetched. */
export const PORTS: Array<{ name: string; locode: string; region: string }> = [
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
