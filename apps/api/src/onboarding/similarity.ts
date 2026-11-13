/** Name and domain normalisation + similarity. Pure, no I/O. */

const LEGAL_SUFFIXES = new Set([
  "oy", "oyj", "ab", "as", "asa", "a/s", "aps", "gmbh", "ag", "kg", "bv", "b.v.", "nv", "n.v.", "sia", "ou", "oü", "sp", "zoo",
  "z", "o", "ltd", "limited", "inc", "llc", "plc", "sa", "spa", "srl", "co", "corp", "company", "group", "holding",
]);

/** Lowercase, strip accents/punctuation, drop legal-form words. "Nordpack Packaging GmbH" -> ["nordpack","packaging"]. */
export function nameTokens(name: string): string[] {
  const ascii = name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/(^|[^a-z])a[/]s(?![a-z])/g, "$1as")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const toks = ascii.split(/\s+/).filter(Boolean);
  const kept = toks.filter((t) => !LEGAL_SUFFIXES.has(t));
  return kept.length ? kept : toks;
}

const bigrams = (s: string) => {
  const out: string[] = [];
  for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2));
  return out;
};

const dice = (a: string[], b: string[]) => {
  if (!a.length || !b.length) return 0;
  const counts = new Map<string, number>();
  for (const x of a) counts.set(x, (counts.get(x) ?? 0) + 1);
  let hit = 0;
  for (const y of b) {
    const n = counts.get(y) ?? 0;
    if (n > 0) { hit++; counts.set(y, n - 1); }
  }
  return (2 * hit) / (a.length + b.length);
};

/** 0..1. Max of token-set Dice and character-bigram Dice over the normalised names. Identical normalised names give 1. */
export function nameSimilarity(a: string, b: string): number {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (!ta.length || !tb.length) return 0;
  if (ta.join(" ") === tb.join(" ")) return 1;
  const tokenDice = dice(ta, tb);
  const charDice = dice(bigrams(ta.join(" ")), bigrams(tb.join(" ")));
  return Math.max(tokenDice, charDice);
}

/** "https://www.Example.com/about" -> "example.com". Returns null for empty or unusable input. */
export function normalizeDomain(input: string | null | undefined): string | null {
  if (!input) return null;
  let s = input.trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/^[a-z]+:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0]!.replace(/:\d+$/, "");
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(s) ? s : null;
}

export function normalizeCountry(input: string | null | undefined): string | null {
  const s = (input ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(s) ? s : null;
}
